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
  initialized: Boolean = false
  options = {
    tick: 10,
    canvasWidth: 900,
    canvasHeight: 400, //220,
    barAmplitude: 400, //220, // should default at max size
    barThickness: 5,
    tickRadius: 1, //200,
    strokeWidth: 2, //3,
    range: 0.75,
    maxValue: 255,
    shape: VisualizerShape.Circle,
    mode: VisualizerMode.Waves,
    position: VisualizerPosition.Center,
    direction: VisualizerDirection.RightToLeft,
    symmetry: VisualizerSymmetry.None,
    backgroundColor: "transparent", //"#000",
    fillStyle: "#000", // "#89E76F",
    strokeStyle: "#000",
    invertColors: false,
    radius: 80,
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

    //processedFrequencies = Array(20).fill(255).map((v,i) => v-i)
    if (this.options.shape === VisualizerShape.Line) {
      this.displayLine(processedFrequencies)
    } else if (this.options.shape === VisualizerShape.Circle) {
      this.displayCircle(processedFrequencies)
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

  displayCircle(frequencies: number[]) {
    const {
      maxValue,
      barThickness,
      barAmplitude,
      tickRadius,
      position,
      radius,
      mode,
      canvasHeight,
      canvasWidth,
      strokeWidth,
    } = this.options
    const x = -barThickness / 2
    const angle = 360 / frequencies.length

    if (mode === VisualizerMode.Waves) {
      const h = canvasWidth / 2
      const k = canvasHeight / 2

      const amplitudes = frequencies.map((frequency, i) => {
        const size = (k - radius) * (frequency / maxValue)
        const r = radius + size
        return [
          h + r * Math.cos(angle * (i + 0.5) * (Math.PI / 180) - Math.PI / 2),
          k + r * Math.sin(angle * (i + 0.5) * (Math.PI / 180) - Math.PI / 2),
        ]
      })
      ;(tickRadius > 0 ? drawCurve : drawLine)(this.context, amplitudes, true)
      return
    }

    for (let i = 0, l = frequencies.length; i < l; i++) {
      const amplitude = ((frequencies[i] / maxValue) * barAmplitude) / 2
      let y = 0
      if (position === VisualizerPosition.Start) y = radius - amplitude
      else if (position === VisualizerPosition.Center)
        y = radius - amplitude / 2
      else y = radius
      this.context.save()
      this.rotateContext((i + 0.5) * angle)
      if (mode === VisualizerMode.Bars) {
        drawRoundedRectangle(
          this.context,
          x,
          y,
          barThickness,
          amplitude,
          tickRadius,
        )
      } else if (mode === VisualizerMode.Drops) {
        let dropAngle = position === VisualizerPosition.Center ? [0, 2] : 2
        if (position === VisualizerPosition.Start)
          y = radius - amplitude + barThickness
        else if (position === VisualizerPosition.End) y = radius + amplitude
        //
        drawDrop(
          this.context,
          x,
          y,
          barThickness,
          amplitude,
          barThickness,
          dropAngle,
          tickRadius,
          canvasHeight - strokeWidth,
        )
      }

      //
      this.context.restore()
    }
  }

  displayLine(frequencies: number[]) {
    const {
      maxValue,
      barAmplitude,
      strokeWidth,
      canvasWidth,
      barThickness,
      canvasHeight,
      position,
    } = this.options
    const totalTicks = frequencies.length
    const isVertical = this.isVertical()
    const size = isVertical
      ? canvasHeight / totalTicks
      : canvasWidth / totalTicks
    const thickness = this.isLine() ? 0 : barThickness
    const points = []
    for (let i = 0; i < totalTicks; i++) {
      const amplitude =
        (frequencies[i] / maxValue) * (barAmplitude - strokeWidth * 2)
      const basePosition = size * i + size / 2 - thickness / 2

      const x = isVertical
        ? (this.getPosition(
            position,
            canvasWidth,
            amplitude,
            strokeWidth,
          ) as number)
        : basePosition
      const y = isVertical
        ? basePosition
        : (this.getPosition(
            position,
            canvasHeight,
            amplitude,
            strokeWidth,
          ) as number)
      const w = isVertical ? amplitude : thickness
      const h = isVertical ? thickness : amplitude
      points.push([x, y, w, h])
    }
    this.drawLine(points)
  }

  getPosition(
    alignment: VisualizerPosition,
    totalSize: number,
    barSize: number,
    stroke: number,
  ) {
    switch (alignment) {
      case VisualizerPosition.Start:
        return stroke
      case VisualizerPosition.End:
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

  isLine() {
    return this.options.mode === VisualizerMode.Waves
  }

  drawLine(points: number[][]) {
    const { barThickness, mode, tickRadius } = this.options
    switch (mode) {
      case VisualizerMode.Waves:
        this.drawWaves(points)
        break
      case VisualizerMode.Bars:
        points.forEach((point) => {
          const [x, y, w, h] = point
          drawRoundedRectangle(this.context, x, y, w, h, tickRadius)
        })
        break
      case VisualizerMode.Drops:
        points.forEach((point) => {
          const [x, y, w, h] = point
          this.drawDrop(x, y, w, h)
        })
        break
      case VisualizerMode.Levels:
        points.forEach((point) => {
          const [x, y, w, h] = point
          drawLevels(this.context, x, y, w, h, barThickness, tickRadius)
        })
        break
      default:
        console.warn(`Invalid value for visualizer mode option: ${mode}`)
        return
    }
  }

  private drawWaves(points: number[][]) {
    const {
      canvasWidth: cW,
      canvasHeight: cH,
      position,
      tickRadius,
    } = this.options
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

    ;(tickRadius > 0 ? drawCurve : drawLine)(this.context, points)
    this.context.fill()
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
      [VisualizerPosition.Start]: isVertical ? 1 : 0,
      [VisualizerPosition.End]: isVertical ? 3 : 2,
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
    this.context.translate(
      this.options.canvasWidth / 2,
      this.options.canvasHeight / 2,
    )
    this.context.rotate(angle * (Math.PI / 180))
  }

  private applyInvertEffect() {
    this.context.globalCompositeOperation = "source-over"
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.context.globalCompositeOperation = "destination-out"
  }

  private showAxis() {
    const { canvasWidth: w, canvasHeight: h } = this.options
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
    this.strokeStyle()
  }
}
