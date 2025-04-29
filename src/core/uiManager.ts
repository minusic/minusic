import { Elements, TrackConfig } from "../types"
import { StateHandler } from "./state"

export class UIManager {
  private elements: Elements
  private media: HTMLMediaElement
  private state: StateHandler

  constructor(
    elements: Elements,
    media: HTMLMediaElement,
    state: StateHandler,
  ) {
    this.elements = elements
    this.media = media
    this.state = state
  }

  public showControls(): void {
    this.state.setState({ controls: true })
  }

  public hideControls(): void {
    this.state.setState({ controls: false })
  }

  public showNativeControls(): void {
    this.media.setAttribute("controls", "")
  }

  public hideNativeControls(): void {
    this.media.removeAttribute("controls")
  }

  public toggleControls(): void {
    const hasControls = this.state.getState("controls")
    if (hasControls) {
      this.hideControls()
    } else {
      this.showControls()
    }
  }

  public updateMetadata(track: TrackConfig): void {
    if (!this.elements.title) return

    this.elements.title.innerText = track.title || ""
    if (this.elements.author)
      this.elements.author.innerText = track.author || ""
    if (this.elements.album) this.elements.album.innerText = track.album || ""
    if (this.elements.thumbnail)
      this.elements.thumbnail.src = track.thumbnail || ""
  }

  public updateWaveform(track: { waveform?: string }): void {
    if (this.elements.progress?.timeBar) {
      this.elements.progress.timeBar.background = track.waveform
    }
  }

  public applyInitialSettings(
    showNativeControls: boolean = false,
    showControls: boolean = true,
  ): void {
    if (showNativeControls) this.showNativeControls()
    else this.hideNativeControls()

    if (showControls) this.showControls()
    else this.hideControls()
  }
}
