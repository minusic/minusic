import {
  ConstructorParameters,
  Elements,
  PlayerConfiguration,
  VisualizerOptions,
} from "../types"
import { buildPlayerStructure } from "../components/structure"
import { createConstructorParameters } from "./configuration"
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

export default class MinusicCore {
  // Core properties
  private media!: HTMLMediaElement
  private options!: PlayerConfiguration
  private elements!: Elements
  private eventBus: EventBus = new EventBus()
  private state!: StateHandler

  // Component managers
  private mediaManager: MediaManager = new MediaManager()
  private uiManager!: UIManager
  private playbackController!: PlaybackController
  private volumeController!: VolumeController
  private eventHandler!: EventHandler
  private sourceManager!: MediaSourceManager
  private playlistManager!: PlaylistManager
  private visualizerController!: VisualizerController

  constructor(options: ConstructorParameters) {
    this.initializePlayer(options)
  }

  private initializePlayer(options: ConstructorParameters): void {
    this.options = createConstructorParameters(options) as PlayerConfiguration

    // Initialize media element
    this.media = this.mediaManager.initialize(options.media, options.container)

    // Apply basic media settings early
    if (options.autoplay) {
      this.media.setAttribute("autoplay", "")
    }

    if (options.crossOrigin) {
      this.media.setAttribute("crossorigin", "")
    }

    if (options.muted) {
      this.media.muted = true
    }

    if (typeof options.defaultVolume !== "undefined") {
      this.media.volume = options.defaultVolume
    }

    // Build player structure and elements
    this.elements = buildPlayerStructure(this, this.options)

    // Initialize state manager
    this.state = new StateHandler(this.elements.container, this.eventBus)

    // Initialize UI manager
    this.uiManager = new UIManager(this.elements, this.media, this.state)
    this.uiManager.applyInitialSettings(
      this.options.displayOptions.showNativeControls,
      this.options.displayOptions.showControls,
    )

    // Initialize controllers
    this.playbackController = new PlaybackController(
      this.media,
      this.eventBus,
      this.state,
      this.options.skipDuration,
    )

    this.volumeController = new VolumeController(
      this.media,
      this.elements,
      this.state,
    )

    // Now that volume controller is initialized, update the sound bar UI
    if (this.elements.soundBar) {
      this.elements.soundBar.value = this.media.muted ? 0 : this.media.volume
    }

    // Setup media source manager
    this.sourceManager = new MediaSourceManager(this.media, this.eventBus, {
      crossOrigin: this.options.crossOrigin,
      livestream: this.options.livestream,
    })

    // Setup playlist manager
    this.playlistManager = new PlaylistManager(
      this.options.tracks,
      this.sourceManager,
      this.eventBus,
      {
        repeat: 0,
        random: false,
      },
    )

    // Initialize event handler
    this.eventHandler = new EventHandler(
      this.media,
      this.elements,
      this.eventBus,
      this.state,
      this.sourceManager,
      this.playlistManager,
      this.updateProgress.bind(this),
    )

    // Setup visualizer if enabled
    if (options.controls?.visualizer && options.visualizer) {
      this.visualizerController = new VisualizerController(
        this.media,
        this.elements.container,
        this.eventBus,
        options.visualizer,
      )
    }

    // Apply remaining settings
    if (options.playbackRate) {
      this.playbackController.playbackRate = options.playbackRate
    }

    if (typeof options.preservesPitch !== "undefined") {
      this.playbackController.preservesPitch = options.preservesPitch
    }

    // Wrap media element in player container
    this.mediaManager.wrapMediaElement(this.elements.container)

    // Load initial track if needed
    if (!this.audioSource) {
      this.loadTrack()
    }

    this.updateProgress()
  }

  /**
   * Updates progress UI elements
   */
  private updateProgress(): void {
    this.eventHandler.updateProgress()
  }

  /**
   * Cleans up resources when player is destroyed
   */
  public destroy(): void {
    this.eventHandler.unbindMediaEvents()
    this.mediaManager.unwrapMediaElement(this.elements.container)
    this.mediaManager.destroy()

    if (this.visualizerController) {
      this.visualizerController.dispose()
    }
  }

  // ===== Public API methods =====

  // Playback control methods
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

  // Volume control methods
  public mute(): void {
    this.volumeController.mute()
  }

  public unmute(): void {
    this.volumeController.unmute()
  }

  public toggleMute(state?: boolean): void {
    this.volumeController.toggleMute(state)
  }

  // UI control methods
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

  // Playlist control methods
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

  // Visualizer methods
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

  // ===== Property getters and setters =====

  // Playback properties
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

  // Volume properties
  get volume(): number {
    return this.volumeController.volume
  }

  set volume(value: number) {
    this.volumeController.volume = value
  }

  get muted(): boolean {
    return this.volumeController.muted
  }

  // Playlist properties
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

  // Content properties
  get trackTitle(): string | null {
    if (this.options.metadata.title) return this.options.metadata.title
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
