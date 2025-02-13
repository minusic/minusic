import CircularProgress from "./lib/ui/circularProgress"
import CircularRange from "./lib/ui/circularRange"
import Progress from "./lib/ui/progress"
import Range from "./lib/ui/range"

export interface ConstructorParameters {
  media: string
  container: string
  options: {
    duration?: number | string
    debug?: boolean
    autoplay?: boolean
    showNativeControls?: boolean
    controls: {
      playButton: boolean
      muteButton: boolean
      startTime: boolean
      endTime: boolean
      soundBar: boolean
      timeBar: boolean
      bufferBar: boolean
      backwardButton: boolean
      forwardButton: boolean
      playbackSpeedButton: boolean
      downloadButton: boolean
      previousButton: boolean
      nextButton: boolean
      repeatButton: boolean
    }
    tracks: {
      source: string
      title: string
      author: string
      thumbnail: string
      album: string
    }[]
    skipDuration: number
    muted?: boolean
    visualizer?: boolean
    playbackRate?: number
    preservesPitch?: boolean
    startTime?: number
    defaultVolume?: number
    visualizerType?: string
    metadata?: boolean
    title?: string
    author?: string
    album?: string
    thumbnail?: string
    circularTimeBar?: {
      radius?: number
      startAngle?: number
      endAngle?: number
      clockwise?: boolean
    }
    circularSoundBar?: {
      radius?: number
      startAngle?: number
      endAngle?: number
      clockwise?: boolean
    }
  }
}

export interface Elements {
  container: HTMLElement
  controls: HTMLElement
  metadata?: HTMLElement
  buttons: {
    play: HTMLElement | null
    mute: HTMLElement | null
    backward: HTMLElement | null
    forward: HTMLElement | null
    playbackSpeed: HTMLElement | null
    download: HTMLElement | null
    previous: HTMLElement | null
    next: HTMLElement | null
    repeat: HTMLElement | null
  }
  progress: {
    timeBar: Range | CircularRange | null
    bufferBar: Progress | CircularProgress | null //HTMLProgressElement
    currentTime: HTMLElement | null
    totalTime: HTMLElement | null
  }
  soundBar: Range | CircularRange | null
  visualizer: HTMLCanvasElement
  title?: HTMLElement
  author?: HTMLElement
  album?: HTMLElement
  thumbnail?: HTMLElement
}
