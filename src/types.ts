import {
  RangeShape,
  VisualizerDirection,
  VisualizerMode,
  VisualizerPosition,
  VisualizerShape,
  VisualizerStack,
  VisualizerSymmetry,
} from "./enums"
import CircularProgress from "./components/ui/circularProgress"
import CircularRange from "./components/ui/circularRange"
import Progress from "./components/ui/progress"
import Range from "./components/ui/range"

export interface PlayerConfiguration extends MinusicConfiguration {
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

export interface MinusicConfiguration {
  // Media source configuration
  selectors: {
    media: string
    container: string
  }

  // Playback settings
  playback: {
    autoplay: boolean
    volume: number
    muted: boolean
    playbackRate: number
    preservePitch: boolean
    skipDuration: number
    speedOptions: Array<{
      value: number
      label: string
    }>
  }

  // Appearance settings
  appearance: {
    showCustomControls: boolean
    showNativeControls: boolean
  }

  // Media settings
  media: {
    crossOrigin: boolean | "anonymous" | "use-credentials"
    isLivestream: boolean

    // Current track info (single track use case)
    currentTrack?: {
      source: string | string[] | { source: string; type: string } // Audio source URL(s) or object with MIME type
      metadata: TrackMetadata // Track metadata
    }

    // Playlist (multi-track use case)
    playlist: TrackInfo[]
  }

  // Content metadata
  metadata?: {
    title?: string
    author?: string
    album?: string
    thumbnail?: string
  }

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

export interface TrackInfo {
  source: string | string[] | { source: string; type: string }
  metadata: TrackMetadata
  allowDownload?: boolean
}

export interface TrackMetadata {
  title: string
  artist: string
  album?: string
  thumbnail?: string
  waveform?: string
  duration?: string | number
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

export interface PlaybackSpeedOption {
  label: string
  value: string | number
}

export interface Elements {
  container: HTMLElement
  controls: HTMLElement
  metadata?: HTMLElement
  buttons: {
    play: HTMLButtonElement | null
    mute: HTMLButtonElement | null
    backward: HTMLButtonElement | null
    forward: HTMLButtonElement | null
    playbackSpeed: any /*{
      button: ToggleButton
      update: (value: number) => void
    } | null*/
    download: HTMLAnchorElement | null
    previous: HTMLButtonElement | null
    next: HTMLButtonElement | null
    repeat: HTMLButtonElement | null
    random: HTMLButtonElement | null
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
