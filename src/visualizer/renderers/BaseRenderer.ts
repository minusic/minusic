import { VisualizerConfiguration } from "../../types"
import { VisualizerDirection, VisualizerPosition } from "../../enums"
import { drawLevels, drawRoundedRectangle } from "../../utils/canvas/drawing"

export interface Particle {
  x: number
  y: number
  baseSize: number
  vx: number
  vy: number
  opacity: number
  angle: number
}

export abstract class BaseRenderer {
  protected context: CanvasRenderingContext2D
  protected options: VisualizerConfiguration
  protected particles: Particle[] = []

  constructor(
    context: CanvasRenderingContext2D,
    options: VisualizerConfiguration,
  ) {
    this.context = context
    this.options = options
  }

  abstract render(frequencies: number[]): void

  protected isVertical(): boolean {
    return [
      VisualizerDirection.TopToBottom,
      VisualizerDirection.BottomToTop,
    ].includes(this.options.direction)
  }

  protected calculatePosition(amplitude: number): number {
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

  protected drawBar(x: number, y: number, w: number, h: number) {
    drawRoundedRectangle(
      this.context,
      x,
      y,
      w,
      h,
      this.options.elementStyling.tickRadius,
    )
  }

  protected drawLevels(x: number, y: number, w: number, h: number) {
    const { position, outlineSize, elementStyling } = this.options
    if (position === VisualizerPosition.Start) {
      drawLevels(
        this.context,
        x,
        y,
        w,
        h,
        outlineSize,
        elementStyling.tickRadius,
      )
    } else if (position === VisualizerPosition.Center) {
      const diff = Math.ceil(h % (2 * outlineSize) || 1)
      y -= diff / 2
      drawLevels(
        this.context,
        x,
        y,
        w,
        h,
        outlineSize,
        elementStyling.tickRadius,
      )
    } else if (position === VisualizerPosition.End) {
      const diff = Math.ceil(h % outlineSize || 1)
      h -= diff
      drawLevels(
        this.context,
        x,
        y,
        w,
        h,
        outlineSize,
        elementStyling.tickRadius,
      )
    }
  }
}
