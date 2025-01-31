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
    title?: string
    author?: string
    album?: string
    thumbnail?: string
  }
}

export interface Elements {
  container: HTMLElement
  controls: HTMLElement
  metadata: HTMLElement
  buttons: {
    play: HTMLElement
    mute: HTMLElement
  }
  progress: {
    timeBar: HTMLInputElement
    bufferBar: HTMLProgressElement
    currentTime: HTMLElement
    totalTime: HTMLElement
  }
  soundBar: HTMLInputElement
  visualizer: HTMLCanvasElement
  title: HTMLElement
  author: HTMLElement
  album: HTMLElement
  thumbnail: HTMLElement
}
