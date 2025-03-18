import { BaseRenderer } from "./BaseRenderer"
import { VisualizerMode, VisualizerPosition } from "../../../enums"
import { drawCurve, drawLine, drawDrop } from "../../canvas"

export class PolygonRenderer extends BaseRenderer {
  render(frequencies: number[]): void {
    const { mode } = this.options

    if (mode === VisualizerMode.Waves) {
      this.renderPolygonWaves(frequencies)
    } else {
      this.renderPolygonBarsOrDrops(frequencies)
    }
  }

  private calculatePolygonVertices(): number[][] {
    const { width, height, polygonRadius, polygonSides, polygonRotation } =
      this.options

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
    const {
      width,
      height,
      frequencyMaxValue,
      polygonSides,
      edgeRoundness,
      position,
    } = this.options

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
              const t = this.applyEdgeRoundness(
                (j + 1) / (freqsPerSide + 1),
                edgeRoundness,
              )

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
                  modifiedX = baseX + nx * (amplitude / 2)
                  modifiedY = baseY + ny * (amplitude / 2)

                  allPoints.push([
                    baseX - nx * (amplitude / 2),
                    baseY - ny * (amplitude / 2),
                  ])
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
          // Close the shape
          points.push([...allPoints[0]])
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
      width,
      height,
      polygonSides,
    } = this.options

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

  private applyEdgeRoundness(t: number, roundness: number): number {
    // When roundness is 0, we get a linear interpolation (straight edges)
    // When roundness approaches 1, we get more curved edges
    if (roundness <= 0) return t
    if (roundness >= 1) roundness = 0.99

    // Apply bezier-like curve to the interpolation
    const bezierT =
      t < 0.5
        ? Math.pow(2 * t, 1 - roundness) / 2
        : 1 - Math.pow(2 * (1 - t), 1 - roundness) / 2

    return bezierT
  }

  private drawWaveform(points: number[][], isClosed = false) {
    const { tickRadius } = this.options
    ;(tickRadius > 0 ? drawCurve : drawLine)(this.context, points, isClosed)
    this.context.fill()
  }

  private drawDroplet(x: number, y: number, w: number, h: number) {
    const {
      position,
      outlineSize,
      tickRadius,
      width,
      height,
      strokeWidth,
      mode,
    } = this.options
    const isVertical = this.isVertical()
    const canvasSize = isVertical ? width - strokeWidth : height - strokeWidth

    const angleMap =
      mode === VisualizerMode.Drops
        ? {
            [VisualizerPosition.Start]: isVertical ? 3 : 2,
            [VisualizerPosition.End]: isVertical ? 1 : 0,
            [VisualizerPosition.Center]: isVertical ? [1, 3] : [0, 2],
          }
        : {
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
}
