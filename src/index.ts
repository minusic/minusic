import { CSSClass } from "./enums"
import Debug from "./lib/debug"
import { createElement, wrapElement } from "./lib/elements"
import { bound, formatTime } from "./lib/utils"
import { ConstructorParameters } from "./types"

export * from "./types"
export default class Minusic {
  private media: HTMLMediaElement | null | any
  private debug: Debug
  private elements:
    | {
        container: HTMLElement
        controls: HTMLElement
        buttons: {
          play: HTMLElement
          mute: HTMLElement
        }
        progress: {
          seekBar: HTMLInputElement
          bufferBar: HTMLProgressElement
          currentTime: HTMLElement
          totalTime: HTMLElement
        }
        soundBar: HTMLInputElement
      }
    | undefined

  constructor({ target, options }: ConstructorParameters) {
    this.media =
      typeof target !== "undefined" && target?.length
        ? document.querySelector(target)
        : null
    this.debug = new Debug(options.debug)

    if (this.media?.nodeName !== "AUDIO") {
      this.debug.error(`Invalid selector "${target}"`)
      return
    }

    if (!this.media.parentNode) {
      this.debug.error(`Player has no parent container`)
      return
    }

    const container = createElement("div")
    const controls = createElement(
      "div",
      { container },
      { class: CSSClass.Container },
    )
    const progress = createElement(
      "div",
      { container: controls },
      { class: [CSSClass.ProgressContainer] },
    )
    this.elements = {
      container,
      controls,
      buttons: {
        play: createElement(
          "button",
          { container: controls },
          {
            class: [CSSClass.ControlButton, CSSClass.PlayButton],
            "aria-label": "Play",
          },
          { click: async () => this.togglePlay() },
        ),
        mute: createElement(
          "button",
          { container: controls },
          {
            class: [CSSClass.ControlButton, CSSClass.MuteButton],
            "aria-label": "Mute",
          },
          { click: async () => this.toggleMute() },
        ),
      },
      progress: {
        seekBar: createElement(
          "input",
          { container: progress },
          {
            class: [CSSClass.Range, CSSClass.SeekBar],
            type: "range",
            min: "0",
            max: "100",
            value: "0",
          },
          {
            input: async (e: any) =>
              this.seek((e.target.value * this.duration) / 100),
          },
        ) as HTMLInputElement,
        bufferBar: createElement(
          "progress",
          { container: progress },
          {
            class: [CSSClass.Range, CSSClass.BufferBar],
            max: "100",
            min: "0",
            value: "0",
          },
          {},
        ) as HTMLProgressElement,
        currentTime: createElement(
          "span",
          { container: controls },
          { class: CSSClass.CurrentTime },
          {},
        ) as HTMLProgressElement,
        totalTime: createElement(
          "span",
          { container: controls },
          { class: CSSClass.TotalTime },
          {},
        ) as HTMLProgressElement,
      },
      soundBar: createElement(
        "input",
        { container: controls },
        {
          class: [CSSClass.Range, CSSClass.SoundBar],
          type: "range",
          min: "0",
          max: "100",
          value: "0",
        },
        {
          input: async (e: any) => {
            this.volume = e.target.value / 100
            if (this.muted) this.unmute()
          },
        },
      ) as HTMLInputElement,
    }

    this.media.addEventListener("timeupdate", (e: any) => this.timeUpdate())
    this.media.addEventListener("pause", (e: any) => this.pause())
    this.media.addEventListener("play", (e: any) => this.play())
    this.media.addEventListener("volumechange", () => {
      this.volume = this.media.volume
      if (this.muted) this.mute()
      else this.unmute()
    })
    this.timeUpdate()
    if (this.muted) this.mute()

    wrapElement(this.elements.container, this.media)
  }

  play() {
    this.elements!.container.dataset.paused = "false"
    return this.media.play()
  }

  pause() {
    this.elements!.container.dataset.paused = "true"
    return this.media.pause()
  }

  stop() {
    this.pause()
    this.seek(0)
  }

  mute() {
    this.elements!.container.dataset.muted = "true"
    this.elements!.soundBar.value = `0`
    return (this.media.muted = true)
  }

  unmute() {
    this.elements!.container.dataset.muted = "false"
    this.elements!.soundBar.value = `${this.volume * 100}`
    return (this.media.muted = false)
  }

  seek(time: number) {
    this.media.currentTime = bound(time, 0, this.duration)
  }

  togglePlay(state?: boolean) {
    return state || this.media.paused ? this.play() : this.pause()
  }

  toggleMute(state?: boolean) {
    return state || this.media.muted ? this.unmute() : this.mute()
  }

  timeUpdate() {
    const progress = this.duration
      ? (this.currentTime / this.duration) * 100
      : 0
    this.elements!.progress.bufferBar.value = this.duration
      ? (this.buffered / this.duration) * 100
      : 0
    this.elements!.progress.seekBar.value = `${progress}`
    this.elements!.progress.currentTime.innerText = formatTime(this.currentTime)
    this.elements!.progress.totalTime.innerText = formatTime(this.duration)
  }

  set volume(value) {
    value = bound(value, 0, 1)
    this.elements!.soundBar.value = `${value * 100}`
    this.media.volume = value
  }

  get currentTime() {
    return this.media.currentTime || 0
  }

  get duration() {
    return !Number.isNaN(this.media.duration) &&
      Number.isFinite(this.media.duration)
      ? this.media.duration
      : 0
  }
  get muted() {
    return this.media.muted || this.media.volume === 0
  }

  get volume() {
    return this.media.volume
  }

  get buffered() {
    return this.media.buffered.length ? this.media.buffered.end(0) : 0
  }
}
