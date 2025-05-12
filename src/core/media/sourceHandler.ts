import { TrackInfo, TrackSource } from "../../types"

export enum SourceErrorType {
  NETWORK = "network",
  FORMAT = "format",
  DECODE = "decode",
  UNAVAILABLE = "unavailable",
  UNKNOWN = "unknown",
}

export interface SourceLoadResult {
  success: boolean
  source?: string
  type?: string
  error?: {
    type: SourceErrorType
    message: string
    originalError?: Error
  }
}

export interface SourceHandlerOptions {
  crossOrigin?: boolean | "anonymous" | "use-credentials"
  retryCount?: number
  retryDelay?: number
  timeout?: number
}

export function normalizeSources(
  source: string | string[] | TrackSource | TrackSource[],
): TrackSource[] {
  if (!source) return []

  if (typeof source === "string") {
    return [{ source, type: inferMimeType(source) }]
  }

  if (Array.isArray(source)) {
    return source.map((item) => {
      if (typeof item === "string") {
        return { source: item, type: inferMimeType(item) }
      }
      return item
    })
  }

  return [source]
}

export function inferMimeType(source: string): string {
  if (!source) return ""

  const extension = source.split(".").pop()?.toLowerCase()
  if (!extension) return ""

  const mimeTypes: Record<string, string> = {
    mp3: "audio/mpeg",
    mp4: "audio/mp4",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    oga: "audio/ogg",
    wav: "audio/wav",
    aac: "audio/aac",
    flac: "audio/flac",
    webm: "audio/webm",
  }

  return mimeTypes[extension] || ""
}

export function isSourceSupported(source: TrackSource): boolean {
  if (!source || !source.source) return false

  const audio = document.createElement("audio")

  if (!source.type) {
    const mimeType = inferMimeType(source.source)
    if (mimeType && audio.canPlayType(mimeType)) {
      return audio.canPlayType(mimeType) !== ""
    }
    return true
  }
  return audio.canPlayType(source.type) !== ""
}

export function filterSupportedSources(sources: TrackSource[]): TrackSource[] {
  if (!sources || !Array.isArray(sources)) return []
  return sources.filter(isSourceSupported)
}

export function attachSources(
  media: HTMLMediaElement,
  sources: TrackSource[],
  options: SourceHandlerOptions = {},
): HTMLSourceElement[] {
  if (!media || !sources || !sources.length) return []

  Array.from(media.querySelectorAll("source")).forEach((source) => {
    source.remove()
  })

  media.removeAttribute("src")

  if (options.crossOrigin) {
    if (typeof options.crossOrigin === "string") {
      media.crossOrigin = options.crossOrigin
    } else {
      media.crossOrigin = "anonymous"
    }
  }

  return sources.map((trackSource) => {
    const sourceElement = document.createElement("source")
    sourceElement.src = trackSource.source
    if (trackSource.type) {
      sourceElement.type = trackSource.type
    }
    media.appendChild(sourceElement)
    return sourceElement
  })
}

function determineErrorType(error: MediaError | null): SourceErrorType {
  if (!error) return SourceErrorType.UNKNOWN

  switch (error.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return SourceErrorType.UNAVAILABLE
    case MediaError.MEDIA_ERR_NETWORK:
      return SourceErrorType.NETWORK
    case MediaError.MEDIA_ERR_DECODE:
      return SourceErrorType.DECODE
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return SourceErrorType.FORMAT
    default:
      return SourceErrorType.UNKNOWN
  }
}

export function preloadSource(
  trackSource: TrackSource,
  options: SourceHandlerOptions = {},
): Promise<SourceLoadResult> {
  return new Promise((resolve) => {
    if (!trackSource || !trackSource.source) {
      resolve({
        success: false,
        error: {
          type: SourceErrorType.UNAVAILABLE,
          message: "No source provided",
        },
      })
      return
    }

    const audio = document.createElement("audio")

    if (options.crossOrigin) {
      if (typeof options.crossOrigin === "string") {
        audio.crossOrigin = options.crossOrigin
      } else {
        audio.crossOrigin = "anonymous"
      }
    }

    let timeoutId: number | undefined
    if (options.timeout) {
      timeoutId = window.setTimeout(() => {
        cleanup()
        resolve({
          success: false,
          source: trackSource.source,
          type: trackSource.type,
          error: {
            type: SourceErrorType.NETWORK,
            message: "Source loading timed out",
          },
        })
      }, options.timeout)
    }

    const onCanPlay = () => {
      cleanup()
      resolve({
        success: true,
        source: trackSource.source,
        type: trackSource.type,
      })
    }

    const onError = (e: ErrorEvent) => {
      cleanup()
      resolve({
        success: false,
        source: trackSource.source,
        type: trackSource.type,
        error: {
          type: determineErrorType(audio.error),
          message: audio.error?.message || "Unknown error loading source",
          originalError: e.error,
        },
      })
    }

    const cleanup = () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
      }
      audio.removeEventListener("canplay", onCanPlay)
      audio.removeEventListener("error", onError)
      audio.src = ""
      audio.load()
    }

    audio.addEventListener("canplay", onCanPlay)
    audio.addEventListener("error", onError)

    if (trackSource.type) {
      audio.setAttribute("type", trackSource.type)
    }
    audio.src = trackSource.source
    audio.load()
  })
}

export async function getValidSource(
  track: TrackInfo,
  options: SourceHandlerOptions = {},
): Promise<TrackSource | null> {
  if (!track || !track.source) return null

  const sources = normalizeSources(track.source)
  if (!sources.length) return null

  const supportedSources = filterSupportedSources(sources)
  if (!supportedSources.length) return null

  for (const source of supportedSources) {
    const result = await preloadSource(source, options)
    if (result.success) {
      return source
    }
  }
  return null
}
