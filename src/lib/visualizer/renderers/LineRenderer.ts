import { BaseRenderer } from "./BaseRenderer"
import { VisualizerMode, VisualizerPosition } from "../../../enums"
import { drawLine, drawCurve, drawDrop, drawLevels } from "../../canvas"

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
        const boundedPoints = this.boundWaveFrequencies(points)
        this.drawWaveform(boundedPoints)
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
      direction,
      outlineSize,
      elementStyling,
      width,
      height,
      strokeWidth,
      shape,
    } = this.options
    const { tickRadius } = elementStyling

    const isVertical = this.isVertical()
    const canvasSize = isVertical ? width - strokeWidth : height - strokeWidth

    const angleMap = {
      [VisualizerPosition.Start]: isVertical ? 1 : 0,
      [VisualizerPosition.End]: isVertical ? 3 : 2,
      [VisualizerPosition.Center]: isVertical ? [1, 3] : [0, 2],
    }

    let angle = angleMap[position] ?? 0

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
