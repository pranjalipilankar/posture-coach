import { useRef, useEffect, useState } from "react"
import api from "../services/api"

interface SnapshotData {
  neckTilt:      number
  shoulderLevel: number
  sideLean:      number
  isGood:        boolean
  state:         "GOOD" | "BAD" | "ALERTING"
}

interface UseSessionReturn {
  sessionId:       string | null
  sendSnapshot:    (data: SnapshotData) => void
  sessionScore:    number
  sessionDuration: number
}

export function useSession(): UseSessionReturn {
  const [sessionId, setSessionId]             = useState<string | null>(null)
  const [sessionScore, setSessionScore]       = useState<number>(100)
  const [sessionDuration, setSessionDuration] = useState<number>(0)

  const snapshotBuffer = useRef<SnapshotData[]>([])
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null)

  // Ref for sessionId — interval closure captures the ref object not its value
  // So it always sees the latest sessionId, not the stale initial null
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    startSession()

    intervalRef.current = setInterval(() => {
      flushSnapshots()
    }, 60000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      flushSnapshots()
    }
  }, [])

  async function startSession(): Promise<void> {
    try {
      const res = await api.post("/api/sessions/start")
      sessionIdRef.current = res.data.sessionId  // ref updates immediately
      setSessionId(res.data.sessionId)            // state for returning to component
      console.log("✅ Session started:", res.data.sessionId)
    } catch (error) {
      console.error("Failed to start session:", error)
    }
  }

  function sendSnapshot(data: SnapshotData): void {
    snapshotBuffer.current.push(data)
  }

  async function flushSnapshots(): Promise<void> {
    // Use ref — always has current sessionId even inside interval closure
    if (!sessionIdRef.current || snapshotBuffer.current.length === 0) return

    const snapshots = [...snapshotBuffer.current]
    snapshotBuffer.current = []

    try {
      for (const snapshot of snapshots) {
        const res = await api.post(`/api/sessions/${sessionIdRef.current}/snapshot`, snapshot)
        setSessionScore(res.data.avgScore)
        setSessionDuration(res.data.duration)
      }
      console.log(`✅ Flushed ${snapshots.length} snapshots`)
    } catch (error) {
      console.error("Failed to flush snapshots:", error)
      // Restore snapshots if flush failed — will retry next interval
      snapshotBuffer.current = [...snapshots, ...snapshotBuffer.current]
    }
  }

  return { sessionId, sendSnapshot, sessionScore, sessionDuration }
}