import { BaseRenderer, Particle } from "./BaseRenderer"
import { VisualizerMode, VisualizerPosition } from "../../enums"
import {
  drawCurve,
  drawLine,
  drawDrop,
  drawRoundedRectangle,
} from "../../utils/canvas/drawing"

export class PolygonRenderer extends BaseRenderer {
  render(frequencies: number[]): void {
    const { mode } = this.options

    if (mode === VisualizerMode.Waves) {
      this.renderPolygonWaves(frequencies)
    } else if (mode === VisualizerMode.Particles) {
      this.renderPolygonParticles(frequencies)
    } else {
      this.renderPolygonBarsOrDrops(frequencies)
    }
  }

  private calculatePolygonVertices(): number[][] {
    const { width, height, shapeOptions } = this.options
    const { polygonRadius, polygonSides, polygonRotation } = shapeOptions

    const centerX = width / 2
    const centerY = height / 2
    const vertices: number[][] = []

    for (let i = 0; i < polygonSides; i++) {
      const angle =
        (i * 2 * Math.PI) / polygonSides + (polygonRotation * Math.PI) / 180
      vertices.push([
        centerX + polygonRadius * Math.cos(angle),
        centerY + polygonRadius * Math.sin(angle),
      ])
    }

    return vertices
  }

  private renderPolygonWaves(frequencies: number[]) {
    const { width, height, frequencyMaxValue, shapeOptions, position } =
      this.options
    const { polygonSides } = shapeOptions

    const centerX = width / 2
    const centerY = height / 2

    const vertices = this.calculatePolygonVertices()

    // Add the first vertex again to close the loop if needed
    if (vertices.length > 0) {
      vertices.push([...vertices[0]])
    }

    const points: number[][] = []
    vertices.forEach((vertex) => {
      points.push(vertex)
    })

    // If we have frequencies to add between vertices
    if (frequencies.length > polygonSides) {
      const freqsPerSide = Math.floor(
        (frequencies.length - polygonSides) / polygonSides,
      )

      if (freqsPerSide > 0) {
        const allPoints: number[][] = []

        for (let i = 0; i < polygonSides; i++) {
          const startVertex = vertices[i]
          const endVertex = vertices[(i + 1) % vertices.length]

          allPoints.push([...startVertex])

          for (let j = 0; j < freqsPerSide; j++) {
            const freqIndex = i * freqsPerSide + j
            if (freqIndex < frequencies.length) {
              const freq = frequencies[freqIndex]
              const amplitude =
                (freq / frequencyMaxValue) * (Math.min(centerX, centerY) / 4)

              // Calculate position along the edge
              const t = (j + 1) / (freqsPerSide + 1)

              // Linear interpolation between vertices
              const baseX = startVertex[0] + t * (endVertex[0] - startVertex[0])
              const baseY = startVertex[1] + t * (endVertex[1] - startVertex[1])

              // Calculate normal vector direction (perpendicular to edge)
              const dx = endVertex[0] - startVertex[0]
              const dy = endVertex[1] - startVertex[1]
              const len = Math.sqrt(dx * dx + dy * dy)
              const nx = -dy / len
              const ny = dx / len

              let modifiedX, modifiedY

              switch (position) {
                case VisualizerPosition.Start:
                  modifiedX = baseX + nx * amplitude
                  modifiedY = baseY + ny * amplitude
                  break

                case VisualizerPosition.End:
                  modifiedX = baseX - nx * amplitude
                  modifiedY = baseY - ny * amplitude
                  break

                case VisualizerPosition.Center:
                  if (j % 2) {
                    modifiedX = baseX + nx * (amplitude / 2)
                    modifiedY = baseY + ny * (amplitude / 2)
                  } else {
                    modifiedX = baseX - nx * (amplitude / 2)
                    modifiedY = baseY - ny * (amplitude / 2)
                  }
                  break

                default:
                  modifiedX = baseX + nx * amplitude
                  modifiedY = baseY + ny * amplitude
              }

              allPoints.push([modifiedX, modifiedY])
            }
          }
        }

        if (allPoints.length > 0) {
          points.length = 0
          points.push(...allPoints)
        }
      }
    }

    this.drawWaveform(points, true)
  }

