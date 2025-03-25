import { BaseRenderer } from "./BaseRenderer"
import { VisualizerMode, VisualizerPosition } from "../../../enums"
import { drawCurve, drawLine, drawDrop } from "../../canvas"

export class CircleRenderer extends BaseRenderer {
  render(frequencies: number[]): void {
    const { mode } = this.options

    if (mode === VisualizerMode.Waves) {
      this.renderCircularWaves(frequencies)
    } else {
      this.renderCircularBarsOrDrops(frequencies)
    }
  }

  private renderCircularWaves(frequencies: number[]) {
    const { width, height, frequencyMaxValue, shapeOptions } = this.options
    const { circleRadius, circleStartAngle, circleEndAngle } = shapeOptions

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
  }

  private renderCircularBarsOrDrops(frequencies: number[]) {
    const {
      outlineSize,
      frequencyMaxValue,
      barAmplitude,
      position,
      shapeOptions,
      mode,
    } = this.options
    const { circleRadius, circleStartAngle, circleEndAngle } = shapeOptions

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
      } else if (mode === VisualizerMode.Levels) {
        this.drawLevels(x, y, outlineSize, amplitude)
      }

      this.context.restore()
    })
  }
  private drawWaveform(points: number[][], isClosed = false) {
    const { tickRadius } = this.options.elementStyling
    ;(tickRadius > 0 ? drawCurve : drawLine)(this.context, points, isClosed)
    this.context.fill()
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
    const isVertical = this.isVertical()
    const canvasSize = isVertical ? width - strokeWidth : height - strokeWidth

    const angleMap = {
      [VisualizerPosition.Start]: isVertical ? 1 : 2,
      [VisualizerPosition.End]: isVertical ? 3 : 0,
      [VisualizerPosition.Center]: isVertical ? [1, 3] : [0, 2],
    }
    let angle = angleMap[position] ?? 0
    if (isVertical) {
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
      elementStyling.tickRadius,
      canvasSize,
    )
  }
}
