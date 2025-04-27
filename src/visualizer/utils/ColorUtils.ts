import { VisualizerColor, VisualizerConfiguration } from "../../types"
import { VisualizerGradient } from "../../enums"
import {
  createConicGradient,
  createLinearGradient,
  createRadialGradient,
} from "../../lib/canvas"

export class ColorUtils {
  private context: CanvasRenderingContext2D
  private options: VisualizerConfiguration

  constructor(
    context: CanvasRenderingContext2D,
    options: VisualizerConfiguration,
  ) {
    this.context = context
    this.options = options
  }

  parseColor(color: VisualizerColor) {
    if (typeof color === "string") {
      return color
    } else if (typeof color === "object") {
      const canvasProperties = {
        context: this.context,
        width: this.options.width,
        height: this.options.height,
      }

      if (color.type === VisualizerGradient.Radial) {
        return createRadialGradient(canvasProperties, color)
      } else if (color.type === VisualizerGradient.Conic) {
        return createConicGradient(canvasProperties, color)
      } else {
        return createLinearGradient(canvasProperties, color)
      }
    }
    return "transparent"
  }
}
