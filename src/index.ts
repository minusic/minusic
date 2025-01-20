import { CSSClass } from "./enums"
import Debug from "./lib/debug"
import { createElement, wrapElement } from "./lib/elements"
import { bound, formatTime } from "./lib/utils"
import { ConstructorParameters, Elements } from "./types"

export * from "./types"
export default class Minusic {
  private media!: HTMLMediaElement
  private debug: Debug
  private options!: ConstructorParameters["options"]
  private elements!: Elements

  constructor({ target, options }: ConstructorParameters) {
    this.debug = new Debug(options.debug)
    if (document.querySelector(target)?.nodeName !== "AUDIO") {
      this.debug.error(`Invalid selector "${target}"`)
      return
    }
    this.media = document.querySelector(target) as HTMLMediaElement
    this.options = options

    if (!this.media.parentNode) {
      this.debug.error(`Player has no parent container`)
      return
    }
    this.hideControls()

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
        timeBar: createElement(
          "input",
          { container: progress },
          {
            class: [CSSClass.Range, CSSClass.TimeBar],
            type: "range",
            min: "0",
            max: "100",
            value: "0",
          },
          {
            input: async (e: any) =>
              (this.currentTime = (e.target.value * this.duration) / 100),
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
          value: "100",
        },
        {
          input: (e: Event) => {
            this.volume = parseInt((e.target as HTMLInputElement).value) / 100
            if (this.muted) this.unmute()
          },
        },
      ) as HTMLInputElement,
    }

    this.setMediaEvents()
    this.timeUpdate()
    if (this.muted) this.mute()

    wrapElement(this.elements.container, this.media)
  }

  private setMediaEvents() {
    this.media.addEventListener("timeupdate", () => this.timeUpdate())
    this.media.addEventListener("pause", () => this.pause())
    this.media.addEventListener("play", () => this.play())
    this.media.addEventListener("volumechange", () => {
      this.volume = this.media.volume
      if (this.muted) this.mute()
      else this.unmute()
    })
  }

  private timeUpdate() {
    this.elements.progress.bufferBar.value = this.buffer
    this.elements.progress.timeBar.value = `${this.progress}`
    this.elements.progress.currentTime.innerText = formatTime(this.currentTime)
    this.elements.progress.totalTime.innerText = formatTime(this.duration)
  }

  play() {
    this.elements.container.dataset.paused = "false"
    return this.media.play()
  }

  pause() {
    this.elements.container.dataset.paused = "true"
    return this.media.pause()
  }

  stop() {
    this.pause()
    this.currentTime = 0
  }

  mute() {
    this.elements.container.dataset.muted = "true"
    this.elements.soundBar.value = `0`
    return (this.media.muted = true)
  }

  unmute() {
    this.elements.container.dataset.muted = "false"
    this.elements.soundBar.value = `${this.volume * 100}`
    return (this.media.muted = false)
  }

  showControls() {
    return this.media.setAttribute("controls", "")
  }

  hideControls() {
    return this.media.removeAttribute("controls")
  }

  togglePlay(state?: boolean) {
    return state || this.media.paused ? this.play() : this.pause()
  }

  toggleMute(state?: boolean) {
    return state || this.media.muted ? this.unmute() : this.mute()
  }

  toggleControls() {
    return typeof this.media.getAttribute("controls") === "string"
      ? this.hideControls()
      : this.showControls()
  }

  get progress() {
    return this.duration ? (this.currentTime / this.duration) * 100 : 0
  }

  get buffer() {
    return this.duration ? (this.buffered / this.duration) * 100 : 0
  }

  get currentTime() {
    return this.media.currentTime || 0
  }

  set currentTime(time) {
    this.media.currentTime = bound(time, 0, this.duration)
  }

  get duration() {
    return !Number.isNaN(this.media.duration) &&
      Number.isFinite(this.media.duration)
      ? this.media.duration
      : this.options.duration &&
          !Number.isNaN(parseInt(`${this.options.duration}`))
        ? parseInt(`${this.options.duration}`)
        : 0
  }

  get muted() {
    return this.media.muted || this.media.volume === 0
  }

  get volume() {
    return this.media.volume
  }

  set volume(value) {
    value = bound(value, 0, 1)
    this.elements.soundBar.value = `${value * 100}`
    this.media.volume = value
  }

  get buffered() {
    return this.media.buffered.length ? this.media.buffered.end(0) : 0
  }
}
