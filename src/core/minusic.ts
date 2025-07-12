import {
  MinusicConfiguration,
  Elements,
  PlayerConfiguration,
  VisualizerOptions,
} from "../types"
import { buildPlayerStructure } from "../components/structure"
import { createMinusicConfiguration } from "./configuration"
import { EventBus } from "../utils/eventBus/eventBus"
import { StateHandler } from "./state"
import { MediaSourceManager } from "./media/mediaSourceManager"
import { PlaylistManager } from "./playlist/playlistManager"
import { VisualizerController } from "./visualizer/visualizerController"
import { MediaManager } from "./media/mediaManager"
import { UIManager } from "./uiManager"
import { PlaybackController } from "./playbackController"
import { VolumeController } from "./volumeController"
import { EventHandler } from "./eventHandler"
import { ErrorManager } from "./errorManager"

export default class Minusic {
  private media!: HTMLMediaElement
  private options!: PlayerConfiguration
  private elements!: Elements
  private eventBus: EventBus = new EventBus()
  private state!: StateHandler
  private mediaManager: MediaManager = new MediaManager()
  private uiManager!: UIManager
  private playbackController!: PlaybackController
  private volumeController!: VolumeController
  private eventHandler!: EventHandler
  private sourceManager!: MediaSourceManager
  private playlistManager!: PlaylistManager
  private visualizerController!: VisualizerController
  private errorManager!: ErrorManager

  constructor(options: MinusicConfiguration) {
    this.initializePlayer(options)
  }

  private initializePlayer(options: MinusicConfiguration): void {
    this.options = createMinusicConfiguration(options) as PlayerConfiguration
    this.media = this.mediaManager.initialize(options.selectors)

    console.log(this.options)
    if (this.options.playback.autoplay) {
      this.media.setAttribute("autoplay", "")
    }

    if (typeof this.options.media.crossOrigin === "string") {
      this.media.setAttribute("crossorigin", this.options.media.crossOrigin)
    }

    this.media.muted = this.options.playback.muted
    this.media.volume = this.options.playback.volume

    this.elements = buildPlayerStructure(this, this.options)
    this.state = new StateHandler(this.elements.container, this.eventBus)
    this.errorManager = new ErrorManager(this.eventBus, this.elements.container)
    this.uiManager = new UIManager(this.media, this.state)
    this.uiManager.applyInitialSettings(
      this.options.appearance.showNativeControls,
      this.options.appearance.showCustomControls,
    )

    this.playbackController = new PlaybackController(
      this.media,
      this.eventBus,
      this.state,
      this.options.playback.skipDuration,
    )

    this.volumeController = new VolumeController(
      this.media,
      this.elements,
      this.state,
    )

    if (this.elements.soundBar) {
      this.elements.soundBar.value = this.media.muted ? 0 : this.media.volume
    }

    this.sourceManager = new MediaSourceManager(this.media, this.eventBus, {
      crossOrigin: this.options.media.crossOrigin,
      livestream: this.options.media.isLivestream,
    })

    this.playlistManager = new PlaylistManager(
      this.options.media.playlist,
      this.sourceManager,
      this.eventBus,
      this.state,
      {
        repeat: this.options.playback.repeat,
        random: this.options.playback.shuffle,
      },
    )

    this.eventHandler = new EventHandler(
      this.media,
      this.elements,
      this.eventBus,
      this.state,
      this.sourceManager,
      this.playlistManager,
      this.updateProgress.bind(this),
    )

    if (this.options.controls?.visualizer && this.options.visualizer) {
      this.visualizerController = new VisualizerController(
        this.media,
        this.elements.container,
        this.eventBus,
        this.options.visualizer,
      )
    }

    this.playbackController.playbackRate = this.options.playback.playbackRate
    this.playbackController.preservesPitch = this.options.playback.preservePitch

    this.mediaManager.wrapMediaElement(this.elements.container)

    if (this.audioSource) {
      this.setupExistingSourceHandling()
    } else if (this.options.media.playlist.length > 0) {
      this.loadTrack()
    }

    this.updateProgress()
  }

  private setupExistingSourceHandling(): void {
    const handleError = () => {
      this.eventBus.emit("sourceError", {
        track: null,
        error: "Failed to load existing audio source",
        attemptCount: 1,
      })
    }

    const handleCanPlay = () => {
      this.eventBus.emit("sourceLoaded", { track: null })
    }

    this.media.addEventListener("error", handleError)
    this.media.addEventListener("canplay", handleCanPlay)

    console.log(this.media.readyState)
    if (this.media.readyState >= 3) handleCanPlay()
  }

  private updateProgress(): void {
    this.eventHandler.updateProgress()
  }

