export interface ConstructorParameters {
  target: string
  options: {
    duration?: number | string
    debug?: boolean
  }
}

export interface Elements {
  container: HTMLElement
  controls: HTMLElement
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
}
