import "./minusic.css"
import { CSSClass } from "./enums"
import {
  createButton,
  createElement,
  createMenu,
  remove,
  unwrapElement,
  wrapElement,
} from "./lib/elements"
import { bound, formatTime, randomNumber } from "./lib/utils"
import Visualizer from "./lib/visualizer"
import { ConstructorParameters, Elements } from "./types"
import Range from "./lib/ui/range"
import CircularRange from "./lib/ui/circularRange"
import Progress from "./lib/ui/progress"
import CircularProgress from "./lib/ui/circularProgress"

export * from "./types"
export default class Minusic {
  private media!: HTMLMediaElement
  private container!: HTMLElement
  private options!: ConstructorParameters["options"]
  private elements!: Elements
  private animationHandler!: (timestamp: number) => void
  private visualizer!: Visualizer
  private trackIndex: number = 0
  private repeatState: number = 0
  private randomState: boolean = false

  constructor({
    media,
    container: parentContainer,
    options,
  }: ConstructorParameters) {
    this.initializePlayer({ media, parentContainer, options })
  }

  private initializePlayer({
    media,
    parentContainer,
    options,
  }: {
    media: string
    parentContainer: string
    options: ConstructorParameters["options"]
  }) {
    this.media = document.querySelector(media) as HTMLMediaElement
    if (!this.validateMediaElement()) {
      if (!this.validateContainerElement(parentContainer)) return
      this.createMediaElement()
    }

    const defaultOptions = {
      controls: {
        muteButton: true,
        playButton: true,
        startTime: true,
        endTIme: true,
        soundBar: true,
        timeBar: true,
        bufferBar: true,
        backwardButton: true,
        forwardButton: true,
        playbackSpeedButton: true,
        downloadButton: true,
        previousButton: true,
        nextButton: true,
        repeatButton: true,
        randomButton: true,
      },
      skipDuration: 15,
      tracks: [],
    }
    this.options = { ...defaultOptions, ...options }

    const { container, controls } = this.buildPlayerStructure()
    this.elements = this.createPlayerElements(container, controls)

    this.applyInitialSettings(options)
    this.bindMediaEvents()
    wrapElement(container, this.media)

    if (options.visualizer) {
      this.initializeVisualizer()
    }
    if (!this.audioSource) this.loadTrack()
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
    if (this.container) this.container.removeChild(this.media)
  }

  private validateMediaElement() {
    return this.media?.nodeName === "AUDIO" && !!this.media.parentNode
  }

  private validateContainerElement(container: string) {
    this.container = document.querySelector(container) as HTMLMediaElement
    return this.container !== null
  }

