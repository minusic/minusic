import { RangeShape } from "../enums"
import { MinusicConfiguration } from "../types"
import { deepMerge } from "../utils/object-utils/deepMerge"

export function createMinusicConfiguration(
  options: Partial<MinusicConfiguration>,
): MinusicConfiguration {
  // Default controls configuration
  const defaultControls = {
    // Playback controls
    play: true,
    skipBackward: true,
    skipForward: true,
    playbackSpeed: false,

    // Time and progress controls
    currentTime: true,
    duration: true,
    seekBar: true,
    bufferBar: true,

    // Sound controls
    mute: true,
    volume: true,

    // Playlist and navigation controls
    previous: false,
    nextButton: false,
    repeat: false,
    shuffle: false,
    download: false,

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
    seekBar: {
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
    shuffle: false,
    repeat: 0,
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
      seekBar: {
        ...defaultDisplayOptions.seekBar,
        ...options.displayOptions?.seekBar,
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
