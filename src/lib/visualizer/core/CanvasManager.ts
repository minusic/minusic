import { VisualizerOptions, VisualizerColor } from "../../../types"
import { applyStyles } from "../../elements"
import { ColorUtils } from "../utils/ColorUtils"

export class CanvasManager {
  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D
  private options: VisualizerOptions
  private colorUtils: ColorUtils

  constructor(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    options: VisualizerOptions,
  ) {
    this.canvas = canvas
    this.context = context
    this.options = options
    this.colorUtils = new ColorUtils(context, options)
  }

  initializeCanvas() {
    const { canvasBackground } = this.options
    this.updateCanvasSize()
    this.applyStyles()

    if (canvasBackground) {
      this.canvas.style.background = canvasBackground
    }
  }

  updateCanvasSize() {
    const { width, height } = this.options
    applyStyles(this.canvas, {
      width: `${width}px`,
      height: `${height}px`,
    })

    const scale = window.devicePixelRatio || 1
    this.canvas.width = scale * width
    this.canvas.height = scale * height
    this.context.scale(scale, scale)
  }

  applyStyles() {
    const {
      fillColor,
      outlineColor,
      strokeWidth,
      shadowColor,
      shadowBlur,
      shadowOffsetX,
      shadowOffsetY,
    } = this.options

    this.context.fillStyle =
      fillColor instanceof Array
        ? this.colorUtils.parseColor(fillColor[0])
        : this.colorUtils.parseColor(fillColor)

    this.context.strokeStyle =
      outlineColor instanceof Array
        ? this.colorUtils.parseColor(outlineColor[0])
        : this.colorUtils.parseColor(outlineColor)

    this.context.lineWidth = strokeWidth
    this.context.shadowColor = shadowColor
    this.context.shadowBlur = shadowBlur
    this.context.shadowOffsetX = shadowOffsetX
    this.context.shadowOffsetY = shadowOffsetY
  }

  clearCanvas() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  invertCanvasColors() {
    this.context.globalCompositeOperation = "source-over"
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.context.globalCompositeOperation = "destination-out"
  }
}
