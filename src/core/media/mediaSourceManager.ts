import { EventBus } from "../../utils/eventBus/eventBus"
import {
  SourceHandlerOptions,
  getValidSource,
  normalizeSources,
  attachSources,
} from "./sourceHandler"
import { TrackConfig } from "../../types"

export class MediaSourceManager {
  private mediaElement: HTMLMediaElement
  private sourceErrors: number = 0
  private eventBus: EventBus
  private attemptedTracks: Set<number> = new Set()
  private crossOrigin: boolean
  private isLivestream: boolean

  constructor(
    mediaElement: HTMLMediaElement,
    eventBus: EventBus,
    options: {
      crossOrigin?: boolean
      livestream?: boolean
    } = {},
  ) {
    this.mediaElement = mediaElement
    this.eventBus = eventBus
    this.crossOrigin = !!options.crossOrigin
    this.isLivestream = !!options.livestream
  }

  public async loadTrackSources(
    track: TrackConfig,
    autoplay: boolean,
  ): Promise<boolean> {
    const sourceOptions: SourceHandlerOptions = {
      crossOrigin: this.crossOrigin ? "anonymous" : undefined,
      timeout: 30000,
    }

    const validSource = await getValidSource(track, sourceOptions)
    if (!validSource) {
      this.sourceErrors++
      this.eventBus.emit("sourceError", {
        track,
        error: "Failed to load track source",
        attemptCount: this.sourceErrors,
      })
      return false
    }

    const currentPlaybackRate = this.mediaElement.playbackRate

    const sources = normalizeSources(track.source)
    this.removeExistingSources()
    attachSources(this.mediaElement, sources, sourceOptions)

    this.mediaElement.load()

    this.mediaElement.playbackRate = currentPlaybackRate

    if (autoplay) {
      try {
        await this.mediaElement.play()
      } catch (error) {
        console.warn("Autoplay prevented by browser")
      }
    }

    this.eventBus.emit("sourceLoaded", { track })
    return true
  }

  public removeExistingSources(): void {
    this.mediaElement.src = ""
    this.mediaElement.querySelectorAll("source").forEach((src) => src.remove())
  }

  public updateDownloadButton(
    track: TrackConfig,
    downloadButton: HTMLAnchorElement | null,
  ): void {
    if (!downloadButton) return

    if (track && !this.isLivestream) {
      const sources = normalizeSources(track.source)
      if (sources.length > 0) {
        downloadButton.href = sources[0].source
        downloadButton.download = track.title || ""
        downloadButton.style.display = ""
        return
      }
    }

    downloadButton.style.display = "none"
  }

  public resetSourceErrors(): void {
    this.sourceErrors = 0
    this.attemptedTracks.clear()
  }

  public addAttemptedTrack(index: number): void {
    this.attemptedTracks.add(index)
  }

  public getSourceErrors(): number {
    return this.sourceErrors
  }

  public getAudioSource(): string | null {
    if (this.mediaElement.src) return this.mediaElement.src

    const sources = this.mediaElement.getElementsByTagName("source")
    for (const source of sources) {
      if (source.src) return source.src
    }
    return null
  }
}
