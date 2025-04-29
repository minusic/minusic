import { EventBus } from "../../utils/eventBus/eventBus"
import { randomNumber } from "../../utils/math/random"
import { TrackConfig } from "../../types"
import { MediaSourceManager } from "../media/mediaSourceManager"

export interface PlaylistOptions {
  repeat: number
  random: boolean
}

export class PlaylistManager {
  private tracks: TrackConfig[]
  private currentIndex: number = 0
  private mediaSourceManager: MediaSourceManager
  private eventBus: EventBus
  private options: PlaylistOptions = {
    repeat: 0, // 0: no repeat, 1: repeat one, 2: repeat all
    random: false,
  }

  constructor(
    tracks: TrackConfig[],
    mediaSourceManager: MediaSourceManager,
    eventBus: EventBus,
    options?: Partial<PlaylistOptions>,
  ) {
    this.tracks = tracks || []
    this.mediaSourceManager = mediaSourceManager
    this.eventBus = eventBus

    if (options) {
      this.options = { ...this.options, ...options }
    }
  }

  public async loadTrack(
    index: number = 0,
    autoplay: boolean = false,
  ): Promise<boolean> {
    // Validate track index
    if (!this.hasAnyTracks()) {
      this.eventBus.emit("playlistError", {
        message: "No tracks available to load",
      })
      return false
    }

    if (!this.isValidIndex(index)) {
      if (this.options.repeat === 2) {
        index = 0
      } else {
        this.eventBus.emit("playlistEnd", { index })
        return false
      }
    }

    const track = this.tracks[index]
    this.mediaSourceManager.resetSourceErrors()
    this.mediaSourceManager.addAttemptedTrack(index)

    const success = await this.mediaSourceManager.loadTrackSources(
      track,
      autoplay,
    )
    if (!success) {
      return this.handleSourceFailure(track, autoplay)
    }

    this.currentIndex = index
    this.eventBus.emit("trackLoaded", { track, index })
    return true
  }

  public async previousTrack(autoplay: boolean = false): Promise<boolean> {
    return this.loadTrack(this.currentIndex - 1, autoplay)
  }

  public async nextTrack(autoplay: boolean = false): Promise<boolean> {
    if (this.options.random) {
      return this.randomTrack(autoplay)
    }
    return this.loadTrack(this.currentIndex + 1, autoplay)
  }

  public async randomTrack(autoplay: boolean = false): Promise<boolean> {
    if (this.tracks.length <= 1) {
      return this.loadTrack(0, autoplay)
    }

    const randomIndex = randomNumber(
      0,
      this.tracks.length - 1,
      this.currentIndex,
    )
    return this.loadTrack(randomIndex, autoplay)
  }

  private async handleSourceFailure(
    track: TrackConfig,
    autoplay: boolean,
  ): Promise<boolean> {
    this.eventBus.emit("trackLoadError", {
      track,
      index: this.currentIndex,
      error: "Failed to load track",
    })

    if (this.currentIndex < this.tracks.length - 1) {
      return this.nextTrack(autoplay)
    } else if (this.options.repeat === 2) {
      return this.loadTrack(0, autoplay)
    }

    return false
  }

  public updatePlaylistUI(elements: HTMLElement[]): void {
    elements.forEach((element, index) => {
      if (!element) return
      if (index === this.currentIndex) {
        element.dataset.state = "playing"
      } else {
        element.dataset.state = ""
      }
    })
  }

  public setRepeatMode(mode: number): void {
    this.options.repeat = mode
    this.eventBus.emit("repeatModeChanged", { mode })
  }

  public toggleRepeatMode(): void {
    this.options.repeat = (this.options.repeat + 1) % 3
    this.eventBus.emit("repeatModeChanged", { mode: this.options.repeat })
  }

  public toggleRandomMode(): void {
    this.options.random = !this.options.random
    this.eventBus.emit("randomModeChanged", { enabled: this.options.random })
  }

  public getCurrentTrack(): TrackConfig | null {
    return this.isValidIndex(this.currentIndex)
      ? this.tracks[this.currentIndex]
      : null
  }

  public getCurrentIndex(): number {
    return this.currentIndex
  }

  public getRepeatMode(): number {
    return this.options.repeat
  }

  public getRandomMode(): boolean {
    return this.options.random
  }

  private hasAnyTracks(): boolean {
    return this.tracks.length > 0
  }

  private isValidIndex(index: number): boolean {
    return index >= 0 && index < this.tracks.length
  }

  public setTracks(tracks: TrackConfig[]): void {
    this.tracks = tracks || []
    this.currentIndex = 0
    this.eventBus.emit("tracksChanged", { tracks: this.tracks })
  }

  public addTrack(track: TrackConfig): void {
    this.tracks.push(track)
    this.eventBus.emit("trackAdded", { track, index: this.tracks.length - 1 })
  }

  public removeTrack(index: number): boolean {
    if (!this.isValidIndex(index)) return false

    const removed = this.tracks.splice(index, 1)[0]

    // Adjust current index if necessary
    if (index < this.currentIndex) {
      this.currentIndex--
    } else if (index === this.currentIndex) {
      // Currently playing track was removed
      if (this.tracks.length > 0) {
        this.loadTrack(Math.min(index, this.tracks.length - 1), true)
      }
    }

    this.eventBus.emit("trackRemoved", { track: removed, index })
    return true
  }
}
