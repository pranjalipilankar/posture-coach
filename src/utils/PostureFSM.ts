// PostureFSM — Finite State Machine for posture state tracking
// Prevents alert-spamming by requiring N consecutive bad frames

export type PostureState = "GOOD" | "BAD" | "ALERTING"

export class PostureFSM {
  private state: PostureState = "GOOD"
  private badFrameCount: number = 0
  private readonly alertThreshold: number  // consecutive bad frames before alerting

  constructor(alertThreshold: number = 30) {
    this.alertThreshold = alertThreshold
  }

  // Feed each frame's result — returns current state
  update(isGoodPosture: boolean): PostureState {
    if (isGoodPosture) {
      // Reset on any good frame
      this.badFrameCount = 0
      this.state = "GOOD"
    } else {
      this.badFrameCount++

      if (this.badFrameCount >= this.alertThreshold) {
        this.state = "ALERTING"  // sustained bad posture
      } else {
        this.state = "BAD"       // bad but not long enough to alert yet
      }
    }

    return this.state
  }

  getState(): PostureState {
    return this.state
  }

  // How long has bad posture been sustained (in frames)
  getBadFrameCount(): number {
    return this.badFrameCount
  }
}