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
    this.audioContext = new (window.AudioContext || null)()
    if (this.audioContext === null) {
      return false
    }

    this.audioSource = this.audioContext.createMediaElementSource(this.media)
    this.analyser = this.audioContext.createAnalyser()

    this.audioSource
      .connect(this.analyser)
      .connect(this.audioContext.destination)

    this.initialized = true
    return true
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
}
