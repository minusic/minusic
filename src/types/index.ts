import {
  RangeShape,
  VisualizerDirection,
  VisualizerMode,
  VisualizerPosition,
  VisualizerShape,
  VisualizerStack,
  VisualizerSymmetry,
} from "../enums"
import CircularProgress from "../components/ui/circularProgress"
import CircularRange from "../components/ui/circularRange"
import Progress from "../components/ui/progress"
import Range from "../components/ui/range"

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
}

export interface Controls {
  // Playback controls
  playButton?: boolean
  muteButton?: boolean
  backwardButton?: boolean
  forwardButton?: boolean
  playbackSpeedButton?: boolean

  // Time and progress controls
  currentTime?: boolean
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

  //
  metadata?: boolean
  playlist?: boolean
  visualizer?: boolean
}

export interface DisplayOptions {
  showControls?: boolean
  showNativeControls?: boolean
  timeBar?: RangeConfiguration
  soundBar?: RangeConfiguration
}

export interface TrackConfig {
  source: string | string[] | TrackSource
  title: string
  author: string
  thumbnail?: string
  album?: string
  duration?: string | number
  download?: boolean
  waveform?: string
}

export interface TrackSource {
  source: string
  type: string
}

interface RangeConfiguration {
  shape?: RangeShape
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
    bufferBar: Progress | CircularProgress | null
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

export interface VisualizerConfiguration extends VisualizerOptions {
  stack: {
    type: VisualizerStack
    depth: number
    scale: number
    shift: number
  }
  shadow: {
    color: string
    blur: number
    offsetX: number
    offsetY: number
  }
  debug: {
    showAxis: boolean
    showFPS: boolean
  }
  elementStyling: {
    tickRadius: number
  }
  shapeOptions: {
    circleRadius: number
    circleStartAngle: number
    circleEndAngle: number

    polygonRadius: number
    polygonSides: number
    polygonRotation: number
  }
}

export interface VisualizerOptions {
  // Core Visualization Parameters
  shape: VisualizerShape
  mode: VisualizerMode
  position: VisualizerPosition
  direction: VisualizerDirection
  symmetry: VisualizerSymmetry

  // Canvas and Rendering Dimensions
  width: number
  height: number
  canvasBackground: string

  // Visualization Detail and Precision
  tick: number
  barAmplitude: number
  frequencyRange: number
  frequencyMaxValue: number

  // Styling Parameters
  fillColor: VisualizerColor
  outlineColor: VisualizerColor
  outlineSize: number
  strokeWidth: number
  invertColors: boolean

  // Shape-Specific Parameters
  shapeOptions?: {
    // Circular Shape Options
    circleRadius: number
    circleStartAngle: number
    circleEndAngle: number

    // Polygon Shape Options
    polygonRadius: number
    polygonSides: number
    polygonRotation: number
  }

  // Visualization Element Styling
  elementStyling?: {
    tickRadius: number
  }

  shadow: {
    color?: string
    blur?: number
    offsetX?: number
    offsetY?: number
  }

  // Visualization Stacking and Duplication
  stack?: {
    type: VisualizerStack
    depth: number
    scale: number
    shift: number
  }

  // Debug Options
  debug?: {
    showAxis?: boolean
    showFPS?: boolean
  }
}

export type VisualizerColor =
  | string
  | { type?: string; angle?: number; values: { [key: number]: string } }
