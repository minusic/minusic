import { EventBus } from "../utils/eventBus/eventBus"
import { ErrorDisplay } from "../components/ui/errorDisplay"

export class ErrorManager {
  private eventBus: EventBus
  private errorDisplay: ErrorDisplay

  constructor(eventBus: EventBus, container: HTMLElement) {
    this.eventBus = eventBus
    this.errorDisplay = new ErrorDisplay(container)
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.eventBus.on("sourceError", this.handleSourceError.bind(this))
    this.eventBus.on("trackLoadError", this.handleTrackLoadError.bind(this))
    this.eventBus.on("sourceLoaded", this.handleSourceLoaded.bind(this))
  }

  private handleSourceError(data: {
    track: any
    error: string
    attemptCount: number
  }): void {
    const message = data.track?.metadata?.title
      ? `Error loading "${data.track.metadata.title}": ${data.error}`
      : `Audio error: ${data.error}`

    this.errorDisplay.show(message)
  }

  private handleTrackLoadError(data: {
    track: any
    index: number
    error: string
  }): void {
    const title = data.track?.metadata?.title || `Track ${data.index + 1}`
    this.errorDisplay.show(`Cannot play "${title}": ${data.error}`)
  }

  private handleSourceLoaded(): void {
    this.errorDisplay.hide()
  }

  public dispose(): void {
    this.eventBus.off("sourceError", this.handleSourceError.bind(this))
    this.eventBus.off("trackLoadError", this.handleTrackLoadError.bind(this))
    this.eventBus.off("sourceLoaded", this.handleSourceLoaded.bind(this))
  }
}
