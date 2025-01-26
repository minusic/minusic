import "./minusic.css"
import { CSSClass } from "./enums"
import Debug from "./lib/debug"
import { createElement, unwrapElement, wrapElement } from "./lib/elements"
import { bound, formatTime } from "./lib/utils"
import Visualizer from "./lib/visualizer"
import { ConstructorParameters, Elements } from "./types"

export * from "./types"
export default class Minusic {
  private media!: HTMLMediaElement
  private debug: Debug
  private options!: ConstructorParameters["options"]
  private elements!: Elements
  private timeHandler!: () => void
  private visualizer!: Visualizer

  constructor({ target, options }: ConstructorParameters) {
    this.debug = new Debug(options.debug)
    this.media = document.querySelector(target) as HTMLMediaElement
    if (this.media?.nodeName !== "AUDIO") {
      this.debug.error(`Invalid selector "${target}"`)
      return
    }
    this.options = options

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
          { click: () => this.togglePlay() },
        ),
        mute: createElement(
          "button",
          { container: controls },
          {
            class: [CSSClass.ControlButton, CSSClass.MuteButton],
            "aria-label": "Mute",
          },
          { click: () => this.toggleMute() },
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
            value: "25",
            step: "0.01",
            "aria-label": "Seek time",
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
            class: [CSSClass.Progress, CSSClass.BufferBar],
            max: "100",
            min: "0",
            value: "50",
          },
          {},
        ) as HTMLProgressElement,
        currentTime: createElement(
          "span",
          { container: controls },
          { class: CSSClass.CurrentTime, "aria-label": "Current time" },
          {},
        ) as HTMLSpanElement,
        totalTime: createElement(
          "span",
          { container: controls },
          { class: CSSClass.TotalTime, "aria-label": "Total time" },
          {},
        ) as HTMLSpanElement,
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
          style: "--value: 100%",
        },
        {
          input: (e: Event) => {
            this.volume = parseInt((e.target as HTMLInputElement).value) / 100
            if (this.muted) this.unmute()
          },
        },
      ) as HTMLInputElement,
      visualizer: createElement("canvas", { container }) as HTMLCanvasElement,
    }

    this.setupMedia()
    this.setMediaEvents()
    this.timeUpdate()

    wrapElement(this.elements.container, this.media)

    this.createVisualizer()
  }

  destroy() {
    this.removeMediaEvents()
    unwrapElement(this.elements.container, this.media)
  }

  private setupMedia() {
    if (!this.options.controls) this.hideControls()
    if (this.options.autoplay) this.media.setAttribute("autoplay", "")
    if (this.muted || this.options.muted) this.mute()
    if (this.options.playbackRate) this.playbackRate = this.options.playbackRate
    if (typeof this.options.preservesPitch !== "undefined")
      this.media.preservesPitch = !!this.options.preservesPitch
    if (typeof this.options.startTime !== "undefined")
      this.currentTime = this.options.startTime
    if (typeof this.options.defaultVolume !== "undefined")
      this.volume = this.options.defaultVolume
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
    this.media.addEventListener("ratechange", () => {})
    this.media.addEventListener("ended", () => {})
  }

  private removeMediaEvents() {
    this.media.removeEventListener("timeupdate", this.timeUpdate)
    this.media.removeEventListener("pause", this.pause)
    this.media.removeEventListener("play", this.play)
  }

  private createVisualizer() {
    if (!this.options.visualizer) return
    this.visualizer = new Visualizer({
      canvas: this.elements.visualizer,
      media: this.media,
    })
    if (!this.visualizer.initialized) return
    this.timeHandler = this.updateVisualizer.bind(this)
  }

  private updateVisualizer() {
    if (!this.visualizer?.initialized) return
    const frequencies = this.visualizer.update(this.paused)
    if (frequencies.some((value) => value > 0) || !this.paused)
      requestAnimationFrame(this.timeHandler)
  }

  private timeUpdate() {
    this.elements.progress.bufferBar.value = this.buffer
    this.elements.progress.timeBar.value = `${this.progress}`
    this.elements.progress.timeBar.style.setProperty(
      "--value",
      `${this.progress.toFixed(2)}%`,
    )
    this.elements.progress.currentTime.innerText = formatTime(this.currentTime)
    this.elements.progress.totalTime.innerText = formatTime(this.duration)
  }

  play() {
    this.elements.container.dataset.paused = "false"
    this.updateVisualizer()
    return this.media.play()
  }

  pause() {
    this.elements.container.dataset.paused = "true"
    return this.media.pause()
  }

  get paused() {
    return this.media.paused
  }

  stop() {
    this.pause()
    this.currentTime = 0
  }

  mute() {
    this.elements.container.dataset.muted = "true"
    this.elements.soundBar.value = `0`
    this.elements.soundBar.style.setProperty("--value", `0%`)
    this.media.muted = true
  }

  unmute() {
    this.elements.container.dataset.muted = "false"
    this.elements.soundBar.value = `${this.volume * 100}`
    this.elements.soundBar.style.setProperty("--value", `${this.volume * 100}%`)
    this.media.muted = false
  }

  showControls() {
    return this.media.setAttribute("controls", "")
  }

  hideControls() {
    return this.media.removeAttribute("controls")
  }

  togglePlay(state?: boolean) {
    ;(state ?? this.paused) ? this.play() : this.pause()
  }

  toggleMute(state?: boolean) {
    ;(state ?? this.media.muted) ? this.unmute() : this.mute()
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
    if (this.media.volume !== value) this.media.volume = value
  }

  get playbackRate() {
    return this.media.playbackRate
  }

  set playbackRate(rate) {
    this.media.playbackRate = rate
  }

  get buffered() {
    return this.media.buffered.length ? this.media.buffered.end(0) : 0
  }
}
