import { EventBus } from "../utils/eventBus/eventBus"
import { formatTime } from "../utils/media/timeFormatter"
import { Elements, TrackInfo } from "../types"
import { MediaSourceManager } from "./media/mediaSourceManager"
import { StateHandler } from "./state"
import { PlaylistManager } from "./playlist/playlistManager"

export class EventHandler {
  private media: HTMLMediaElement
  private elements: Elements
  private eventBus: EventBus
  private state: StateHandler
  private sourceManager: MediaSourceManager
  private playlistManager: PlaylistManager
  private updateProgressCallback: () => void
  private playbackRateState: number = 1
  private eventHandlers: Record<string, EventListener> = {}

  constructor(
    media: HTMLMediaElement,
    elements: Elements,
    eventBus: EventBus,
    state: StateHandler,
    sourceManager: MediaSourceManager,
    playlistManager: PlaylistManager,
    updateProgressCallback: () => void,
  ) {
    this.media = media
    this.elements = elements
    this.eventBus = eventBus
    this.state = state
    this.sourceManager = sourceManager
    this.playlistManager = playlistManager
    this.updateProgressCallback = updateProgressCallback

    this.bindMediaEvents()
    this.setupTrackLoadedEvents()
  }

  public bindMediaEvents(): void {
    const handlers: Record<string, EventListener> = {
      timeupdate: () => this.updateProgressCallback(),
      pause: () => this.handlePauseState(),
      play: () => this.handlePlayState(),
      volumechange: () => this.handleVolumeChange(),
      ratechange: () => this.handleRateChange(),
      ended: () => this.handleTrackEnded(),
    }

    this.eventHandlers = handlers

    Object.entries(handlers).forEach(([event, handler]) => {
      this.media.addEventListener(event, handler)
    })
  }

  public unbindMediaEvents(): void {
    Object.entries(this.eventHandlers).forEach(([event, handler]) => {
      this.media.removeEventListener(event, handler)
    })
    this.eventHandlers = {}
  }

  private setupTrackLoadedEvents(): void {
    this.eventBus.on("trackLoaded", ({ track }) => {
      this.handleTrackLoaded(track)
    })
  }

  private handleTrackLoaded(track: TrackInfo): void {
    this.updateMetadata(track)
    this.updateWaveform(track)
    this.playlistManager.updatePlaylistUI(this.elements.playlist.tracks)
    this.sourceManager.updateDownloadButton(
      track,
      this.elements.buttons.download,
    )
  }

  private handlePauseState(): void {
    this.state.setState({ paused: true, playing: false })
    this.eventBus.emit("pause")
  }

  private handlePlayState(): void {
    this.state.setState({ paused: false, playing: true })
    this.eventBus.emit("play")
  }

  private handleVolumeChange(): void {
    const isMuted = this.media.muted || this.media.volume === 0
    if (isMuted) {
      this.mute()
    } else {
      this.unmute()
    }
  }

  private handleRateChange(): void {
    if (this.elements.buttons.playbackSpeed) {
      const currentRate = this.media.playbackRate

      if (this.playbackRateState !== currentRate) {
        this.playbackRateState = currentRate
      }

      this.elements.buttons.playbackSpeed.update(currentRate)
    }
  }

  private handleTrackEnded(): void {
    const repeatMode = this.playlistManager.getRepeatMode()

    if (repeatMode === 1) {
      // Repeat current track
      this.media.currentTime = 0
      this.media.play()
    } else {
      // Play next track (or stop if repeat is off and this is the last track)
      this.playlistManager.nextTrack(true)
    }
  }

  private mute(): void {
    this.state.setState({ muted: true })
    if (this.elements.soundBar) this.elements.soundBar.value = 0
  }

  private unmute(): void {
    this.state.setState({ muted: false })
    if (this.elements.soundBar) this.elements.soundBar.value = this.media.volume

    if (this.media.volume === 0) {
      this.media.volume = 1
      if (this.elements.soundBar) this.elements.soundBar.value = 1
    }
  }

  private updateMetadata(track: TrackInfo): void {
    if (!this.elements.title) return
    const metadata = track.metadata || {}

    this.elements.title.innerText = metadata.title || ""
    if (this.elements.author)
      this.elements.author.innerText = metadata.artist || ""
    if (this.elements.album)
      this.elements.album.innerText = metadata.album || ""
    if (this.elements.thumbnail)
      this.elements.thumbnail.src = metadata.thumbnail || ""
  }

  private updateWaveform(track: TrackInfo): void {
    if (this.elements.progress?.timeBar) {
      this.elements.progress.timeBar.background = track.metadata?.waveform
    }
  }

  public updateProgress(): void {
    const { timeBar, currentTime, totalTime, bufferBar } =
      this.elements.progress
    const duration = this.media.duration || 0
    const current = this.media.currentTime || 0
    const buffered = this.media.buffered.length ? this.media.buffered.end(0) : 0

    if (bufferBar) bufferBar.value = duration ? (buffered / duration) * 100 : 0
    if (timeBar) timeBar.value = duration ? (current / duration) * 100 : 0
    if (currentTime) currentTime.innerText = formatTime(current)
    if (totalTime) totalTime.innerText = formatTime(duration)
  }
}
