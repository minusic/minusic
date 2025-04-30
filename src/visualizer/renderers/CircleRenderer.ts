import { BaseRenderer } from "./BaseRenderer"
import {
  VisualizerDirection,
  VisualizerMode,
  VisualizerPosition,
} from "../../enums"
import {
  drawCurve,
  drawLine,
  drawDrop,
  drawRoundedRectangle,
} from "../../utils/canvas/drawing"

export class CircleRenderer extends BaseRenderer {
  private particlePool: any[] = []

  render(frequencies: number[]): void {
    const { mode } = this.options

    if (mode === VisualizerMode.Waves) {
      this.renderCircularWaves(frequencies)
    } else if (mode === VisualizerMode.Particles) {
      this.renderCircularParticles(frequencies)
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
      const y =
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

  private renderCircularParticles(frequencies: number[]) {
    const isVertical = this.isVertical()
    const {
      width,
      height,
      position,
      frequencyMaxValue,
      shapeOptions,
      fillColor,
      outlineColor,
      elementStyling,
      direction,
    } = this.options

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

    const { circleRadius, circleStartAngle, circleEndAngle } = shapeOptions
    const centerX = width / 2
    const centerY = height / 2
    const angleSize = circleEndAngle - circleStartAngle

    if (this.particles.length !== frequencies.length) {
      this.createParticles(
        frequencies.length,
        centerX,
        centerY,
        circleRadius,
        angleSize,
        circleStartAngle,
      )
    }

    this.particles.forEach((particle, i) => {
      const freq = frequencies[i]
      const sizeRatio = freq / frequencyMaxValue
      const size = particle.baseSize * sizeRatio
      const halfSize = size / 2

      const sign = getDirectionSign(isVertical, i)

      if (sign > 0) {
        particle.x += particle.vx
        particle.y += particle.vy
      } else {
        particle.x -= particle.vx
        particle.y -= particle.vy
      }

      if (
        particle.x < -halfSize ||
        particle.x > width + halfSize ||
        particle.y < -halfSize ||
        particle.y > height + halfSize
      ) {
        this.resetParticle(
          particle,
          centerX,
          centerY,
          circleRadius,
          angleSize,
          circleStartAngle,
        )
      }

      this.context.fillStyle = Array.isArray(fillColor)
        ? fillColor[i % fillColor.length]
        : fillColor

      this.context.strokeStyle = Array.isArray(outlineColor)
        ? outlineColor[i % outlineColor.length]
        : outlineColor

      drawRoundedRectangle(
        this.context,
        particle.x - halfSize,
        particle.y - halfSize,
        size,
        size,
        elementStyling.tickRadius,
        particle.opacity,
        particle.angle,
      )
      this.context.fill()
    })
  }

  private createParticles(
    count: number,
    cx: number,
    cy: number,
    r: number,
    angleSize: number,
    angleStart: number,
  ) {
    this.particles = []
    for (let i = 0; i < count; i++) {
      const particle = this.spawnParticle(cx, cy, r, angleSize, angleStart)
      this.particles.push(particle)
    }
  }

  private resetParticle(
    particle: any,
    cx: number,
    cy: number,
    r: number,
    angleSize: number,
    angleStart: number,
  ) {
    Object.assign(
      particle,
      this.spawnParticle(cx, cy, r, angleSize, angleStart),
    )
  }

  private spawnParticle(
    cx: number,
    cy: number,
    r: number,
    angleSize: number,
    angleStart: number,
  ) {
    const angleDeg =
      angleSize === 360
        ? Math.random() * 360
        : angleStart + Math.random() * angleSize
    const angle = (angleDeg - 90) * (Math.PI / 180)

    const speed = Math.random() * 2 + 1.5
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)

    return {
      x,
      y,
      baseSize: Math.random() * 40 + 1,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      opacity: Math.random() * 0.6 + 0.4,
      angle: angleDeg,
    }
  }
}
