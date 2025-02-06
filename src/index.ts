import "./minusic.css"
import { CSSClass } from "./enums"
import { createElement, unwrapElement, wrapElement } from "./lib/elements"
import { bound, formatTime } from "./lib/utils"
import Visualizer from "./lib/visualizer"
import { ConstructorParameters, Elements } from "./types"
import Range from "./lib/ui/range"
import CircularRange from "./lib/ui/circularRange"
import Progress from "./lib/ui/progress"

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
    this.updateProgress()
  }

  public destroy() {
    const events = [
      "timeupdate",
      "pause",
      "play",
      "volumechange",
      "ratechange",
      "ended",
    ]
    events.forEach((event) => this.media.removeEventListener(event, () => {}))
    unwrapElement(this.elements.container, this.media)
  }

  private validateMediaElement() {
    return this.media?.nodeName === "AUDIO" && !!this.media.parentNode
  }

  private buildPlayerStructure() {
    const container = createElement("div", {}, { class: CSSClass.Container })
    const controls = createElement(
      "div",
      { container },
      { class: CSSClass.Controls },
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
      visualizer: createElement(
        "canvas",
        { container },
        { class: CSSClass.Visualizer },
      ) as HTMLCanvasElement,
      ...this.createMetadata(container),
    }
  }

  private createMetadata(container: HTMLElement) {
    if (!this.options.metadata) return {}
    const metadata = createElement(
      "div",
      { container },
      { class: CSSClass.Metadata },
    )
    return {
      title: createElement(
        "p",
        { text: this.options.title, container: metadata },
        { class: CSSClass.Title },
      ),
      author: createElement(
        "p",
        { text: this.options.author, container: metadata },
        { class: CSSClass.Author },
      ),
      album: createElement(
        "p",
        { text: this.options.album, container: metadata },
        { class: CSSClass.Album },
      ),
      thumbnail: createElement(
        "img",
        { container: metadata },
        {
          src: this.options.thumbnail ? this.options.thumbnail : "",
          class: CSSClass.Thumbnail,
        },
      ),
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
      timeBar: new Range({
        container,
        cssClass: [CSSClass.TimeBar],
        label: "Seek time",
        min: 0,
        max: 100,
        step: 0.01,
        handler: (value) => {
          this.currentTime = Number(value * this.duration) / 100
        },
        value: 0,
      }),
    }
  }

  private createBufferBar(container: HTMLElement) {
    return new Progress({
      container,
      cssClass: [CSSClass.BufferBar],
    })
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
    if (this.options.circularSoundBar) {
      return new CircularRange({
        container,
        label: "Sound bar",
        handler: (value) => {
          this.volume = value
        },
        value: this.volume,
        cssClass: [CSSClass.SoundBar],
        radius: this.options.circularSoundBar.radius,
        startAngle: this.options.circularSoundBar.startAngle,
        endAngle: this.options.circularSoundBar.endAngle,
        clockwise: this.options.circularSoundBar.clockwise
      })
    } else {
      return new Range({
        container,
        label: "Sound bar",
        handler: (value) => {
          this.volume = value
        },
        value: this.volume,
        cssClass: [CSSClass.SoundBar],
      })
    }
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
    timeBar.value = this.progress
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
    this.elements.soundBar.value = 0
    this.media.muted = true
  }

  public unmute() {
    this.elements.container.dataset.muted = "false"
    this.elements.soundBar.value = this.volume
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
    if (
      !Number.isNaN(this.media.duration) &&
      Number.isFinite(this.media.duration)
    ) {
      return this.media.duration
    }
    const optionsDuration = this.options?.duration
    return optionsDuration && !Number.isNaN(parseInt(`${optionsDuration}`))
      ? parseInt(`${optionsDuration}`)
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
    this.elements.soundBar.value = value
    if (this.media.volume !== value) {
      this.media.volume = value
      if (this.muted && this.volume) this.unmute()
    }
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