  private createMediaElement() {
    this.media = createElement("audio", {
      container: this.container,
    }) as HTMLMediaElement
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

  private applyInitialSettings(options: ConstructorParameters["options"]) {
    if (!options.showNativeControls) this.hideControls()
    else this.showControls()
    if (options.autoplay) this.media.setAttribute("autoplay", "")
    if (options.crossOrigin) this.media.setAttribute("crossorigin", "")
    if (this.muted || options.muted) this.mute()
    if (options.playbackRate) this.playbackRate = options.playbackRate
    if (typeof options.preservesPitch !== "undefined")
      this.media.preservesPitch = options.preservesPitch
    if (typeof options.startTime !== "undefined")
      this.currentTime = options.startTime
    if (typeof options.defaultVolume !== "undefined")
      this.volume = options.defaultVolume
  }

  private createPlayerElements(
    container: HTMLElement,
    controlsContainer: HTMLElement,
  ): Elements {
    const progressContainer = this.createProgressContainer(controlsContainer)
    const { controls } = this.options
    return {
      container,
      controls: controlsContainer,
      buttons: {
        play: controls.playButton
          ? createButton(controlsContainer, "Play", CSSClass.PlayButton, () =>
              this.togglePlay(),
            )
          : null,
        mute: controls.muteButton
          ? createButton(controlsContainer, "Mute", CSSClass.MuteButton, () =>
              this.toggleMute(),
            )
          : null,
        previous: controls.previousButton
          ? createButton(
              controlsContainer,
              "Previous track",
              CSSClass.PreviousButton,
              () =>
                this.currentTime > 5
                  ? (this.currentTime = 0)
                  : this.previousTrack(),
            )
          : null,
        next: controls.nextButton
          ? createButton(
              controlsContainer,
              "Next track",
              CSSClass.NextButton,
              () => this.nextTrack(),
            )
          : null,
        backward: controls.backwardButton
          ? createButton(
              controlsContainer,
              "Backward",
              CSSClass.BackwardButton,
              () => this.backward(),
            )
          : null,
        forward: controls.forwardButton
          ? createButton(
              controlsContainer,
              "Forward",
              CSSClass.ForwardButton,
              () => this.forward(),
            )
          : null,
        repeat: controls.repeatButton
          ? createButton(
              controlsContainer,
              "Repeat",
              CSSClass.RepeatButton,
              () => this.toggleRepeat(),
            )
          : null,
        random: controls.randomButton
          ? createButton(
              controlsContainer,
              "Repeat",
              CSSClass.RandomButton,
              () => this.toggleRandom(),
            )
          : null,
        download:
          controls.downloadButton && this.audioSource
            ? createElement(
                "a",
                { container: controlsContainer },
                {
                  class: [CSSClass.ControlButton, CSSClass.DownloadButton],
                  href: this.audioSource,
                  download: this.trackTitle || "",
                },
              )
            : null,
        playbackSpeed: controls.playbackSpeedButton
          ? createMenu(
              controlsContainer,
              "Speed",
              ["0.25", "0.5", "0.75", "1", "1.25", "1.5", "1.75", "2"],
              "1",
              CSSClass.PlaybackSpeedButton,
              (value: string) => {
                this.playbackRate = parseFloat(value)
              },
            )
          : null,
      },
      progress: {
        ...this.createTimeBar(progressContainer),
        bufferBar: this.createBufferBar(progressContainer),
        currentTime: controls.muteButton
          ? this.createTimeDisplay(
              controlsContainer,
              CSSClass.CurrentTime,
              "Current time",
            )
          : null,
        totalTime: controls.muteButton
          ? this.createTimeDisplay(
              controlsContainer,
              CSSClass.TotalTime,
              "Total time",
            )
          : null,
      },
      soundBar: controls.soundBar
        ? this.createSoundBar(controlsContainer)
        : null,
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
      ) as HTMLImageElement,
    }
  }

  private createProgressContainer(controls: HTMLElement) {
    return createElement(
      "div",
      { container: controls },
      { class: [CSSClass.ProgressContainer] },
    )
  }

  private createTimeBar(container: HTMLElement) {
    if (!this.options.controls.timeBar) return { timeBar: null }
    if (this.options.circularTimeBar) {
      return {
        timeBar: new CircularRange({
          container,
          label: "Seek time",
          handler: (value) => {
            this.currentTime = Number(value * this.duration) / 100
          },
          min: 0,
          max: 100,
          step: 0.01,
          value: this.volume,
          cssClass: [CSSClass.TimeBar],
          radius: this.options.circularTimeBar.radius,
          startAngle: this.options.circularTimeBar.startAngle,
          endAngle: this.options.circularTimeBar.endAngle,
          clockwise: this.options.circularTimeBar.clockwise,
        }),
      }
    } else {
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
  }

  private createBufferBar(container: HTMLElement) {
    if (!this.options.controls.bufferBar) return null
    if (this.options.circularTimeBar) {
      return new CircularProgress({
        container,
        cssClass: [CSSClass.BufferBar],
        radius: this.options.circularTimeBar.radius,
        startAngle: this.options.circularTimeBar.startAngle,
        endAngle: this.options.circularTimeBar.endAngle,
        clockwise: this.options.circularTimeBar.clockwise,
      })
    }
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
        clockwise: this.options.circularSoundBar.clockwise,
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
      ended: () => {
        if (this.repeat === 1) this.restart()
        else this.nextTrack(true)
      },
    }
    Object.entries(events).forEach(([event, handler]) => {
      this.media.addEventListener(event, handler)
    })
  }

  private initializeVisualizer() {
    if (!this.options.visualizer) return
    this.visualizer = new Visualizer({
      container: this.elements.container,
      media: this.media,
      options: this.options.visualizer,
    })
    if (!this.visualizer.initialized) return
    if (!this.animationHandler)
      this.animationHandler = this.updateVisualizer.bind(this)
  }

  private updateVisualizer(timestamp: number = 0) {
    if (!this.visualizer?.initialized) return
    const frequencies = this.visualizer.update(this.paused, timestamp)
    if (frequencies.some((value) => value > 0) || !this.paused)
      requestAnimationFrame(this.animationHandler)
  }

