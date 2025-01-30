import "./minusic.css"
import { CSSClass } from "./enums"
import { createElement, unwrapElement, wrapElement } from "./lib/elements"
import { bound, formatTime } from "./lib/utils"
import Visualizer from "./lib/visualizer"
import { ConstructorParameters, Elements } from "./types"

export * from "./types"
export default class Minusic {
  private media!: HTMLMediaElement
  private options!: ConstructorParameters["options"]
  private elements!: Elements
  private animationHandler!: () => void
  private visualizer!: Visualizer

  private applyInitialSettings(options: ConstructorParameters["options"]) {
    if (!options.controls) this.hideControls()
    if (options.autoplay) this.media.setAttribute("autoplay", "")
    if (this.muted || options.muted) this.mute()
    if (options.playbackRate) this.playbackRate = options.playbackRate
    if (typeof options.preservesPitch !== "undefined")
      this.media.preservesPitch = options.preservesPitch
    if (typeof options.startTime !== "undefined")
      this.currentTime = options.startTime
    if (typeof options.defaultVolume !== "undefined")
      this.volume = options.defaultVolume
  }

  constructor({ target, options }: ConstructorParameters) {
    this.initializePlayer(target, options)
  }

  private initializePlayer(
    target: string,
    options: ConstructorParameters["options"],
  ) {
    this.media = document.querySelector(target) as HTMLMediaElement
    if (!this.validateMediaElement()) return
    this.options = options

    const { container, controls } = this.buildPlayerStructure()
    this.elements = this.createPlayerElements(container, controls)

    this.applyInitialSettings(options)
    this.bindMediaEvents()
    wrapElement(container, this.media)

    if (options.visualizer) {
      this.initializeVisualizer()
    }
  }

  public destroy() {
    this.removeMediaEvents()
    unwrapElement(this.elements.container, this.media)
  }

  private validateMediaElement() {
    return this.media?.nodeName === "AUDIO" && !!this.media.parentNode
  }

  private buildPlayerStructure() {
    const container = createElement("div")
    const controls = createElement(
      "div",
      { container },
      { class: CSSClass.Container },
    )
    return { container, controls }
  }

  private createPlayerElements(
    container: HTMLElement,
    controls: HTMLElement,
  ): Elements {
    const progressContainer = this.createProgressContainer(controls)

    return {
      container,
      controls,
      buttons: {
        play: this.createButton(controls, "Play", CSSClass.PlayButton, () =>
          this.togglePlay(),
        ),
        mute: this.createButton(controls, "Mute", CSSClass.MuteButton, () =>
          this.toggleMute(),
        ),
      },
      progress: {
        ...this.createProgressElements(progressContainer),
        bufferBar: this.createBufferBar(progressContainer),
        currentTime: this.createTimeDisplay(
          controls,
          CSSClass.CurrentTime,
          "Current time",
        ),
        totalTime: this.createTimeDisplay(
          controls,
          CSSClass.TotalTime,
          "Total time",
        ),
      },
      soundBar: this.createSoundBar(controls),
      visualizer: createElement("canvas", { container }) as HTMLCanvasElement,
    }
  }

  private createProgressContainer(controls: HTMLElement) {
    return createElement(
      "div",
      { container: controls },
      { class: [CSSClass.ProgressContainer] },
    )
  }

  private createButton(
    container: HTMLElement,
    label: string,
    cssClass: CSSClass,
    onClick: () => void,
  ) {
    return createElement(
      "button",
      { container },
      {
        class: [CSSClass.ControlButton, cssClass],
        "aria-label": label,
      },
      { click: onClick },
    )
  }

  private createProgressElements(container: HTMLElement) {
    return {
      timeBar: createElement(
        "input",
        { container },
        {
          class: [CSSClass.Range, CSSClass.TimeBar],
          type: "range",
          min: "0",
          max: "100",
          value: "0",
          step: "0.01",
          "aria-label": "Seek time",
        },
        {
          input: (e: Event) =>
            (this.currentTime =
              (Number((e.target as HTMLInputElement).value) * this.duration) /
              100),
        },
      ) as HTMLInputElement,
    }
  }

