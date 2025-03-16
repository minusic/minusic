import {
  CSSClass,
  VisualizerDirection,
  VisualizerGradient,
  VisualizerMode,
  VisualizerPosition,
  VisualizerShape,
  VisualizerStack,
  VisualizerSymmetry,
} from "../../enums"
import { VisualizerColor, VisualizerOptions } from "../../types"
import {
  createConicGradient,
  createLinearGradient,
  createRadialGradient,
  drawCurve,
  drawDrop,
  drawLevels,
  drawLine,
  drawRoundedRectangle,
} from "../canvas"
import { applyStyles, createElement } from "../elements"
import { AudioProcessor } from "./core/AudioProcessor"
import { CanvasManager } from "./core/CanvasManager"
import { DebugUtils } from "./utils/DebugUtils"

export default class Visualizer {
  private media!: HTMLMediaElement
  private canvas!: HTMLCanvasElement
  private context!: CanvasRenderingContext2D
  private audioContext!: AudioContext
  private audioSource!: MediaElementAudioSourceNode
  private canvasManager!: CanvasManager
  private audioProcessor!: AudioProcessor
  private debugUtils!: DebugUtils
  private analyser!: AnalyserNode
  initialized = false
  options: VisualizerOptions = {
    tick: 0,
    width: 0,
    height: 0,
    barAmplitude: 0,
    outlineSize: 0,
    tickRadius: 0,
    strokeWidth: 0,
    frequencyRange: 1,
    frequencyMaxValue: 255,
    circleRadius: 0,
    circleStartAngle: 0,
    circleEndAngle: 360,
    shape: VisualizerShape.Line,
    mode: VisualizerMode.Bars,
    position: VisualizerPosition.Center,
    direction: VisualizerDirection.LeftToRight,
    symmetry: VisualizerSymmetry.None,
    canvasBackground: "transparent",
    fillColor: "transparent",
    outlineColor: "transparent",
    invertColors: false,
    shadowColor: "transparent",
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    stack: VisualizerStack.None,
    stackDepth: 0,
    stackScale: 1,
    stackShift: 0,
    debug: {
      showAxis: false,
      showFPS: false,
    },
  }
  private debugTimestamp: number = 0

  constructor({
    container,
    media,
    options,
  }: {
    container: HTMLElement
    media: HTMLMediaElement
    options: VisualizerOptions
  }) {
    this.canvas = createElement(
      "canvas",
      { container },
      { class: CSSClass.Visualizer },
    ) as HTMLCanvasElement

    this.media = media
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D

    this.options = { ...this.options, ...options }

    this.initializeComponents()

    this.canvasManager.initializeCanvas()
    this.initialized = true
    this.update(true)
  }

  private initializeComponents() {
    this.canvasManager = new CanvasManager(
      this.canvas,
      this.context,
      this.options,
    )
    this.audioProcessor = new AudioProcessor(this.media)
    this.debugUtils = new DebugUtils(this.context, this.options)
  }

  private parseColor(color: VisualizerColor) {
    if (typeof color === "string") {
      return color
    } else if (typeof color === "object") {
      const canvasProperties = {
        context: this.context,
        width: this.options.width,
        height: this.options.height,
      }
      if (color.type === VisualizerGradient.Radial) {
        return createRadialGradient(canvasProperties, color)
      } else if (color.type === VisualizerGradient.Conic) {
        createConicGradient(canvasProperties, color)
      } else {
        return createLinearGradient(canvasProperties, color)
      }
    }
    return "transparent"
  }

  update(paused: boolean, timestamp?: number) {
    if (!paused && !this.audioProcessor.isInitialized()) {
      this.audioProcessor.initialize()
    }

    this.canvasManager.clearCanvas()
    if (this.options.debug.showAxis) this.debugUtils.showAxis()
    if (this.options.debug.showFPS) this.debugUtils.showFPS(timestamp)
    if (this.options.invertColors) this.canvasManager.invertCanvasColors()

    let frequencies = this.getProcessedFrequencies(paused)
    if (!frequencies.length) return frequencies

    switch (this.options.stack) {
      case VisualizerStack.Duplicate:
        this.renderDuplicateStack(frequencies)
        break
      case VisualizerStack.Divide:
        this.renderDividedStack(frequencies)
        break
      case VisualizerStack.Shift:
        this.renderShiftedStack(frequencies)
      default:
        this.setStackColors(0)
        this.renderVisualization(frequencies)
    }
    return frequencies
  }

  private getProcessedFrequencies(paused: boolean) {
    const rawFrequencies = this.audioProcessor.getFrequencyData(paused)
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
    let scaledFrequencies = [...frequencies]

    for (let i = 0; i < this.options.stackDepth + 1; i++) {
      this.setStackColors(i)
      this.renderVisualization(scaledFrequencies)
      scaledFrequencies = scaledFrequencies.map(
        (value) => value * this.options.stackScale,
      )
    }
  }

  private renderDividedStack(frequencies: number[]): void {
    const chunks = this.options.stackDepth + 1
    const chunkSize = Math.floor(frequencies.length / chunks)

    for (let i = 0; i < chunks; i++) {
      const frequencyChunk = frequencies.slice(
        i * chunkSize,
        (i + 1) * chunkSize,
      )
      this.setStackColors(i)
      this.renderVisualization(frequencyChunk)
    }
  }

  private renderShiftedStack(frequencies: number[]): void {
    const shift = this.options.stackShift
    let shiftFrequencies = [...frequencies]

    for (let i = 0; i < this.options.stackDepth; i++) {
      shiftFrequencies = [
        ...shiftFrequencies.slice(shift),
        ...shiftFrequencies.slice(0, shift),
      ]
      this.setStackColors(i + 1)
      this.renderVisualization(shiftFrequencies)
    }
  }

  private setStackColors(index: number = 0) {
    const { fillColor, outlineColor } = this.options
    if (fillColor instanceof Array) {
      index = index % fillColor.length
      this.context.fillStyle = this.parseColor(fillColor[index])
    }
    if (outlineColor instanceof Array) {
      index = index % outlineColor.length
      this.context.strokeStyle = this.parseColor(outlineColor[index])
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
}
