import { bound } from "../utils/math/bounds"
import { Elements } from "../types"
import { StateHandler } from "./state"

export class VolumeController {
  private media: HTMLMediaElement
  private elements: Elements
  private state: StateHandler

  constructor(
    media: HTMLMediaElement,
    elements: Elements,
    state: StateHandler,
  ) {
    this.media = media
    this.elements = elements
    this.state = state
  }

  public mute(): void {
    this.state.setState({ muted: true })
    this.media.muted = true
    if (this.elements.soundBar) {
      this.elements.soundBar.value = 0
    }
  }

  public unmute(): void {
    this.state.setState({ muted: false })
    this.media.muted = false

    if (this.media.volume === 0) this.volume = 1

    if (this.elements.soundBar) {
      this.elements.soundBar.value = this.volume
    }
  }

  public toggleMute(state?: boolean): void {
    if (typeof state === "boolean") {
      state ? this.unmute() : this.mute()
    } else {
      this.muted ? this.unmute() : this.mute()
    }
  }

  get volume(): number {
    return this.media.volume
  }

  set volume(value: number) {
    const boundedValue = bound(value, 0, 1)

    if (this.elements.soundBar) {
      this.elements.soundBar.value = boundedValue
    }

    if (this.media.volume !== boundedValue) {
      this.media.volume = boundedValue

      if (this.muted && boundedValue > 0) {
        this.unmute()
      }
    }
  }

  get muted(): boolean {
    return this.media.muted || this.media.volume === 0
  }

  public setInitialVolume(volume: number = 1, muted: boolean = false): void {
    this.volume = volume

    if (muted) {
      this.mute()
    }
  }
}
