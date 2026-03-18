import { useRef, useEffect, useState } from "react"
import { CircularBuffer } from "../utils/CircularBuffer"
import { PostureFSM, type PostureState } from "../utils/PostureFSM"
//import { useSession } from "../hooks/useSession"

declare global {
  interface Window {
    Pose: any
    Camera: any
    POSE_CONNECTIONS: any
  }

  interface CameraProps {
    sendSnapshot:    (data: { neckTilt: number; shoulderLevel: number; sideLean: number; isGood: boolean; state: PostureState }) => void
    sessionScore:    number
    sessionDuration: number
  }
}

const LEFT_EAR       = 7
const RIGHT_EAR      = 8
const LEFT_SHOULDER  = 11
const RIGHT_SHOULDER = 12
const LEFT_HIP       = 23
const RIGHT_HIP      = 24

const NECK_TILT_THRESHOLD      = 0.15
const SHOULDER_LEVEL_THRESHOLD = 0.10
const SIDE_LEAN_THRESHOLD      = 0.05

const CHECKS = {
  neckTilt:      "Neck tilt",
  shoulderLevel: "Shoulder level",
  sideLean:      "Side lean",
}

type CheckResult = {
  neckTilt:      number
  shoulderLevel: number
  sideLean:      number
}

type CheckStatus = Record<keyof CheckResult, boolean>

const STATE_COLOR: Record<PostureState, string> = {
  GOOD:     "#10b981",
  BAD:      "#f59e0b",
  ALERTING: "#ef4444",
}

