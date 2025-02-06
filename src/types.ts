import CircularRange from "./lib/ui/circularRange"
import Range from "./lib/ui/range"

export interface ConstructorParameters {
  target: string
  options: {
    duration?: number | string
    debug?: boolean
    autoplay?: boolean
    controls?: boolean
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
    circularSoundBar?: {
      radius?: number
    }
  }
}

export interface Elements {
  container: HTMLElement
  controls: HTMLElement
  metadata?: HTMLElement
  buttons: {
    play: HTMLElement
    mute: HTMLElement
  }
  progress: {
    timeBar: any //HTMLInputElement
    bufferBar: any //HTMLProgressElement
    currentTime: HTMLElement
    totalTime: HTMLElement
  }
  soundBar: Range | CircularRange
  visualizer: HTMLCanvasElement
  title?: HTMLElement
  author?: HTMLElement
  album?: HTMLElement
  thumbnail?: HTMLElement
}
