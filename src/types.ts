import {
  VisualizerDirection,
  VisualizerMode,
  VisualizerPosition,
  VisualizerShape,
  VisualizerStack,
  VisualizerSymmetry,
} from "./enums"
import CircularProgress from "./lib/ui/circularProgress"
import CircularRange from "./lib/ui/circularRange"
import Progress from "./lib/ui/progress"
import Range from "./lib/ui/range"

export interface ConstructorParameters {
  media: string
  container: string
  options: {
    duration?: number | string
    autoplay?: boolean
    crossOrigin?: boolean
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
      randomButton: boolean
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
    visualizer?: VisualizerOptions
    playbackRate?: number
    preservesPitch?: boolean
    startTime?: number
    defaultVolume?: number
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
    random: HTMLElement | null
  }
  progress: {
    timeBar: Range | CircularRange | null
    bufferBar: Progress | CircularProgress | null //HTMLProgressElement
    currentTime: HTMLElement | null
    totalTime: HTMLElement | null
  }
  soundBar: Range | CircularRange | null
  title?: HTMLElement
  author?: HTMLElement
  album?: HTMLElement
  thumbnail?: HTMLImageElement
}

export interface VisualizerOptions {
  tick: number
  width: number
  height: number
  barAmplitude: number
  outlineSize: number
  tickRadius: number
  strokeWidth: number
  frequencyRange: number
  frequencyMaxValue: number
  circleRadius: number
  circleStartAngle: number
  circleEndAngle: number
  shape: VisualizerShape
  mode: VisualizerMode
  position: VisualizerPosition
  direction: VisualizerDirection
  symmetry: VisualizerSymmetry
  canvasBackground: string
  fillColor: VisualizerColor
  outlineColor: VisualizerColor
  invertColors: boolean
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  stack: VisualizerStack
  stackDepth: number
  stackScale: number
  stackShift: number
  debug: {
    showAxis: boolean
    showFPS: boolean
  }
}

export type VisualizerColor =
  | string
  | { type?: string; angle?: number; values: { [key: number]: string } }
