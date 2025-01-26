import {
  VisualizerDirection,
  VisualizerMode,
  VisualizerPosition,
  VisualizerShape,
  VisualizerSymmetry,
} from "../enums"
import {
  drawDrop,
  drawLevels,
  drawLine,
  drawRectangle,
  drawRoundedRectangle,
} from "./canvas"
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
    tick: 40,
    canvasWidth: 900,
    canvasHeight: 400, //220,
    barAmplitude: 400, //220, // should default at max size
    barThickness: 10,
    tickRadius: 0, //200,
    strokeWidth: 1, //3,
    range: 0.75,
    maxValue: 255,
    shape: VisualizerShape.Line,
    mode: VisualizerMode.Drops,
    position: VisualizerPosition.Center,
    direction: VisualizerDirection.LeftToRight,
    symmetry: VisualizerSymmetry.Reversed,
    backgroundColor: "transparent", //"#000",
    fillStyle: "transparent", // "#89E76F",
    strokeStyle: "#000",
    invertColors: false,
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
    this.canvas.width = scale * this.options.canvasWidth
    this.canvas.height = scale * this.options.canvasHeight
    this.context.scale(scale, scale)
  }

  updateCanvasSize() {
    setStyle(this.canvas, {
      width: `${this.options.canvasWidth}px`,
      height: `${this.options.canvasHeight}px`,
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
    this.context.strokeStyle = this.options.strokeStyle
  }

  private getFrequencies(paused: boolean) {
    return paused
      ? new Uint8Array(Array(256).fill(0))
      : new Uint8Array(this.analyser.frequencyBinCount)
  }

  update(paused: boolean) {
    if (!paused && !this.audioContext) this.setAudioContext()
    this.clearCanvas()
    this.showAxis()

    if (this.options.invertColors) this.applyInvertEffect()

    let frequencyData: Uint8Array | number[] = this.getFrequencies(paused)
    this.analyser?.getByteFrequencyData(frequencyData)

    let processedFrequencies = this.applySymmetryAndDirection(frequencyData)

    if (!processedFrequencies.length) return frequencyData

    if (this.options.shape === VisualizerShape.Line) {
      //processedFrequencies = Array(20).fill(255).map((v,i) => v-i)
      this.displayLine(processedFrequencies)
    }
    return frequencyData
  }

  applySymmetryAndDirection(frequencyData: Uint8Array) {
    const { tick, range, symmetry, direction } = this.options
    const step = Math.floor(Math.floor(frequencyData.length * range) / tick)
    let frequencies = Array.from(
      { length: tick },
      (_, i) => frequencyData[step * i],
    )
    if (symmetry === VisualizerSymmetry.Symmetric) {
      const symmetricDuplicate = [...frequencies].reverse()
      return [...frequencies, ...symmetricDuplicate]
    } else if (symmetry === VisualizerSymmetry.Reversed) {
      const symmetricDuplicate = [...frequencies].reverse()
      return [...symmetricDuplicate, ...frequencies]
    } else if (
      direction === VisualizerDirection.RightToLeft ||
      direction === VisualizerDirection.BottomToTop
    ) {
      return [...frequencies].reverse()
    }
    return frequencies
  }

  clearCanvas() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  displayLine(frequencies: number[]) {
    const {
      maxValue,
      barAmplitude,
      strokeWidth,
      canvasWidth: width,
      barThickness,
      canvasHeight: height,
      position,
    } = this.options
    const totalBars = frequencies.length
    const isVertical = this.isVertical()

    const size = isVertical ? height / totalBars : width / totalBars

    for (let i = 0; i < totalBars; i++) {
      const normalizedValue =
        (frequencies[i] / maxValue) * (barAmplitude - strokeWidth * 2)

      const primaryPos = size * i + size / 2 - barThickness / 2

      if (isVertical) {
        const primaryAxis = primaryPos
        const secondaryAxis = this.getPosition(
          position,
          width,
          normalizedValue,
          strokeWidth,
        )
        if (secondaryAxis === null) return
        this.draw(secondaryAxis, primaryAxis, normalizedValue, barThickness)
      } else {
        const primaryAxis = primaryPos
        const secondaryAxis = this.getPosition(
          position,
          height,
          normalizedValue,
          strokeWidth,
        )
        if (secondaryAxis === null) return
        this.draw(primaryAxis, secondaryAxis, barThickness, normalizedValue)
      }
    }
  }

  getPosition(
    alignment: VisualizerPosition,
    totalSize: number,
    barSize: number,
    stroke: number,
  ) {
    switch (alignment) {
      case VisualizerPosition.Top:
        return stroke
      case VisualizerPosition.Bottom:
        return totalSize - barSize - stroke
      case VisualizerPosition.Center:
        return totalSize / 2 - barSize / 2
      default:
        console.warn(`Invalid value for visualizer position: ${alignment}`)
        return null
    }
  }

  isVertical() {
    return [
      VisualizerDirection.TopToBottom,
      VisualizerDirection.BottomToTop,
    ].includes(this.options.direction)
  }

  draw(x: number, y: number, w: number, h: number) {
    const { barThickness, mode, tickRadius } = this.options
    switch (mode) {
      case VisualizerMode.Bars:
        drawRoundedRectangle(this.context, x, y, w, h, tickRadius)
        break
      case VisualizerMode.Drops:
        this.drawDrop(x, y, w, h)

        break
      case VisualizerMode.Levels:
        drawLevels(this.context, x, y, w, h, barThickness, tickRadius)
        break
      default:
        console.warn(
          `Invalid value for visualizer mode option: ${this.options.mode}`,
        )
        return
    }
  }

  private drawDrop(x: number, y: number, width: number, height: number) {
    const {
      tickRadius,
      barThickness,
      canvasWidth,
      canvasHeight,
      strokeWidth,
      position,
    } = this.options

    const isVertical = this.isVertical()
    const canvasSize = isVertical
      ? canvasWidth - strokeWidth
      : canvasHeight - strokeWidth

    const positionAngles: Record<VisualizerPosition, number | number[]> = {
      [VisualizerPosition.Top]: isVertical ? 1 : 0,
      [VisualizerPosition.Bottom]: isVertical ? 3 : 2,
      [VisualizerPosition.Center]: isVertical ? [1, 3] : [0, 2],
    }

    const dropAngle = positionAngles[position] ?? 0

    drawDrop(
      this.context,
      x,
      y,
      width,
      height,
      barThickness,
      dropAngle,
      tickRadius,
      canvasSize,
    )
  }

  private rotateContext(angle: number = 0) {
    //this.context.save()
    this.context.translate(this.canvas.width / 2, this.canvas.height / 2)
    this.context.rotate(angle * (Math.PI / 180))
    this.context.translate(-(this.canvas.width / 2), -(this.canvas.height / 2))
    //this.context.restore()
  }

  private applyInvertEffect() {
    this.context.globalCompositeOperation = "source-over"
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.context.globalCompositeOperation = "destination-out"
  }

  private showAxis() {
    this.context.lineWidth = 2
    this.context.strokeStyle = "#f005"
    drawLine(this.context, [
      [this.options.canvasWidth / 2, 0],
      [this.options.canvasWidth / 2, this.options.canvasHeight],
    ])
    drawLine(this.context, [
      [0, this.options.canvasHeight / 2],
      [this.options.canvasWidth, this.options.canvasHeight / 2],
    ])
    drawRectangle(
      this.context,
      0,
      0,
      this.options.canvasWidth,
      this.options.canvasHeight,
    )
    this.strokeStyle()
  }
}
