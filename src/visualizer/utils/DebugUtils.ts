import { VisualizerConfiguration } from "../../types"
import { drawLine, drawRoundedRectangle } from "../../lib/canvas"

export class DebugUtils {
  private context: CanvasRenderingContext2D
  private options: VisualizerConfiguration
  private debugTimestamp: number = 0

  constructor(
    context: CanvasRenderingContext2D,
    options: VisualizerConfiguration,
  ) {
    this.context = context
    this.options = options
  }

  showAxis() {
    const { width: w, height: h } = this.options
    const originalLineWidth = this.context.lineWidth
    const originalStrokeStyle = this.context.strokeStyle

    this.context.lineWidth = 2
    this.context.strokeStyle = "#f005"

    // Draw horizontal and vertical center lines
    drawLine(this.context, [
      [w / 2, 0],
      [w / 2, h],
    ])

    drawLine(this.context, [
      [0, h / 2],
      [w, h / 2],
    ])

    // Draw border
    drawRoundedRectangle(this.context, 0, 0, w, h, 0)

    // Restore original styles
    this.context.lineWidth = originalLineWidth
    this.context.strokeStyle = originalStrokeStyle
  }

  showFPS(timestamp: number = 0) {
    const timeDiff = (timestamp - this.debugTimestamp) / 1000
    if (timeDiff <= 0) return

    const fps = Math.round(1 / timeDiff)
    this.debugTimestamp = timestamp

    // Save original font settings
    const originalFont = this.context.font

    this.context.font = "32px arial"
    this.context.fillText(`FPS: ${fps}`, 20, 50)
    this.context.strokeText(`FPS: ${fps}`, 20, 50)

    // Restore original font
    this.context.font = originalFont
  }
}
