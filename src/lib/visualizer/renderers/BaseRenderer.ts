import { VisualizerOptions } from "../../../types"
import { VisualizerDirection, VisualizerPosition } from "../../../enums"
import { drawLevels, drawRoundedRectangle } from "../../canvas"

export abstract class BaseRenderer {
  protected context: CanvasRenderingContext2D
  protected options: VisualizerOptions

  constructor(context: CanvasRenderingContext2D, options: VisualizerOptions) {
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
    drawRoundedRectangle(this.context, x, y, w, h, this.options.tickRadius)
  }

  protected drawLevels(x: number, y: number, w: number, h: number) {
    const { outlineSize, tickRadius } = this.options
    drawLevels(this.context, x, y, w, h, outlineSize, tickRadius)
  }
}