  private createBufferBar(container: HTMLElement) {
    return createElement(
      "progress",
      { container },
      {
        class: [CSSClass.Progress, CSSClass.BufferBar],
        max: "100",
        min: "0",
        value: "0",
      },
    ) as HTMLProgressElement
  }

  private createTimeDisplay(
    container: HTMLElement,
    cssClass: CSSClass,
    label: string,
  ) {
    return createElement(
      "span",
      { container },
      {
        class: cssClass,
        "aria-label": label,
      },
    ) as HTMLSpanElement
  }

  private createSoundBar(container: HTMLElement) {
    return createElement(
      "input",
      { container },
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
          const value = parseInt((e.target as HTMLInputElement).value) / 100
          this.volume = value
          if (this.muted) this.unmute()
        },
      },
    ) as HTMLInputElement
  }

  private bindMediaEvents() {
    const events = {
      timeupdate: () => this.updateProgress(),
      pause: () => this.handlePauseState(),
      play: () => this.handlePlayState(),
      volumechange: () => this.handleVolumeChange(),
      ratechange: () => {},
      ended: () => {},
    }
    Object.entries(events).forEach(([event, handler]) => {
      this.media.addEventListener(event, handler)
    })
  }

  private removeMediaEvents() {
    this.media.removeEventListener("timeupdate", this.updateProgress)
    this.media.removeEventListener("pause", this.pause)
    this.media.removeEventListener("play", this.play)
  }

  private initializeVisualizer() {
    if (!this.options.visualizer) return
    this.visualizer = new Visualizer({
      canvas: this.elements.visualizer,
      media: this.media,
    })
    if (!this.visualizer.initialized) return
    this.animationHandler = this.updateVisualizer.bind(this)
  }

  private updateVisualizer() {
    if (!this.visualizer?.initialized) return
    const frequencies = this.visualizer.update(this.paused)
    if (frequencies.some((value) => value > 0) || !this.paused)
      requestAnimationFrame(this.animationHandler)
  }

  private updateProgress() {
    const { timeBar, currentTime, totalTime, bufferBar } =
      this.elements.progress
    bufferBar.value = this.buffer
    timeBar.value = `${this.progress}`
    timeBar.style.setProperty("--value", `${this.progress.toFixed(2)}%`)
    currentTime.innerText = formatTime(this.currentTime)
    totalTime.innerText = formatTime(this.duration)
  }

  public play() {
    return this.media.play()
  }

  public pause() {
    return this.media.pause()
  }

  private handlePlayState() {
    this.elements.container.dataset.paused = "false"
    this.updateVisualizer()
  }

  private handlePauseState() {
    this.elements.container.dataset.paused = "true"
  }

  private handleVolumeChange() {
    this.volume = this.media.volume
    this.muted ? this.mute() : this.unmute()
  }

  public stop() {
    this.pause()
    this.currentTime = 0
  }

  public mute() {
    this.elements.container.dataset.muted = "true"
    this.elements.soundBar.value = `0`
    this.elements.soundBar.style.setProperty("--value", `0%`)
    this.media.muted = true
  }

  public unmute() {
    this.elements.container.dataset.muted = "false"
    this.elements.soundBar.value = `${this.volume * 100}`
    this.elements.soundBar.style.setProperty("--value", `${this.volume * 100}%`)
    this.media.muted = false
  }

  public showControls = () => this.media.setAttribute("controls", "")
  public hideControls = () => this.media.removeAttribute("controls")

  public togglePlay = (state?: boolean) =>
    (state ?? this.paused) ? this.play() : this.pause()
  public toggleMute = (state?: boolean) =>
    (state ?? this.media.muted) ? this.unmute() : this.mute()

  public toggleControls = () =>
    this.media.getAttribute("controls")
      ? this.hideControls()
      : this.showControls()

  get paused() {
    return this.media.paused
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
