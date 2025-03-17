import { VisualizerOptions, VisualizerColor } from "../../../types"
import { ColorUtils } from "./ColorUtils"

export class StackUtils {
  private context: CanvasRenderingContext2D
  private options: VisualizerOptions
  private colorUtils: ColorUtils

  constructor(context: CanvasRenderingContext2D, options: VisualizerOptions) {
    this.context = context
    this.options = options
    this.colorUtils = new ColorUtils(context, options)
  }

  setStackColors(index: number = 0) {
    const { fillColor, outlineColor } = this.options

    if (fillColor instanceof Array) {
      index = index % fillColor.length
      this.context.fillStyle = this.colorUtils.parseColor(fillColor[index])
    }

    if (outlineColor instanceof Array) {
      index = index % outlineColor.length
      this.context.strokeStyle = this.colorUtils.parseColor(outlineColor[index])
    }
  }

  renderDuplicateStack(
    frequencies: number[],
    renderCallback: (freq: number[]) => void,
  ) {
    let scaledFrequencies = [...frequencies]

    for (let i = 0; i < this.options.stackDepth + 1; i++) {
      this.setStackColors(i)
      renderCallback(scaledFrequencies)

      scaledFrequencies = scaledFrequencies.map(
        (value) => value * this.options.stackScale,
      )
    }
  }

  renderDividedStack(
    frequencies: number[],
    renderCallback: (freq: number[]) => void,
  ) {
    const chunks = this.options.stackDepth + 1
    const chunkSize = Math.floor(frequencies.length / chunks)

    for (let i = 0; i < chunks; i++) {
      const frequencyChunk = frequencies.slice(
        i * chunkSize,
        (i + 1) * chunkSize,
      )
      this.setStackColors(i)
      renderCallback(frequencyChunk)
    }
  }

  renderShiftedStack(
    frequencies: number[],
    renderCallback: (freq: number[]) => void,
  ) {
    const shift = this.options.stackShift
    let shiftFrequencies = [...frequencies]

    // Always render the base layer
    this.setStackColors(0)
    renderCallback(shiftFrequencies)

    for (let i = 0; i < this.options.stackDepth; i++) {
      shiftFrequencies = [
        ...shiftFrequencies.slice(shift),
        ...shiftFrequencies.slice(0, shift),
      ]
      this.setStackColors(i + 1)
      renderCallback(shiftFrequencies)
    }
  }
}
