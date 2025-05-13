import { StateHandler } from "./state"

export class UIManager {
  private media: HTMLMediaElement
  private state: StateHandler

  constructor(media: HTMLMediaElement, state: StateHandler) {
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
