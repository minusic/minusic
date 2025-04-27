import { BaseRenderer } from "./BaseRenderer"
import {
  VisualizerDirection,
  VisualizerMode,
  VisualizerPosition,
} from "../../enums"
import {
  drawLine,
  drawCurve,
  drawDrop,
  drawLevels,
  drawRoundedRectangle,
} from "../../utils/canvas/canvas"

export class LineRenderer extends BaseRenderer {
  render(frequencies: number[]): void {
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
        this.drawWaveform(this.boundWaveFrequencies(points))
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
      case VisualizerMode.Particles:
        if (this.particles.length !== points.length)
          this.createParticles(points.length)
        this.drawParticles(points)
        break
    }
  }

  private drawWaveform(points: number[][], isClosed = false) {
    const { tickRadius } = this.options.elementStyling
    ;(tickRadius > 0 ? drawCurve : drawLine)(this.context, points, isClosed)
    this.context.fill()
  }

  protected drawLevels(x: number, y: number, w: number, h: number) {
    const { position, outlineSize, elementStyling } = this.options
    const { tickRadius } = elementStyling
    const isVertical = this.isVertical()
    if (position === VisualizerPosition.Start) {
      const diff = isVertical
        ? Math.ceil(w % (2 * outlineSize) || 1)
        : Math.ceil(h % (2 * outlineSize) || 1)
      if (isVertical) w -= diff
      else h -= diff
      drawLevels(this.context, x, y, w, h, outlineSize, tickRadius, isVertical)
    } else if (position === VisualizerPosition.Center) {
      const diff = isVertical
        ? Math.ceil(w % (2 * outlineSize) || 1)
        : Math.ceil(h % (2 * outlineSize) || 1)
      if (isVertical) x -= diff / 2
      else y -= diff / 2
      drawLevels(this.context, x, y, w, h, outlineSize, tickRadius, isVertical)
    } else if (position === VisualizerPosition.End) {
      drawLevels(this.context, x, y, w, h, outlineSize, tickRadius, isVertical)
    }
  }

  private drawDroplet(x: number, y: number, w: number, h: number) {
    const {
      position,
      outlineSize,
      elementStyling,
      width,
      height,
      strokeWidth,
    } = this.options
    const { tickRadius } = elementStyling

    const isVertical = this.isVertical()
    const canvasSize = isVertical ? width - strokeWidth : height - strokeWidth

    const angleMap = {
      [VisualizerPosition.Start]: isVertical ? 1 : 0,
      [VisualizerPosition.End]: isVertical ? 3 : 2,
      [VisualizerPosition.Center]: isVertical ? [1, 3] : [0, 2],
    }

    const angle = angleMap[position] ?? 0

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

  protected createParticles(tick: number) {
    this.particles = []
    for (let i = 0; i < tick; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 20 + 1,
        speed: Math.random() * 2 + 0.5,
        frequency: Math.floor(Math.random() * 255),
        opacity: Math.random() * 0.6 + 0.4,
        currentSize: 0,
        angle: Math.round(Math.random() * 360),
      })
    }
  }

  protected drawParticles(points: number[][]) {
    const isVertical = this.isVertical()
    const {
      position,
      elementStyling,
      fillColor,
      outlineColor,
      width,
      height,
      direction,
    } = this.options

    this.particles.forEach((particle, i) => {
      const [, , w, h] = points[i]
      particle.currentSize = isVertical ? w : h
    })

    const getDirectionSign = (isVertical: boolean, i: number): number => {
      const isStart = position === VisualizerPosition.Start
      const isEnd = position === VisualizerPosition.End
      const isCenterAlt = position === VisualizerPosition.Center && i % 2

      if (isVertical) {
        const topToBottom =
          (direction !== VisualizerDirection.BottomToTop && isStart) ||
          (direction === VisualizerDirection.BottomToTop && isEnd)
        return topToBottom || isCenterAlt ? 1 : -1
      } else {
        const leftToRight =
          (direction !== VisualizerDirection.RightToLeft && isStart) ||
          (direction === VisualizerDirection.RightToLeft && isEnd)
        return leftToRight || isCenterAlt ? 1 : -1
      }
    }

    this.particles.forEach((particle, i) => {
      const sizeRatio = particle.currentSize / 255
      const size = Math.round(particle.size * sizeRatio)
      const halfSize = size / 2

      const x = particle.x * width - halfSize
      const y = particle.y * height - halfSize

      this.context.fillStyle = Array.isArray(fillColor)
        ? fillColor[i % fillColor.length]
        : fillColor

      this.context.strokeStyle = Array.isArray(outlineColor)
        ? outlineColor[i % outlineColor.length]
        : fillColor

      const axis = isVertical ? "y" : "x"

      drawRoundedRectangle(
        this.context,
        x,
        y,
        size,
        size,
        elementStyling.tickRadius,
        particle.opacity,
        (particle.angle + 360 * particle[axis]) % 360,
      )
      this.context.fill()

      const sign = getDirectionSign(isVertical, i)
      const dimension = isVertical ? height : width
      const pos = particle[axis]
      const speed = particle.speed / dimension

      particle[axis] += sign * speed

      const boundary =
        sign > 0
          ? pos - size / dimension > 1
          : pos + particle.size / dimension < 0

      if (boundary) {
        particle[axis] = sign > 0 ? 0 : 1
      }
    })
  }

  private boundWaveFrequencies(points: number[][]) {
    const { width: cW, height: cH, position } = this.options
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
}