  private renderPolygonBarsOrDrops(frequencies: number[]) {
    const {
      outlineSize,
      frequencyMaxValue,
      barAmplitude,
      position,
      mode,
      shapeOptions,
    } = this.options
    const { polygonSides } = shapeOptions

    const vertices = this.calculatePolygonVertices()

    const freqsPerSide = Math.ceil(frequencies.length / polygonSides)

    for (let sideIndex = 0; sideIndex < polygonSides; sideIndex++) {
      const startVertex = vertices[sideIndex]
      const endVertex = vertices[(sideIndex + 1) % vertices.length]

      for (let i = 0; i < freqsPerSide; i++) {
        const freqIndex = sideIndex * freqsPerSide + i
        if (freqIndex >= frequencies.length) continue

        const freq = frequencies[freqIndex]
        const amplitude = ((freq / frequencyMaxValue) * barAmplitude) / 2

        const t = (i + 0.5) / freqsPerSide

        // Get base position on the edge
        const baseX = startVertex[0] + t * (endVertex[0] - startVertex[0])
        const baseY = startVertex[1] + t * (endVertex[1] - startVertex[1])

        const dx = endVertex[0] - startVertex[0]
        const dy = endVertex[1] - startVertex[1]
        const len = Math.sqrt(dx * dx + dy * dy)
        const nx = -dy / len
        const ny = dx / len

        let startX = baseX
        let startY = baseY

        if (position === VisualizerPosition.Start) {
          startX = baseX + nx * amplitude
          startY = baseY + ny * amplitude
        } else if (position === VisualizerPosition.End) {
          startX = baseX
          startY = baseY
        } else if (position === VisualizerPosition.Center) {
          startX = baseX + nx * (amplitude / 2)
          startY = baseY + ny * (amplitude / 2)
        }

        this.context.save()

        const barAngle = Math.atan2(ny, nx)
        this.context.translate(startX, startY)
        this.context.rotate(barAngle + Math.PI / 2)

        if (mode === VisualizerMode.Bars) {
          this.drawBar(-outlineSize / 2, 0, outlineSize, amplitude)
        } else if (mode === VisualizerMode.Drops) {
          this.drawDroplet(-outlineSize / 2, 0, outlineSize, amplitude)
        } else if (mode === VisualizerMode.Levels) {
          this.drawLevels(-outlineSize / 2, 0, outlineSize, amplitude)
        }

        this.context.restore()
      }
    }
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
    const { tickRadius } = elementStyling
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
      tickRadius,
      canvasSize,
    )
  }

  public renderPolygonParticles(frequencies: number[]) {
    const {
      width,
      height,
      frequencyMaxValue,
      fillColor,
      outlineColor,
      elementStyling,
    } = this.options

    const centerX = width / 2
    const centerY = height / 2

    const vertices = this.calculatePolygonVertices()

    if (this.particles.length !== frequencies.length) {
      this.createPolygonParticles(
        frequencies.length,
        vertices,
        centerX,
        centerY,
      )
    }

    this.particles.forEach((particle, i) => {
      const freq = frequencies[i]
      const sizeRatio = freq / frequencyMaxValue
      const size = particle.baseSize * sizeRatio
      const halfSize = size / 2

      particle.x += particle.vx
      particle.y += particle.vy

      if (
        particle.x < -halfSize ||
        particle.x > width + halfSize ||
        particle.y < -halfSize ||
        particle.y > height + halfSize
      ) {
        this.resetPolygonParticle(particle, vertices, centerX, centerY)
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

  private createPolygonParticles(
    count: number,
    vertices: number[][],
    centerX: number,
    centerY: number,
  ) {
    this.particles = []
    for (let i = 0; i < count; i++) {
      this.particles.push(this.spawnPolygonParticle(vertices, centerX, centerY))
    }
  }

  private resetPolygonParticle(
    particle: Particle,
    vertices: number[][],
    centerX: number,
    centerY: number,
  ) {
    Object.assign(
      particle,
      this.spawnPolygonParticle(vertices, centerX, centerY),
    )
  }

  private spawnPolygonParticle(
    vertices: number[][],
    centerX: number,
    centerY: number,
  ) {
    const sideIndex = Math.floor(Math.random() * vertices.length)
    const nextIndex = (sideIndex + 1) % vertices.length

    const v1 = vertices[sideIndex]
    const v2 = vertices[nextIndex]

    const t = Math.random()
    const x = v1[0] + t * (v2[0] - v1[0])
    const y = v1[1] + t * (v2[1] - v1[1])

    const dx = x - centerX
    const dy = y - centerY
    const len = Math.sqrt(dx * dx + dy * dy)
    const dirX = dx / len
    const dirY = dy / len

    const speed = Math.random() * 2 + 1.5

    return {
      x,
      y,
      baseSize: Math.random() * 40,
      vx: dirX * speed,
      vy: dirY * speed,
      opacity: Math.random() * 0.6 + 0.4,
      angle: Math.atan2(dirY, dirX),
    }
  }
}
