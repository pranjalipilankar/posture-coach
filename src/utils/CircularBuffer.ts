// CircularBuffer — stores last N values, overwrites oldest when full
// Used to smooth noisy angle data from MediaPipe landmarks

export class CircularBuffer {
    private buffer: number[]
    private size: number
    private index: number   // points to next write position
    private count: number   // how many values have been added (up to size)
  
    constructor(size: number) {
      this.size = size
      this.buffer = new Array(size).fill(0)
      this.index = 0
      this.count = 0
    }
  
    // Add a new value — overwrites oldest if buffer is full
    push(value: number): void {
      this.buffer[this.index] = value
      this.index = (this.index + 1) % this.size  // wrap around: 0,1,2,...,N-1,0,1...
      this.count = Math.min(this.count + 1, this.size)
    }
  
    // Average of all stored values
    average(): number {
      if (this.count === 0) return 0
      const sum = this.buffer.slice(0, this.count).reduce((a, b) => a + b, 0)
      return sum / this.count
    }
  
    // Not enough data yet — don't make decisions on 1-2 frames
    isFull(): boolean {
      return this.count === this.size
    }
  }