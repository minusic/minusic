import { bound } from "../utils/math/bounds"
import { EventBus } from "../utils/eventBus/event-bus"
import { StateHandler } from "./state"

export class PlaybackController {
  private media: HTMLMediaElement
  private eventBus: EventBus
  private state: StateHandler
  private skipDuration: number

  constructor(
    media: HTMLMediaElement,
    eventBus: EventBus,
    state: StateHandler,
    skipDuration: number = 15,
  ) {
    this.media = media
    this.eventBus = eventBus
    this.state = state
    this.skipDuration = skipDuration
  }

  public play(): Promise<void> {
    return this.media.play()
  }

  public pause(): void {
    this.media.pause()
  }

  public stop(): void {
    this.pause()
    this.currentTime = 0
  }

  public restart(): void {
    this.currentTime = 0
    this.play()
  }

  public togglePlay(state?: boolean): Promise<void> | void {
    if (typeof state === "boolean") {
      return state ? this.play() : this.pause()
    }
    return this.media.paused ? this.play() : this.pause()
  }

  public backward(): void {
    this.currentTime = Math.max(0, this.currentTime - this.skipDuration)
  }

  public forward(): void {
    this.currentTime = Math.min(
      this.currentTime + this.skipDuration,
      this.duration,
    )
  }

  get currentTime(): number {
    return this.media.currentTime || 0
  }

  set currentTime(time: number) {
    this.media.currentTime = bound(time, 0, this.duration)
  }

  get duration(): number {
    if (
      !Number.isNaN(this.media.duration) &&
      Number.isFinite(this.media.duration)
    ) {
      return this.media.duration
    }
    return 0
  }

  get playbackRate(): number {
    return this.media.playbackRate
  }

  set playbackRate(rate: number) {
    this.media.playbackRate = rate
  }

  get buffered(): number {
    return this.media.buffered.length ? this.media.buffered.end(0) : 0
  }

  get progress(): number {
    return this.duration ? (this.currentTime / this.duration) * 100 : 0
  }

  get buffer(): number {
    return this.duration ? (this.buffered / this.duration) * 100 : 0
  }

  get paused(): boolean {
    return this.media.paused
  }

  set preservesPitch(preserve: boolean) {
    this.media.preservesPitch = preserve
  }
}
