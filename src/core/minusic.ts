import {
  createElement,
  remove,
  unwrapElement,
  wrapElement,
} from "./lib/elements"
import { bound, formatTime, randomNumber } from "./lib/utils"
import Visualizer from "./lib/visualizer"
import {
  ConstructorParameters,
  Elements,
  PlayerConfiguration,
  TrackConfig,
  TrackSource,
} from "./types"
import { buildPlayerStructure } from "./components/Structure"
import { createPlayerElements } from "./components/Controls"
import { createConstructorParameters } from "./configuration"

export default class Minusic {
  private media!: HTMLMediaElement
  private container!: HTMLElement
  private options!: PlayerConfiguration
  private elements!: Elements
  private animationHandler!: (timestamp: number) => void
  private visualizer!: Visualizer
  private trackIndex: number = 0
  private repeatState: number = 0
  private randomState: boolean = false
  private playbackRateState: number = 1
  private sources: (string | TrackSource)[] = []
  private sourceErrors = 0
  private attemptedTracks: Set<unknown> = new Set()

  constructor(options: ConstructorParameters) {
    this.initializePlayer(options)
  }

  private initializePlayer(options: ConstructorParameters) {
    this.media = document.querySelector(options.media) as HTMLMediaElement
    if (!this.validateMediaElement()) {
      if (!this.validateContainerElement(options.container)) return
      this.createMediaElement()
    }

    this.options = createConstructorParameters(options) as PlayerConfiguration

    const { container, controls } = buildPlayerStructure(this.options)
    this.elements = createPlayerElements(
      container,
      controls,
      this.options,
      this,
    )

    this.applyInitialSettings(options)
    this.bindMediaEvents()
    wrapElement(container, this.media)

    if (options.controls?.visualizer) {
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
    return this.media?.nodeName === "AUDIO" && !!this.media?.parentNode
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

  private applyInitialSettings(options: ConstructorParameters) {
    if (options.displayOptions?.showNativeControls === true) this.showControls()
    else this.hideControls()
    if (options.autoplay) this.media.setAttribute("autoplay", "")
    if (options.crossOrigin) this.media.setAttribute("crossorigin", "")
    if (this.muted || options.muted) this.mute()
    if (options.playbackRate) this.playbackRate = options.playbackRate
    if (typeof options.preservesPitch !== "undefined")
      this.media.preservesPitch = options.preservesPitch
    if (typeof options.defaultVolume !== "undefined")
      this.volume = options.defaultVolume
  }

  private bindMediaEvents() {
    const events = {
      timeupdate: () => this.updateProgress(),
      pause: () => this.handlePauseState(),
      play: () => this.handlePlayState(),
      volumechange: () => this.handleVolumeChange(),
      ratechange: () => this.handleRateChange(),
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
    if (this.muted) {
      this.mute()
    } else {
      this.unmute()
    }
  }

  private handleRateChange() {
    if (this.elements.buttons.playbackSpeed) {
      if (this.playbackRateState !== this.playbackRate)
        this.playbackRate = this.playbackRateState
      this.elements.buttons.playbackSpeed.update(this.playbackRate.toString())
    }
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

  public repeatOne = () => (this.repeat = 1)
  public repeatAll = () => (this.repeat = 2)
  public noRepeat = () => (this.repeat = 0)

  public showControls = () => this.media.setAttribute("controls", "")
  public hideControls = () => this.media.removeAttribute("controls")

  public togglePlay = (state?: boolean) => {
    if (typeof state === "boolean") return state ? this.play() : this.pause()
    return this.paused ? this.play() : this.pause()
  }
  public toggleMute = (state?: boolean) => {
    if (typeof state === "boolean") return state ? this.unmute() : this.mute()
    return this.muted ? this.unmute() : this.mute()
  }

  public toggleRepeat = () => {
    this.repeat = (this.repeat + 1) % 3
  }

  get repeat() {
    return this.repeatState
  }
  set repeat(value: number) {
    this.repeatState = value
    this.elements.container.dataset.repeat = `${this.repeatState}`
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

  public setMetadata(track: TrackConfig) {
    if (!this.options.controls.metadata) return {}
    this.elements.title!.innerText = track.title || ""
    this.elements.author!.innerText = track.author || ""
    this.elements.album!.innerText = track.album || ""
    this.elements.thumbnail!.src = track.thumbnail || ""
  }

  public setWaveform(track: { waveform?: string }) {
    if (this.elements.progress?.timeBar) {
      this.elements.progress.timeBar.background = track.waveform
    }
  }

  public loadTrack(index = 0, autoplay = false) {
    this.sourceErrors = 0
    const playing = !this.paused || autoplay

    if (!this.options.tracks || this.options.tracks.length === 0) {
      console.warn("No tracks available to load")
      return
    }

    if (this.options.tracks.length <= index || index < 0) {
      if (this.repeat === 2) index = 0
      else return
    }

    if (!this.attemptedTracks) this.attemptedTracks = new Set()
    if (this.attemptedTracks.size >= this.options.tracks.length) {
      console.warn(
        "All tracks have invalid sources, stopping playback to prevent infinite loop",
      )
      this.attemptedTracks.clear()
      return
    }

    if (this.attemptedTracks.has(index)) {
      console.warn(`Cannot load track at index ${index}: already attempted`)
      if (this.repeat === 2) {
        let nextIndex = (index + 1) % this.options.tracks.length
        const originalIndex = index

        while (
          this.attemptedTracks.has(nextIndex) &&
          nextIndex !== originalIndex
        ) {
          nextIndex = (nextIndex + 1) % this.options.tracks.length
        }
        if (nextIndex === originalIndex) {
          console.warn("All tracks have invalid sources, stopping playback")
          this.attemptedTracks.clear()
          return
        }
        this.loadTrack(nextIndex, autoplay)
      } else {
        this.attemptedTracks.clear()
      }
    }

    this.attemptedTracks.add(index)
    const track = this.options.tracks[index]
    const trackSources = Array.isArray(track.source)
      ? [...track.source]
      : [track.source]

    this.removeSource()
    this.addSource(trackSources)
    this.updateDownloadButton()
    this.setMetadata(track)
    this.setWaveform(track)
    this.track = index

    const handleCanPlay = () => {
      this.updateProgress()
      if (playing) this.play()
      this.media.removeEventListener("canplay", handleCanPlay)
      this.attemptedTracks.clear()
    }

    this.media.addEventListener("canplay", handleCanPlay)
    this.media.load()
    this.updatePlaylist(index)
  }

  private updateDownloadButton() {
    const downloadButton = this.elements.buttons.download
    if (!downloadButton) return

    if (this.audioSource && !this.options.livestream) {
      downloadButton.href = this.audioSource
      downloadButton.download = this.trackTitle || ""
      downloadButton.style.display = ""
    } else {
      downloadButton.style.display = "none"
    }
  }

  updatePlaylist(currentTrack: number) {
    this.elements.playlist.tracks.forEach((track, index) => {
      if (!track) return
      if (index === currentTrack) track.dataset.state = "playing"
      else track.dataset.state = ""
    })
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
    this.random ? this.randomTrack() : this.loadTrack(this.track + 1, autoplay)

  public randomTrack = (autoplay = false) =>
    this.loadTrack(
      randomNumber(0, this.options.tracks.length - 1, this.track),
      autoplay,
    )

  public restart() {
    this.currentTime = 0
    this.play()
  }

  private addSource(sources: (string | TrackSource)[]) {
    this.sources = sources
    sources.forEach((source) =>
      createElement(
        "source",
        { container: this.media },
        {
          src: typeof source === "string" ? source : source.source,
          type: typeof source === "string" ? "" : source.type,
        },
        { error: () => this.sourceFailed() },
      ),
    )
  }

  private sourceFailed() {
    this.sourceErrors++
    if (this.sourceErrors >= this.sources.length) {
      if (this.track < this.options.tracks.length - 1) {
        this.nextTrack(!this.paused)
      } else if (this.repeat === 2) {
        this.loadTrack(0, !this.paused)
      } else {
        console.error("All audio sources failed to load")
        this.attemptedTracks.clear()
      }
    }
  }

  private removeSource() {
    this.sources = []
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
    const defaultDuration =
      this.options.tracks[this.track] || this.options?.duration
    return defaultDuration && !Number.isNaN(parseInt(`${defaultDuration}`))
      ? parseInt(`${defaultDuration}`)
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
    this.playbackRateState = rate
    this.media.playbackRate = rate
  }

  get buffered() {
    return this.media.buffered.length ? this.media.buffered.end(0) : 0
  }

  get trackTitle() {
    if (this.options.metadata.title) return this.options.metadata.title
    else if (this.audioSource)
      return decodeURI(this.audioSource.split("/").slice(-1)[0])
    return null
  }

  get audioSource() {
    if (this.media.src) return this.media.src

    const sources = this.media.getElementsByTagName("source")
    for (const source of sources) {
      if (source.src) return source.src
    }
    return null
  }
}