  public destroy(): void {
    this.eventHandler.unbindMediaEvents()
    this.mediaManager.unwrapMediaElement(this.elements.container)
    this.errorManager.dispose()
    this.mediaManager.destroy()

    if (this.visualizerController) {
      this.visualizerController.dispose()
    }
  }

  public play(): Promise<void> {
    return this.playbackController.play()
  }

  public pause(): void {
    this.playbackController.pause()
  }

  public stop(): void {
    this.playbackController.stop()
  }

  public togglePlay(state?: boolean): Promise<void> | void {
    return this.playbackController.togglePlay(state)
  }

  public backward(): void {
    this.playbackController.backward()
  }

  public forward(): void {
    this.playbackController.forward()
  }

  public restart(): void {
    this.playbackController.restart()
  }

  public mute(): void {
    this.volumeController.mute()
  }

  public unmute(): void {
    this.volumeController.unmute()
  }

  public toggleMute(state?: boolean): void {
    this.volumeController.toggleMute(state)
  }

  public showControls(): void {
    this.uiManager.showControls()
  }

  public hideControls(): void {
    this.uiManager.hideControls()
  }

  public showNativeControls(): void {
    this.uiManager.showNativeControls()
  }

  public hideNativeControls(): void {
    this.uiManager.hideNativeControls()
  }

  public toggleControls(): void {
    this.uiManager.toggleControls()
  }

  public async loadTrack(index = 0, autoplay = false): Promise<boolean> {
    return this.playlistManager.loadTrack(index, autoplay)
  }

  public previousTrack(autoplay = false): Promise<boolean> {
    return this.playlistManager.previousTrack(autoplay)
  }

  public nextTrack(autoplay = false): Promise<boolean> {
    return this.playlistManager.nextTrack(autoplay)
  }

  public randomTrack(autoplay = false): Promise<boolean> {
    return this.playlistManager.randomTrack(autoplay)
  }

  public previousOrRestartTrack(autoplay = false): void {
    if (this.playbackController.currentTime > 5) {
      this.playbackController.currentTime = 0
    } else {
      this.previousTrack(autoplay)
    }
  }

  public toggleRepeat(): void {
    this.playlistManager.toggleRepeatMode()
  }

  public repeatOne(): void {
    this.playlistManager.setRepeatMode(1)
  }

  public repeatAll(): void {
    this.playlistManager.setRepeatMode(2)
  }

  public noRepeat(): void {
    this.playlistManager.setRepeatMode(0)
  }

  public toggleRandom(): void {
    this.playlistManager.toggleRandomMode()
  }

  public toggleVisualizer(enabled?: boolean): void {
    if (!this.visualizerController) return

    if (typeof enabled === "boolean") {
      this.visualizerController.setEnabled(enabled)
    } else {
      this.visualizerController.setEnabled(!this.visualizerController.enabled)
    }
  }

  public updateVisualizerOptions(options: Partial<VisualizerOptions>): boolean {
    return this.visualizerController?.updateOptions(options) || false
  }

  get currentTime(): number {
    return this.playbackController.currentTime
  }

  set currentTime(time: number) {
    this.playbackController.currentTime = time
  }

  get duration(): number {
    return this.playbackController.duration
  }

  get paused(): boolean {
    return this.playbackController.paused
  }

  get progress(): number {
    return this.playbackController.progress
  }

  get buffer(): number {
    return this.playbackController.buffer
  }

  get buffered(): number {
    return this.playbackController.buffered
  }

  get playbackRate(): number {
    return this.playbackController.playbackRate
  }

  set playbackRate(rate: number) {
    this.playbackController.playbackRate = rate
  }

  get volume(): number {
    return this.volumeController.volume
  }

  set volume(value: number) {
    this.volumeController.volume = value
  }

  get muted(): boolean {
    return this.volumeController.muted
  }

  get repeat(): number {
    return this.playlistManager.getRepeatMode()
  }

  set repeat(value: number) {
    this.playlistManager.setRepeatMode(value)
  }

  get random(): boolean {
    return this.playlistManager.getRandomMode()
  }

  get track(): number {
    return this.playlistManager.getCurrentIndex()
  }

  get trackTitle(): string | null {
    if (this.options.media.currentTrack?.metadata.title)
      return this.options.media.currentTrack?.metadata.title
    else if (this.audioSource)
      return decodeURI(this.audioSource.split("/").slice(-1)[0])
    return null
  }

  get audioSource(): string | null {
    if (this.media.src) return this.media.src

    const sources = this.media.getElementsByTagName("source")
    for (const source of sources) {
      if (source.src) return source.src
    }
    return null
  }
}
