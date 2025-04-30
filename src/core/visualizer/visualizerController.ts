import { EventBus } from "../../utils/eventBus/eventBus"
import Visualizer from "../../visualizer"
import { VisualizerOptions } from "../../types"

export class VisualizerController {
  private visualizer: Visualizer | null = null
  private mediaElement: HTMLMediaElement
  private container: HTMLElement
  private options: VisualizerOptions | null = null
  private animationFrameId: number | null = null
  private eventBus: EventBus
  private isEnabled: boolean = false
  private boundUpdateVisualizer: (timestamp: number) => void

  constructor(
    mediaElement: HTMLMediaElement,
    container: HTMLElement,
    eventBus: EventBus,
    options?: VisualizerOptions,
  ) {
    this.mediaElement = mediaElement
    this.container = container
    this.eventBus = eventBus
    this.options = options || null

    if (options) {
      this.initialize(options)
    }

    this.eventBus.on("play", this.onPlay.bind(this))
    this.eventBus.on("pause", this.onPause.bind(this))
    this.boundUpdateVisualizer = this.updateVisualizer.bind(this)
  }

  public initialize(options: VisualizerOptions): boolean {
    this.options = options

    try {
      this.visualizer = new Visualizer({
        container: this.container,
        media: this.mediaElement,
        options: options,
      })

      this.isEnabled = this.visualizer.initialized

      if (this.isEnabled) {
        this.eventBus.emit("visualizerInitialized", {
          visualizer: this.visualizer,
        })
      } else {
        this.eventBus.emit("visualizerError", {
          message: "Failed to initialize visualizer",
        })
      }

      return this.isEnabled
    } catch (error) {
      this.eventBus.emit("visualizerError", {
        message: "Error initializing visualizer",
        error,
      })
      return false
    }
  }

  private updateVisualizer(timestamp: number = 0): void {
    if (!this.visualizer?.initialized || !this.isEnabled) return

    const isPaused = this.mediaElement.paused
    const frequencies = this.visualizer.update(isPaused, timestamp)

    if (!isPaused || (isPaused && this.hasActiveFrequencies(frequencies))) {
      this.animationFrameId = requestAnimationFrame(this.boundUpdateVisualizer)
    } else {
      this.stopAnimation()
    }
  }

  private hasActiveFrequencies(frequencies: number[]): boolean {
    const len = frequencies.length
    for (let i = 0; i < len; i++) {
      if (frequencies[i] > 0) return true
    }
    return false
  }

  public startAnimation(): void {
    // Only start if not already running
    if (this.animationFrameId === null && this.isEnabled) {
      this.updateVisualizer()
    }
  }

  public stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled && !!this.visualizer?.initialized

    if (this.isEnabled) {
      this.startAnimation()
    } else {
      this.stopAnimation()
    }

    this.eventBus.emit("visualizerEnabledChanged", { enabled: this.isEnabled })
  }

  public updateOptions(options: Partial<VisualizerOptions>): boolean {
    if (!this.options || !this.visualizer) return false
    this.visualizer.dispose()
    this.options = { ...this.options, ...options }
    return this.initialize(this.options)
  }

  public get enabled() {
    return this.isEnabled
  }

  private onPlay(): void {
    if (this.isEnabled) {
      this.startAnimation()
    }
  }

  private onPause(): void {
    // We don't stop immediately on pause to allow visualizer to finish rendering
    // The animation loop will stop naturally if there's no audio activity
  }

  public dispose(): void {
    this.stopAnimation()
    this.visualizer?.dispose()
    this.visualizer = null

    this.eventBus.off("play", this.onPlay.bind(this))
    this.eventBus.off("pause", this.onPause.bind(this))
  }

  public getVisualizer(): Visualizer | null {
    return this.visualizer
  }

  public isInitialized(): boolean {
    return !!this.visualizer?.initialized
  }
}
