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
