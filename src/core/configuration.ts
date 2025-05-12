import { RangeShape } from "../enums"
import { MinusicConfiguration } from "../types"
import { deepMerge } from "../utils/object-utils/deepMerge"

export function createMinusicConfiguration(
  options: Partial<MinusicConfiguration>,
): MinusicConfiguration {
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
  }

  const defaultPlayBack = {
    autoplay: false,
    volume: 1,
    muted: false,
    playbackRate: 1,
    preservePitch: true,
    skipDuration: 15,
    speedOptions: [
      { label: "x0.25", value: 0.25 },
      { label: "x0.5", value: 0.5 },
      { label: "x0.75", value: 0.75 },
      { label: "x1", value: 1 },
      { label: "x1.25", value: 1.25 },
      { label: "x1.5", value: 1.5 },
      { label: "x1.75", value: 1.75 },
      { label: "x2", value: 2 },
    ],
  }

  const defaultSelectors = {
    media: "",
    container: "",
  }

  const defaultAppearance = {
    showNativeControls: false,
    showCustomControls: true,
  }

  const defaultMedia = {
    crossOrigin: false,
    isLivestream: false,
    playlist: [],
  }

  // Default core configuration
  const defaultConfig: MinusicConfiguration = {
    selectors: defaultSelectors,
    playback: defaultPlayBack,
    controls: defaultControls,
    appearance: defaultAppearance,
    media: defaultMedia,

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
  }

  // Deep merge the provided options with default configuration
  return deepMerge(defaultConfig, options)
}
