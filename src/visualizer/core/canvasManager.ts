import { VisualizerConfiguration } from "../../types"
import { applyStyles } from "../../utils/dom/elements"
import { ColorUtils } from "../utils/ColorUtils"

export class CanvasManager {
  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D
  private options: VisualizerConfiguration
  private colorUtils: ColorUtils

  constructor(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    options: VisualizerConfiguration,
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
    const { fillColor, outlineColor, strokeWidth, shadow } = this.options

    this.context.fillStyle =
      fillColor instanceof Array
        ? this.colorUtils.parseColor(fillColor[0])
        : this.colorUtils.parseColor(fillColor)

    this.context.strokeStyle =
      outlineColor instanceof Array
        ? this.colorUtils.parseColor(outlineColor[0])
        : this.colorUtils.parseColor(outlineColor)

    this.context.lineWidth = strokeWidth

    const { color, blur, offsetX, offsetY } = shadow
    if (color) {
      this.context.shadowColor = color
      this.context.shadowBlur = blur
      this.context.shadowOffsetX = offsetX
      this.context.shadowOffsetY = offsetY
    }
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
