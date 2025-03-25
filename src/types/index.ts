import {
  VisualizerDirection,
  VisualizerMode,
  VisualizerPosition,
  VisualizerShape,
  VisualizerStack,
  VisualizerSymmetry,
} from "../enums"
import CircularProgress from "../lib/ui/circularProgress"
import CircularRange from "../lib/ui/circularRange"
import Progress from "../lib/ui/progress"
import Range from "../lib/ui/range"

export interface PlayerConfiguration extends ConstructorParameters {
  skipDuration: number
  tracks: TrackConfig[]
  metadata: {
    title: string
    author: string
    album: string
    thumbnail: string
  }
  controls: {
    [Key in keyof Controls]: Controls[Key]
  }
  displayOptions: {
    [Key in keyof DisplayOptions]: DisplayOptions[Key]
  }
}

export interface ConstructorParameters {
  // Media source configuration
  media: string
  container: string

  // Playback core settings
  autoplay?: boolean
  duration?: number | string
  startTime?: number
  endTime?: number
  muted?: boolean
  playbackRate?: number
  preservesPitch?: boolean
  defaultVolume?: number
  skipDuration?: number

  // Content metadata
  metadata?: {
    title?: string
    author?: string
    album?: string
    thumbnail?: string
  }

  // Tracks configuration
  tracks?: TrackConfig[]

  // Playback environment settings
  crossOrigin?: boolean
  livestream?: boolean

  // Display and interaction controls
  displayOptions?: DisplayOptions

  controls?: Controls

  // Optional visualization
  visualizer?: VisualizerOptions

  // options: {
  //   autoplay?: boolean
  //   duration?: number | string
  //   crossOrigin?: boolean
  //   showControls?: boolean
  //   showNativeControls?: boolean
  //   livestream?: boolean
  //   controls: {
  //     playButton: boolean
  //     muteButton: boolean
  //     startTime: boolean
  //     endTime: boolean
  //     soundBar: boolean
  //     timeBar: boolean
  //     bufferBar: boolean
  //     backwardButton: boolean
  //     forwardButton: boolean
  //     playbackSpeedButton: boolean
  //     downloadButton: boolean
  //     previousButton: boolean
  //     nextButton: boolean
  //     repeatButton: boolean
  //     randomButton: boolean
  //   }
  //   tracks: {
  //     source: string
  //     title: string
  //     author: string
  //     thumbnail: string
  //     album: string
  //     duration?: string | number
  //     download?: boolean
  //     waveform?: string
  //   }[]
  //   skipDuration: number
  //   muted?: boolean
  //   visualizer?: VisualizerOptions
  //   playbackRate?: number
  //   preservesPitch?: boolean
  //   startTime?: number
  //   defaultVolume?: number
  //   metadata?: boolean
  //   title?: string
  //   author?: string
  //   album?: string
  //   thumbnail?: string
  //   circularTimeBar?: {
  //     radius?: number
  //     startAngle?: number
  //     endAngle?: number
  //     clockwise?: boolean
  //   }
  //   circularSoundBar?: {
  //     radius?: number
  //     startAngle?: number
  //     endAngle?: number
  //     clockwise?: boolean
  //   }
  // }
}

export interface Controls {
  // Playback controls
  playButton?: boolean
  muteButton?: boolean
  backwardButton?: boolean
  forwardButton?: boolean
  playbackSpeedButton?: boolean

  // Time and progress controls
  startTime?: boolean
  endTime?: boolean
  timeBar?: boolean
  bufferBar?: boolean

  // Sound controls
  soundBar?: boolean

  // Playlist and navigation controls
  previousButton?: boolean
  nextButton?: boolean
  repeatButton?: boolean
  randomButton?: boolean
  downloadButton?: boolean
}

export interface DisplayOptions {
  showControls?: boolean
  showNativeControls?: boolean
  circularTimeBar?: CircularBarConfig
  circularSoundBar?: CircularBarConfig
}

export interface TrackConfig {
  source: string
  title: string
  author: string
  thumbnail?: string
  album?: string
  duration?: string | number
  download?: boolean
  waveform?: string
}

interface CircularBarConfig {
  radius?: number
  startAngle?: number
  endAngle?: number
  clockwise?: boolean
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
    playbackSpeed: { menu: HTMLElement; update: (value: string) => void } | null
    download: HTMLAnchorElement | null
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
  livestream?: HTMLElement | null
  soundBar: Range | CircularRange | null
  title?: HTMLElement
  author?: HTMLElement
  album?: HTMLElement
  thumbnail?: HTMLImageElement
  playlist: {
    trackContainer: HTMLElement
    tracks: HTMLElement[]
  }
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
  polygonRadius: number
  polygonSides: number
  polygonRotation: number
}

export type VisualizerColor =
  | string
  | { type?: string; angle?: number; values: { [key: number]: string } }
