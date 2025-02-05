export enum CSSClass {
  Container = "minusic-container",
  Controls = "minusic-controls",
  Metadata = "minusic-metadata",
  ControlButton = "minusic-controls-button",
  PlayButton = "minusic-controls-play-button",
  MuteButton = "minusic-controls-mute-button",
  Range = "minusic-range",
  RangeBackground = "minusic-range-background",
  RangeProgress = "minusic-range-progress",
  RangeThumb = "minusic-range-thumb",
  CircularRange = "minusic-circular-range",
  CircularRangeBackground = "minusic-circular-range-background",
  CircularRangeProgress = "minusic-circular-range-progress",
  CircularRangeThumb = "minusic-circular-range-thumb",
  ProgressContainer = "minusic-progress-container",
  Progress = "minusic-progress",
  ProgressBar = "minusic-progress-bar",
  TimeBar = "minusic-controls-seek-bar",
  BufferBar = "minusic-controls-buffer-bar",
  SoundBar = "minusic-controls-sound-bar",
  CurrentTime = "minnusic-controls-current-time",
  TotalTime = "minnusic-controls-total-time",
  Visualizer = "minusic-visualizer",
  Title = "minnusic-meta-title",
  Author = "minnusic-meta-author",
  Album = "minnusic-meta-album",
  Thumbnail = "minnusic-meta-thumbnail",
}

export enum VisualizerShape {
  Line = "line",
  Circle = "circle",
  Polygon = "polygon",
}

export enum VisualizerPosition {
  Start = "start",
  End = "end",
  Center = "center",
}

export enum VisualizerDirection {
  LeftToRight = "ltr",
  RightToLeft = "rtl",
  TopToBottom = "ttb",
  BottomToTop = "btt",
}

export enum VisualizerSymmetry {
  Symmetric = "symmetric",
  Reversed = "reversed",
  None = "none",
}

export enum VisualizerMode {
  Bars = "bars",
  Levels = "levels",
  Drops = "drops",
  Waves = "waves",
}

export enum VisualizerStack {
  Duplicate = "duplicate",
  Divide = "divide",
  None = "none",
}
