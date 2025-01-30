import {
  VisualizerDirection,
  VisualizerMode,
  VisualizerPosition,
  VisualizerShape,
  VisualizerSymmetry,
} from "../enums"
import {
  drawCurve,
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
  initialized = false
  options = {
    tick: 40,
    width: 900,
    height: 400, //220,
    barAmplitude: 400, //220, // should default at max size
    outlineSize: 5,
    tickRadius: 1, //200,
    strokeWidth: 2, //3,
    frequencyRange: 0.75,
    frequencyMaxValue: 255,
    shape: VisualizerShape.Circle,
    mode: VisualizerMode.Drops,
    position: VisualizerPosition.End,
    direction: VisualizerDirection.LeftToRight,
    symmetry: VisualizerSymmetry.None,
    canvasBackground: "transparent", //"#000",
    fillColor: "#000", // "#89E76F",
    outlineColor: "#000",
    invertColors: false,
    circleRadius: 80,
    showAxis: true,
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

    this.initializeCanvas()
    this.initialized = true
    this.update(true)
  }

  private initializeCanvas() {
    const { canvasBackground } = this.options
    this.updateCanvasSize()
    this.applyStyles()
    if (canvasBackground) this.canvas.style.background = canvasBackground
  }

  private initializeAudioContext() {
    this.audioContext = new (window.AudioContext || null)()
    if (this.audioContext === null) {
      this.initialized = false
      return
    }

    this.audioSource = this.audioContext.createMediaElementSource(this.media)
    this.analyser = this.audioContext.createAnalyser()

    this.audioSource
      .connect(this.analyser)
      .connect(this.audioContext.destination)
  }

  private updateCanvasSize() {
    const { width, height } = this.options
    setStyle(this.canvas, {
      width: `${width}px`,
      height: `${height}px`,
    })
    const scale = window.devicePixelRatio || 1
    this.canvas.width = scale * width
    this.canvas.height = scale * height
    this.context.scale(scale, scale)
  }

  private applyStyles() {
    this.context.fillStyle = this.options.fillColor || "transparent"
    const gradient = this.context.createLinearGradient(0, 0, 900, 130)
    gradient.addColorStop(0, "#98067F")
    gradient.addColorStop(0.5, "#685FEE")
    gradient.addColorStop(1, "#98067F")
    this.context.strokeStyle = this.options.outlineColor
    this.context.lineWidth = this.options.strokeWidth
  }

  update(paused: boolean) {
    if (!paused && !this.audioContext) this.initializeAudioContext()
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (this.options.showAxis) this.showAxis()

    if (this.options.invertColors) {
      this.context.globalCompositeOperation = "source-over"
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
      this.context.globalCompositeOperation = "destination-out"
    }

    const frequencies = this.getProcessedFrequencies(paused)
    if (!frequencies.length) return frequencies
    this.renderVisualization(frequencies)
    return frequencies
  }

  private getProcessedFrequencies(paused: boolean) {
    const rawFrequencies = paused
      ? new Uint8Array(256).fill(0)
      : new Uint8Array(this.analyser.frequencyBinCount)

    if (!paused) this.analyser?.getByteFrequencyData(rawFrequencies)
    return this.applySymmetryAndDirection(rawFrequencies)
  }

  private applySymmetryAndDirection(frequencies: Uint8Array) {
    const { tick, frequencyRange, symmetry, direction } = this.options
    const step = Math.floor((frequencies.length * frequencyRange) / tick)
    const processedFreq = Array.from(
      { length: tick },
      (_, i) => frequencies[step * i],
    )

    if (symmetry === VisualizerSymmetry.Symmetric) {
      return [...processedFreq, ...processedFreq.reverse()]
    } else if (symmetry === VisualizerSymmetry.Reversed) {
      return [...[...processedFreq].reverse(), ...processedFreq]
    } else if (
      [
        VisualizerDirection.RightToLeft,
        VisualizerDirection.BottomToTop,
      ].includes(direction)
    ) {
      return processedFreq.reverse()
    }
    return processedFreq
  }

  private renderVisualization(frequencies: number[]) {
    const { shape } = this.options
    if (shape === VisualizerShape.Line) {
      this.renderLineVisualization(frequencies)
    } else if (shape === VisualizerShape.Circle) {
      this.renderCircleVisualization(frequencies)
    }
  }

  private renderCircleVisualization(frequencies: number[]) {
    const { mode, width, height, frequencyMaxValue, circleRadius } =
      this.options

    if (mode === VisualizerMode.Waves) {
      const centerX = width / 2
      const centerY = height / 2
      const angle = 360 / frequencies.length

      const points = frequencies.map((freq, i) => {
        const size = (centerY - circleRadius) * (freq / frequencyMaxValue)
        const r = circleRadius + size
        const theta = angle * (i + 0.5) * (Math.PI / 180) - Math.PI / 2
        return [centerX + r * Math.cos(theta), centerY + r * Math.sin(theta)]
      })

      this.drawWaveform(points, true)
      return
    }

    this.renderCircularBarsOrDrops(frequencies)
  }
  private renderCircularBarsOrDrops(frequencies: number[]) {
    const {
      outlineSize,
      frequencyMaxValue,
      barAmplitude,
      position,
      circleRadius,
      mode,
    } = this.options
    const angle = 360 / frequencies.length
    const x = -outlineSize / 2

    frequencies.forEach((freq, i) => {
      const amplitude = ((freq / frequencyMaxValue) * barAmplitude) / 2
      let y =
        position === VisualizerPosition.Start
          ? circleRadius - amplitude
          : position === VisualizerPosition.Center
            ? circleRadius - amplitude / 2
            : circleRadius

      this.context.save()
      this.context.translate(this.options.width / 2, this.options.height / 2)
      this.context.rotate((i + 0.5) * angle * (Math.PI / 180))

      if (mode === VisualizerMode.Bars) {
        this.drawBar(x, y, outlineSize, amplitude)
      } else if (mode === VisualizerMode.Drops) {
        this.drawDroplet(x, y, outlineSize, amplitude)
      }

      this.context.restore()
    })
  }
  private renderLineVisualization(frequencies: number[]) {
    const { width, height, frequencyMaxValue, barAmplitude, strokeWidth } =
      this.options
    const isVertical = [
      VisualizerDirection.TopToBottom,
      VisualizerDirection.BottomToTop,
    ].includes(this.options.direction)
    const unitSize = isVertical
      ? height / frequencies.length
      : width / frequencies.length

    const points = frequencies.map((freq, i) => {
      const amplitude =
        (freq / frequencyMaxValue) * (barAmplitude - strokeWidth * 2)
      const basePos = unitSize * i + unitSize / 2 - this.options.outlineSize / 2

      return isVertical
        ? [
            this.calculatePosition(amplitude),
            basePos,
            amplitude,
            this.options.outlineSize,
          ]
        : [
            basePos,
            this.calculatePosition(amplitude),
            this.options.outlineSize,
            amplitude,
          ]
    })

    this.renderVisualizationMode(points)
  }

  private renderVisualizationMode(points: number[][]) {
    const { mode } = this.options
    switch (mode) {
      case VisualizerMode.Waves:
        this.drawWaveform(points)
        break
      case VisualizerMode.Bars:
        points.forEach(([x, y, w, h]) => this.drawBar(x, y, w, h))
        break
      case VisualizerMode.Drops:
        points.forEach(([x, y, w, h]) => this.drawDroplet(x, y, w, h))
        break
      case VisualizerMode.Levels:
        points.forEach(([x, y, w, h]) => this.drawLevels(x, y, w, h))
        break
    }
  }

  private calculatePosition(amplitude: number) {
    const { position, width, height, strokeWidth } = this.options
    const isVertical = [
      VisualizerDirection.TopToBottom,
      VisualizerDirection.BottomToTop,
    ].includes(this.options.direction)
    const total = isVertical ? width : height

    switch (position) {
      case VisualizerPosition.Start:
        return strokeWidth
      case VisualizerPosition.End:
        return total - amplitude - strokeWidth
      case VisualizerPosition.Center:
        return total / 2 - amplitude / 2
      default:
        return strokeWidth
    }
  }

  private drawWaveform(points: number[][], isClosed = false) {
    const { tickRadius } = this.options
    ;(tickRadius > 0 ? drawCurve : drawLine)(this.context, points, isClosed)
    this.context.fill()
  }

  private drawBar(x: number, y: number, w: number, h: number) {
    drawRoundedRectangle(this.context, x, y, w, h, this.options.tickRadius)
  }

  private drawDroplet(x: number, y: number, w: number, h: number) {
    const {
      position,
      direction,
      outlineSize,
      tickRadius,
      width,
      height,
      strokeWidth,
      shape,
    } = this.options
    const isVertical = [
      VisualizerDirection.TopToBottom,
      VisualizerDirection.BottomToTop,
    ].includes(direction)
    const canvasSize = isVertical ? width - strokeWidth : height - strokeWidth

    const angleMap = {
      [VisualizerPosition.Start]: isVertical
        ? 1
        : shape === VisualizerShape.Circle
          ? 2
          : 0,
      [VisualizerPosition.End]: isVertical
        ? 3
        : shape === VisualizerShape.Circle
          ? 0
          : 2,
      [VisualizerPosition.Center]: isVertical ? [1, 3] : [0, 2],
    }
    let angle = angleMap[position] ?? 0
    if (isVertical && shape === VisualizerShape.Circle) {
      const circleAngleMap = {
        [VisualizerPosition.Start]: 3,
        [VisualizerPosition.End]: 0,
        [VisualizerPosition.Center]: [0, 2],
      }
      if (position === VisualizerPosition.Start) [w, h] = [h, w]
      angle = circleAngleMap[position]
    }

    drawDrop(
      this.context,
      x,
      y,
      w,
      h,
      outlineSize,
      angle,
      tickRadius,
      canvasSize,
    )
  }

  private drawLevels(x: number, y: number, w: number, h: number) {
    const { outlineSize, tickRadius } = this.options
    drawLevels(this.context, x, y, w, h, outlineSize, tickRadius)
  }

  private showAxis() {
    const { width: w, height: h } = this.options
    this.context.lineWidth = 2
    this.context.strokeStyle = "#f005"
    drawLine(this.context, [
      [w / 2, 0],
      [w / 2, h],
    ])
    drawLine(this.context, [
      [0, h / 2],
      [w, h / 2],
    ])
    drawRectangle(this.context, 0, 0, w, h)
    this.applyStyles()
  }
}
