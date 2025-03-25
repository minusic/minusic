import { ConstructorParameters } from "./types"

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
    startTime: true,
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
    circularTimeBar: {
      radius: 50,
      startAngle: 0,
      endAngle: 360,
      clockwise: true,
    },
    circularSoundBar: {
      radius: 50,
      startAngle: 0,
      endAngle: 360,
      clockwise: true,
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
    defaultVolume: 0.7,
    skipDuration: 15,

    // Merge default controls
    controls: { ...defaultControls, ...options.controls },

    // Merge default metadata
    metadata: { ...defaultMetadata, ...options.metadata },

    // Merge display options
    displayOptions: {
      ...defaultDisplayOptions,
      ...options.displayOptions,
      // Ensure circular bars are properly merged
      circularTimeBar: {
        ...defaultDisplayOptions.circularTimeBar,
        ...options.displayOptions?.circularTimeBar,
      },
      circularSoundBar: {
        ...defaultDisplayOptions.circularSoundBar,
        ...options.displayOptions?.circularSoundBar,
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
      circularTimeBar: {
        ...defaultConfig.displayOptions?.circularTimeBar,
        ...options.displayOptions?.circularTimeBar,
      },
      circularSoundBar: {
        ...defaultConfig.displayOptions?.circularSoundBar,
        ...options.displayOptions?.circularSoundBar,
      },
    },
  }
}
