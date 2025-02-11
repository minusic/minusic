import {
  VisualizerDirection,
  VisualizerMode,
  VisualizerPosition,
  VisualizerShape,
  VisualizerStack,
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
import { applyStyles } from "./elements"

export default class Visualizer {
  private media!: HTMLMediaElement
  private canvas!: HTMLCanvasElement
  private context!: CanvasRenderingContext2D
  private audioContext!: AudioContext
  private audioSource!: MediaElementAudioSourceNode
  private analyser!: AnalyserNode
  initialized = false
  options = {
    tick: 21,
    width: 800,
    height: 600, //220,
    barAmplitude: 200, //220, // should default at max size
    outlineSize: 5,
    tickRadius: 1, //200,
    strokeWidth: 2, //3,
    frequencyRange: 0.75,
    frequencyMaxValue: 255,
    circleRadius: 120,
    circleStartAngle: 0, // 0 by default
    circleEndAngle: 360, // 360 by default
    shape: VisualizerShape.Circle,
    mode: VisualizerMode.Waves,
    position: VisualizerPosition.End,
    direction: VisualizerDirection.LeftToRight,
    symmetry: VisualizerSymmetry.None,
    canvasBackground: "transparent", //"#000",
    fillColor: "#f000", // "#89E76F",
    outlineColor: "#000",
    invertColors: false,
    showAxis: false,
    shadowColor: "#f000",
    shadowBlur: 0,
    shadowOffsetX: -10,
    shadowOffsetY: 10,
    stack: VisualizerStack.Duplicate,
    stackDepth: 8,
    stackScale: 0.9,
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
    applyStyles(this.canvas, {
      width: `${width}px`,
      height: `${height}px`,
    })
    const scale = window.devicePixelRatio || 1
    this.canvas.width = scale * width
    this.canvas.height = scale * height
    this.context.scale(scale, scale)
  }

  private applyStyles() {
    const gradient = this.context.createLinearGradient(0, 0, 900, 130)
    gradient.addColorStop(0, "#98067F")
    gradient.addColorStop(0.5, "#685FEE")
    gradient.addColorStop(1, "#98067F")
    this.context.fillStyle = this.options.fillColor || "transparent"
    this.context.strokeStyle = gradient //this.options.outlineColor
    this.context.lineWidth = this.options.strokeWidth
    this.context.shadowColor = this.options.shadowColor || "transparent"
    this.context.shadowBlur = this.options.shadowBlur || 0
    this.context.shadowOffsetX = this.options.shadowOffsetX || 0
    this.context.shadowOffsetY = this.options.shadowOffsetY || 0
  }

  update(paused: boolean) {
    if (!paused && !this.audioContext) this.initializeAudioContext()
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (this.options.showAxis) this.showAxis()
    if (this.options.invertColors) this.invertCanvasColors()

    let frequencies = this.getProcessedFrequencies(paused)
    if (!frequencies.length) return frequencies

    switch (this.options.stack) {
      case VisualizerStack.Duplicate:
        this.renderDuplicateStack(frequencies)
        break
      case VisualizerStack.Divide:
        this.renderDividedStack(frequencies)
        break
      default:
        this.renderVisualization(frequencies)
    }
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

  private renderDuplicateStack(frequencies: number[]) {
    this.renderVisualization(frequencies)
    let scaledFrequencies = [...frequencies]

    for (let i = 0; i < this.options.stackDepth; i++) {
      scaledFrequencies = scaledFrequencies.map(
        (value) => value * this.options.stackScale,
      )
      this.renderVisualization(scaledFrequencies)
    }
  }

  private renderDividedStack(frequencies: number[]): void {
    const chunkSize = Math.floor(frequencies.length / this.options.stackDepth)

    for (let i = 0; i < this.options.stackDepth; i++) {
      const frequencyChunk = frequencies.slice(
        i * chunkSize,
        (i + 1) * chunkSize,
      )
      this.renderVisualization(frequencyChunk)
    }
  }

  private renderCircleVisualization(frequencies: number[]) {
    const {
      mode,
      width,
      height,
      frequencyMaxValue,
      circleRadius,
      circleStartAngle,
      circleEndAngle,
    } = this.options

    if (mode === VisualizerMode.Waves) {
      const centerX = width / 2
      const centerY = height / 2
      const angleSize = circleEndAngle - circleStartAngle
      const angle =
        angleSize === 360
          ? angleSize / frequencies.length
          : angleSize / (frequencies.length - 1)

      const points = frequencies.map((freq, i) => {
        const size = (centerY - circleRadius) * (freq / frequencyMaxValue)
        const r = circleRadius + size
        let theta = angle * (i + 0.5) * (Math.PI / 180) + Math.PI / 2
        if (angleSize !== 360) {
          theta =
            angle * i * (Math.PI / 180) +
            Math.PI / 2 +
            circleStartAngle * (Math.PI / 180)
        }
        return [centerX + r * Math.cos(theta), centerY + r * Math.sin(theta)]
      })

      this.drawWaveform(points, angleSize === 360)
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
      circleStartAngle,
      circleEndAngle,
      mode,
    } = this.options
    const angleSize = circleEndAngle - circleStartAngle
    const angle =
      angleSize === 360
        ? angleSize / frequencies.length
        : angleSize / (frequencies.length - 1)
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
      if (angleSize === 360)
        this.context.rotate((i + 0.5) * angle * (Math.PI / 180))
      else
        this.context.rotate(
          i * angle * (Math.PI / 180) + circleStartAngle * (Math.PI / 180),
        )

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
    const isVertical = this.isVertical()
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
        points = this.boundWaveFrequencies(points)
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
    const isVertical = this.isVertical()
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
    const isVertical = this.isVertical()
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

  private boundWaveFrequencies(points: number[][]) {
    const { width: cW, height: cH, position, tickRadius } = this.options
    const isVertical = this.isVertical()

    let [startX, startY, endX, endY] = [0, 0, 0, 0]
    if (isVertical) {
      endY = cH
      if (position === VisualizerPosition.Center) startX = endX = cW / 2
      else if (position === VisualizerPosition.End) startX = endX = cW
    } else {
      endX = cW
      if (position === VisualizerPosition.Center) startY = endY = cH / 2
      else if (position === VisualizerPosition.End) startY = endY = cH
    }
    points.unshift([startX, startY])
    points.push([endX, endY])

    if (position === VisualizerPosition.Center) {
      const symmetricPoints = points
        .slice()
        .reverse()
        .map(([x, y]) => {
          return isVertical ? [cW - x, y] : [x, cH - y]
        })
      points.push(...symmetricPoints)
    }
    if (position === VisualizerPosition.Start) {
      points = points.map(([x, y, w = 0, h = 0]) =>
        isVertical ? [x + w, y, w, h] : [x, y + h, w, h],
      )
    }
    return points
  }

  private isVertical() {
    return [
      VisualizerDirection.TopToBottom,
      VisualizerDirection.BottomToTop,
    ].includes(this.options.direction)
  }

  private invertCanvasColors() {
    this.context.globalCompositeOperation = "source-over"
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.context.globalCompositeOperation = "destination-out"
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