function Camera({ sendSnapshot, sessionScore, sessionDuration }: CameraProps) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [postureState, setPostureState] = useState<PostureState>("GOOD")
  const [checks, setChecks]             = useState<CheckStatus>({
    neckTilt: true, shoulderLevel: true, sideLean: true
  })
  const [status, setStatus] = useState<string>("Loading model...")

  const prevStateRef     = useRef<PostureState>("GOOD")
  const lastCheckTimeRef = useRef<number>(0)

  const neckTiltBuffer      = useRef(new CircularBuffer(10))
  const shoulderLevelBuffer = useRef(new CircularBuffer(10))
  const sideLeanBuffer      = useRef(new CircularBuffer(10))

  const fsmRef = useRef(new PostureFSM(3))

  useEffect(() => {
    function waitForMediaPipe(callback: () => void) {
      if (window.Pose && window.Camera) callback()
      else setTimeout(() => waitForMediaPipe(callback), 100)
    }

    waitForMediaPipe(() => {
      if (!videoRef.current || !canvasRef.current) return
      setStatus("Stand facing the camera — upper body visible")

      const pose = new window.Pose({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`
      })

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })

      pose.onResults((results: any) => {
        const freshState = analyzePosture(results)
        drawSkeleton(results, freshState)
      })

      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) await pose.send({ image: videoRef.current })
        },
        width: 640,
        height: 480
      })

      camera.start()
      return () => { camera.stop(); pose.close() }
    })
  }, [])


  function analyzePosture(results: any): PostureState {
    if (!results.poseLandmarks) return prevStateRef.current

    const lm = results.poseLandmarks

    const needed = [LEFT_EAR, RIGHT_EAR, LEFT_SHOULDER, RIGHT_SHOULDER]
    const lowVis = needed.filter((i) => lm[i].visibility < 0.3)
    if (lowVis.length > 0) return prevStateRef.current

    const leftNeckTilt   = Math.abs(lm[LEFT_EAR].y  - lm[LEFT_SHOULDER].y)
    const rightNeckTilt  = Math.abs(lm[RIGHT_EAR].y - lm[RIGHT_SHOULDER].y)
    const rawNeckTilt    = Math.abs(leftNeckTilt - rightNeckTilt)

    const rawShoulderLevel = Math.abs(lm[LEFT_SHOULDER].y - lm[RIGHT_SHOULDER].y)

    const hipsVisible  = lm[LEFT_HIP].visibility > 0.5 && lm[RIGHT_HIP].visibility > 0.5
    const shoulderMidX = (lm[LEFT_SHOULDER].x + lm[RIGHT_SHOULDER].x) / 2
    const rawSideLean  = hipsVisible
      ? Math.abs(shoulderMidX - (lm[LEFT_HIP].x + lm[RIGHT_HIP].x) / 2)
      : 0

    neckTiltBuffer.current.push(rawNeckTilt)
    shoulderLevelBuffer.current.push(rawShoulderLevel)
    sideLeanBuffer.current.push(rawSideLean)

    const now = Date.now()
    if (now - lastCheckTimeRef.current < 2000) return prevStateRef.current
    lastCheckTimeRef.current = now

    if (!neckTiltBuffer.current.isFull()) return prevStateRef.current

    const smoothed: CheckResult = {
      neckTilt:      neckTiltBuffer.current.average(),
      shoulderLevel: shoulderLevelBuffer.current.average(),
      sideLean:      sideLeanBuffer.current.average(),
    }

    const checkStatus: CheckStatus = {
      neckTilt:      smoothed.neckTilt      < NECK_TILT_THRESHOLD,
      shoulderLevel: smoothed.shoulderLevel < SHOULDER_LEVEL_THRESHOLD,
      sideLean:      !hipsVisible || smoothed.sideLean < SIDE_LEAN_THRESHOLD,
    }

    const isGood   = Object.values(checkStatus).every(Boolean)
    const newState = fsmRef.current.update(isGood)

    // ✅ Buffer snapshot locally — flushed to MongoDB every 60s
    sendSnapshot({
      neckTilt:      smoothed.neckTilt,
      shoulderLevel: smoothed.shoulderLevel,
      sideLean:      smoothed.sideLean,
      isGood,
      state: newState
    })

    const failed = (Object.keys(checkStatus) as (keyof CheckResult)[])
      .filter(key => !checkStatus[key])
      .map(key => CHECKS[key])

    setStatus(failed.length === 0 ? "✓ Good posture — keep it up" : `Fix: ${failed.join(" · ")}`)
    setChecks(checkStatus)

    if (newState !== prevStateRef.current) {
      prevStateRef.current = newState
      setPostureState(newState)
    }

    return newState
  }


  function drawSkeleton(results: any, freshState: PostureState) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!results.poseLandmarks) return

    const lm    = results.poseLandmarks
    const color = STATE_COLOR[freshState]

    ctx.strokeStyle = color
    ctx.lineWidth   = 2
    window.POSE_CONNECTIONS.forEach(([s, e]: [number, number]) => {
      if (lm[s].visibility < 0.5 || lm[e].visibility < 0.5) return
      ctx.beginPath()
      ctx.moveTo(lm[s].x * canvas.width, lm[s].y * canvas.height)
      ctx.lineTo(lm[e].x * canvas.width, lm[e].y * canvas.height)
      ctx.stroke()
    })

    lm.forEach((l: any) => {
      if (l.visibility < 0.5) return
      ctx.beginPath()
      ctx.arc(l.x * canvas.width, l.y * canvas.height, 4, 0, 2 * Math.PI)
      ctx.fillStyle = "#ffffff"
      ctx.fill()
    })
  }


  const color = STATE_COLOR[postureState]

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>

      <p style={{ fontFamily: "monospace", fontSize: "0.8rem", color, transition: "color 0.3s", minHeight: "1.2rem" }}>
        {status}
      </p>

      <div style={{ display: "flex", gap: "20px", fontFamily: "monospace", fontSize: "0.75rem" }}>
        {(Object.keys(CHECKS) as (keyof CheckResult)[]).map((key) => (
          <span key={key} style={{ color: checks[key] ? "#10b981" : "#ef4444" }}>
            {checks[key] ? "✓" : "✗"} {CHECKS[key]}
          </span>
        ))}
      </div>

      {/* Session stats — pulled from backend */}
      <div style={{ display: "flex", gap: "24px", fontFamily: "monospace", fontSize: "0.75rem", color: "#64748b" }}>
        <span>session score: <span style={{ color }}>{sessionScore}%</span></span>
        <span>duration: <span style={{ color: "#e2e8f0" }}>{sessionDuration}m</span></span>
        <span style={{ color }}>state: {postureState}</span>
      </div>

      <div style={{ position: "relative", display: "inline-block" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: "640px",
            height: "480px",
            borderRadius: "12px",
            border: `2px solid ${color}`,
            transform: "scaleX(-1)",
            transition: "border-color 0.3s"
          }}
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{
            position: "absolute",
            top: 0, left: 0,
            borderRadius: "12px",
            transform: "scaleX(-1)",
            pointerEvents: "none"
          }}
        />
      </div>

    </div>
  )
}

export default Camera