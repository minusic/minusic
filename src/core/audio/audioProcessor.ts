export class AudioProcessor {
  private media: HTMLMediaElement
  private audioContext!: AudioContext
  private audioSource!: MediaElementAudioSourceNode
  private analyser!: AnalyserNode
  private initialized: boolean = false

  constructor(media: HTMLMediaElement) {
    this.media = media
  }

  initialize() {
    if (this.initialized) return true
    try {
      const audioContext = this.getAudioContext()
      if (!audioContext) return false

      this.audioContext = new audioContext()
      this.audioSource = this.audioContext.createMediaElementSource(this.media)
      this.analyser = this.audioContext.createAnalyser()

      this.audioSource
        .connect(this.analyser)
        .connect(this.audioContext.destination)

      this.initialized = true
      return true
    } catch (error) {
      console.warn("Failed to initialize AudioProcessor:", error)
      this.cleanup()
      return false
    }
  }

  isInitialized(): boolean {
    return this.initialized
  }

  getFrequencyData(paused: boolean): Uint8Array {
    if (paused) {
      return new Uint8Array(256).fill(0)
    }

    const frequencies = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(frequencies)
    return frequencies
  }

  dispose(): void {
    if (this.initialized) {
      this.cleanup()
      this.initialized = false
    }
  }

  private getAudioContext(): typeof AudioContext | null {
    if (typeof AudioContext !== "undefined") {
      return AudioContext
    } else if (typeof window !== "undefined" && window.AudioContext) {
      return window.AudioContext
    } else if (
      typeof window !== "undefined" &&
      (window as any).webkitAudioContext
    ) {
      return (window as any).webkitAudioContext
    } else if (typeof (globalThis as any).webkitAudioContext !== "undefined") {
      return (globalThis as any).webkitAudioContext
    }
    return null
  }

  private cleanup(): void {
    try {
      if (this.audioSource) {
        this.audioSource.disconnect()
        this.audioSource = undefined as any
      }

      if (this.analyser) {
        this.analyser.disconnect()
        this.analyser = undefined as any
      }

      if (this.audioContext && this.audioContext.state !== "closed") {
        this.audioContext.close()
        this.audioContext = undefined as any
      }
    } catch (err) {
      console.warn("Error disposing AudioProcessor:", err)
    }
  }
}
