import {
  VisualizerDirection,
  VisualizerMode,
  VisualizerPosition,
  VisualizerShape,
  VisualizerSymmetry,
} from "../enums"
import { drawRectangle, drawRoundedRectangle } from "./canvas"
import { setStyle } from "./elements"

export default class Visualizer {
  private media!: HTMLMediaElement
  private canvas!: HTMLCanvasElement
  private context!: CanvasRenderingContext2D
  private audioContext!: AudioContext
  private audioSource!: MediaElementAudioSourceNode
  private analyser!: AnalyserNode
  initialized: Boolean = false
  options = {
    tick: 100,
    width: 900,
    height: 400,//220,
    tickHeight: 400,//220,
    tickWidth: 10,
    tickRadius: 200,
    strokeWidth: 1, //3,
    range: 0.75,
    maxValue: 255,
    shape: VisualizerShape.Line,
    mode: VisualizerMode.Bars,
    position: VisualizerPosition.Center,
    direction: VisualizerDirection.RightToLeft,
    symmetry: VisualizerSymmetry.Reversed,
    backgroundColor: "transparent", //"#000",
    fillStyle: "transparent", // "#89E76F",
    invert: false,
  }

  constructor({
    canvas,
    media,
  }: {
    canvas: HTMLCanvasElement
    media: HTMLMediaElement
  }) {
    if (canvas?.nodeName !== "CANVAS") return

    this.canvas = canvas
    this.media = media
    this.context = canvas.getContext("2d") as CanvasRenderingContext2D

    this.updateCanvasSize()
    this.strokeStyle()
    this.fillStyle()
    this.initialized = true
    this.update(true)

    if (this.options.backgroundColor)
      this.canvas.style.background = this.options.backgroundColor
  }

  setAudioContext() {
    this.audioContext = this.getAudioContext() as AudioContext
    if (this.audioContext === null) {
      this.initialized = false
      return
    }

    this.audioSource = this.audioContext.createMediaElementSource(this.media)
    this.analyser = this.audioContext.createAnalyser()

    this.audioSource.connect(this.analyser)
    this.analyser.connect(this.audioContext.destination)
  }

  getAudioContext() {
    if (typeof AudioContext !== "undefined") {
      return new AudioContext()
    }
    return null
  }

  setScaleRatio() {
    const scale = window.devicePixelRatio || 1
    this.canvas.width = scale * this.options.width //this.elements.container.offsetWidth
    this.canvas.height = scale * this.options.height //this.elements.container.offsetHeight
    this.context.scale(scale, scale)
  }

  updateCanvasSize() {
    setStyle(this.canvas, {
      width: `${this.options.width}px`,
      height: `${this.options.height}px`,
    })
    this.setScaleRatio()
  }

  fillStyle() {
    this.context.fillStyle = this.options.fillStyle || "transparent"
  }

  strokeStyle() {
    const grad = this.context.createLinearGradient(0, 0, 900, 130)
    grad.addColorStop(0, "#98067F")
    grad.addColorStop(0.5, "#685FEE")
    grad.addColorStop(1, "#98067F")
    this.context.strokeStyle = grad
    this.context.lineWidth = this.options.strokeWidth
  }

  private frequencies(paused: boolean) {
    if (paused) {
      return new Uint8Array(Array(256).fill(0))
    } else {
      return new Uint8Array(this.analyser.frequencyBinCount)
    }
  }

  update(paused: boolean) {
    if (!paused && !this.audioContext) this.setAudioContext()
    this.clearCanvas()

    if (this.options.invert) this.invertContext()

    let frequencies: Uint8Array | number[] = this.frequencies(paused)
    this.analyser?.getByteFrequencyData(frequencies)

    const { tick, range, symmetry, direction, shape } = this.options
    const step = Math.floor(Math.floor(frequencies.length * range) / tick)
    let array = Array.from({ length: tick }, (_, i) => frequencies[step * i])

    if (symmetry === VisualizerSymmetry.Symmetric) {
      const symmetricDuplicate = [...array].reverse()
      array = [...array, ...symmetricDuplicate]
    } else if (symmetry === VisualizerSymmetry.Reversed) {
      const symmetricDuplicate = [...array].reverse()
      array = [...symmetricDuplicate, ...array]
    } else if (direction === VisualizerDirection.RightToLeft) {
      array.reverse()
    }

    if (!array.length) return frequencies

    if (shape === VisualizerShape.Line) {
      this.displayLine(array)
    }
    return frequencies
  }

  clearCanvas() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  displayLine(frequencies: number[]) {
    const {
      maxValue,
      tickHeight,
      strokeWidth,
      width,
      tickWidth,
      height,
      position,
      direction,
    } = this.options
    const length = frequencies.length
    const size = width / length

    //this.context.rotate((90 * Math.PI) / 180)
    for (let i = 0; i < length; i++) {
      const normalizedValue =
        (frequencies[i] / maxValue) * (tickHeight - strokeWidth * 2)
      const x = size * i + size / 2 - tickWidth / 2
      const w = tickWidth

      let y
      if (position === VisualizerPosition.Top) y = strokeWidth
      else if (position === VisualizerPosition.Bottom)
        y = height - normalizedValue - strokeWidth
      else if (position === VisualizerPosition.Center)
        y = height / 2 - normalizedValue / 2
      else {
        console.warn("Invalid value for visualizer 'position':", position)
        return
      }
      if (
        [
          VisualizerDirection.TopToBottom,
          VisualizerDirection.BottomToTop,
        ].includes(direction)
      ) {
        //
      }
      this.draw(x, y, w, normalizedValue)
    }
    //this.context.setTransform(1, 0, 0, 1, 0, 0)
  }

  draw(x: number, y: number, w: number, h: number) {
    switch (this.options.mode) {
      case VisualizerMode.Bars:
        drawRoundedRectangle(this.context, x, y, w, h, this.options.tickRadius)
        break
      default:
        console.warn("Invalid value for visualizer 'mode' option")
        return
    }
  }

  private invertContext() {
    this.context.globalCompositeOperation = "source-over"
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.context.globalCompositeOperation = "destination-out"
  }
}
