import { RangeShape } from "../enums"
import { ConstructorParameters } from "../types"

export function createConstructorParameters(
  options: Partial<ConstructorParameters>,
): ConstructorParameters {
  // Default controls configuration
  const defaultControls = {
    // Playback controls
    playButton: true,
    muteButton: true,
    backwardButton: true,
    forwardButton: true,
    playbackSpeedButton: false,

    // Time and progress controls
    currentTime: true,
    endTime: true,
    timeBar: true,
    bufferBar: true,

    // Sound controls
    soundBar: true,

    // Playlist and navigation controls
    previousButton: false,
    nextButton: false,
    repeatButton: false,
    randomButton: false,
    downloadButton: false,

    //
    metadata: false,
    playlist: false,
    visualizer: false,
  }

  // Default metadata configuration
  const defaultMetadata = {
    title: "",
    author: "",
    album: "",
    thumbnail: "",
  }

  // Default display options
  const defaultDisplayOptions = {
    showControls: true,
    showNativeControls: false,
    timeBar: {
      shape: RangeShape.Line,
      radius: 0,
      startAngle: 0,
      endAngle: 360,
      clockwise: true,
    },
    soundBar: {
      shape: RangeShape.Line,
      radius: 0,
      startAngle: 0,
      endAngle: 360,
      clockwise: true,
    },
    playbackSpeed: {
      options: [
        { label: "0.25x", value: 0.25 },
        { label: "0.5x", value: 0.5 },
        { label: "0.75x", value: 0.75 },
        { label: "1x", value: 1 },
        { label: "1.25x", value: 1.25 },
        { label: "1.5x", value: 1.5 },
        { label: "1.75x", value: 1.75 },
        { label: "2x", value: 2 },
      ],
      defaultSpeed: 1,
    },
  }

  // Default core configuration
  const defaultConfig: ConstructorParameters = {
    media: "",
    container: "",

    // Playback settings
    autoplay: false,
    muted: false,
    playbackRate: 1,
    preservesPitch: true,
    defaultVolume: 1,
    skipDuration: 15,

    // Merge default controls
    controls: { ...defaultControls, ...options.controls },

    // Merge default metadata
    metadata: { ...defaultMetadata, ...options.metadata },

    // Merge display options
    displayOptions: {
      ...defaultDisplayOptions,
      ...options.displayOptions,
      timeBar: {
        ...defaultDisplayOptions.timeBar,
        ...options.displayOptions?.timeBar,
      },
      soundBar: {
        ...defaultDisplayOptions.soundBar,
        ...options.displayOptions?.soundBar,
      },
    },

    // Other defaults
    tracks: [],
    livestream: false,
    crossOrigin: false,
  }

  // Deep merge the provided options with default configuration
  return {
    ...defaultConfig,
    ...options,
    // Ensure nested objects are properly merged
    controls: { ...defaultConfig.controls, ...options.controls },
    metadata: { ...defaultConfig.metadata, ...options.metadata },
    displayOptions: {
      ...defaultConfig.displayOptions,
      ...options.displayOptions,
      timeBar: {
        ...defaultConfig.displayOptions?.timeBar,
        ...options.displayOptions?.timeBar,
      },
      soundBar: {
        ...defaultConfig.displayOptions?.soundBar,
        ...options.displayOptions?.soundBar,
      },
    },
  }
}