  private updateProgress() {
    const { timeBar, currentTime, totalTime, bufferBar } =
      this.elements.progress
    if (bufferBar) bufferBar.value = this.buffer
    if (timeBar) timeBar.value = this.progress
    if (currentTime) currentTime.innerText = formatTime(this.currentTime)
    if (totalTime) totalTime.innerText = formatTime(this.duration)
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
    if (this.elements.soundBar) this.elements.soundBar.value = 0
    this.media.muted = true
  }

  public unmute() {
    this.elements.container.dataset.muted = "false"
    if (this.elements.soundBar) this.elements.soundBar.value = this.volume
    this.media.muted = false
    if (this.media.volume === 0) this.volume = 1
  }

  public repeatOne() {}
  public repeatAll() {}
  public noRepeat() {}

  public showControls = () => this.media.setAttribute("controls", "")
  public hideControls = () => this.media.removeAttribute("controls")

  public togglePlay = (state?: boolean) =>
    (state ?? this.paused) ? this.play() : this.pause()
  public toggleMute = (state?: boolean) =>
    (state ?? this.media.muted) ? this.unmute() : this.mute()

  public toggleRepeat = () => {
    this.repeat = (this.repeat + 1) % 3
    if (this.repeat === 0) this.noRepeat()
    else if (this.repeat === 1) this.repeatOne()
    else if (this.repeat === 2) this.repeatAll()

    this.elements.container.dataset.repeat = `${this.repeat}`
  }

  get repeat() {
    return this.repeatState
  }
  set repeat(value: number) {
    this.repeatState = value
  }

  public toggleRandom() {
    this.random = !this.random
    this.elements.container.dataset.random = `${this.random}`
  }
  get random() {
    return this.randomState
  }
  set random(value: boolean) {
    this.randomState = value
  }

  public toggleControls = () =>
    this.media.getAttribute("controls")
      ? this.hideControls()
      : this.showControls()

  public backward() {
    this.currentTime = Math.max(0, this.currentTime - this.options.skipDuration)
  }
  public forward() {
    this.currentTime = Math.min(
      this.currentTime + this.options.skipDuration,
      this.duration,
    )
  }

  public setMetadata(track: {
    title: string
    author: string
    album: string
    thumbnail: string
  }) {
    if (!this.options.metadata) return {}
    this.elements.title!.innerText = track.title || ""
    this.elements.author!.innerText = track.author || ""
    this.elements.album!.innerText = track.album || ""
    this.elements.thumbnail!.src = track.thumbnail || ""
  }

  public loadTrack(index = 0, autoplay = false) {
    if (this.random)
      index = randomNumber(0, this.options.tracks.length - 1, this.track)
    const playing = !this.paused || autoplay
    if (this.options.tracks.length <= index || index < 0) {
      if (this.repeat === 2) index = 0
      else return
    }
    const track = this.options.tracks[index]
    const trackSources = Array.isArray(track.source)
      ? [...track.source]
      : [track.source]
    this.removeSource()
    this.addSource(trackSources)
    this.setMetadata(track)
    this.track = index
    const callback = () => {
      if (playing) this.play()
      this.media.removeEventListener("canplay", callback)
    }
    this.media.addEventListener("canplay", callback)
    this.media.load()
  }

  get track() {
    return this.trackIndex
  }

  set track(value: number) {
    this.trackIndex = value
  }

  public previousTrack = (autoplay = false) =>
    this.loadTrack(this.track - 1, autoplay)

  public nextTrack = (autoplay = false) =>
    this.loadTrack(this.track + 1, autoplay)

  public restart() {
    this.currentTime = 0
    this.play()
  }

  private addSource(sources: string[]) {
    sources.forEach((source) =>
      createElement("source", { container: this.media }, { src: source }),
    )
  }

  private removeSource() {
    this.media.querySelectorAll("source").forEach((element) => remove(element))
  }

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
    if (this.elements.soundBar) this.elements.soundBar.value = value
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

  get trackTitle() {
    if (this.options.title) return this.options.title
    else if (this.audioSource)
      return decodeURI(this.audioSource.split("/").slice(-1)[0])
    return null
  }

  get audioSource() {
    if (this.media.src) return this.media.src

    const sources = this.media.getElementsByTagName("source")
    for (let source of sources) {
      if (source.src) return source.src
    }
    return null
  }
}
