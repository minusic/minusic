import { CSSClass, VisualizerShape, VisualizerStack } from "../../enums"
import { VisualizerOptions } from "../../types"
import { createElement } from "../elements"
import { AudioProcessor } from "./core/AudioProcessor"
import { CanvasManager } from "./core/CanvasManager"
import { OptionsHandler } from "./core/Options"
import { CircleRenderer } from "./renderers/CircleRenderer"
import { LineRenderer } from "./renderers/LineRenderer"
import { DebugUtils } from "./utils/DebugUtils"
import { FrequencyUtils } from "./utils/FrequencyUtils"
import { StackUtils } from "./utils/StackUtils"

export default class Visualizer {
  private media!: HTMLMediaElement
  private canvas!: HTMLCanvasElement
  private context!: CanvasRenderingContext2D
  private optionsHandler!: OptionsHandler
  private canvasManager!: CanvasManager
  private audioProcessor!: AudioProcessor
  private stackUtils!: StackUtils
  private freqUtils!: FrequencyUtils
  private debugUtils!: DebugUtils
  private lineRenderer!: LineRenderer
  private circleRenderer!: CircleRenderer
  private options: VisualizerOptions
  initialized = false

  constructor({
    container,
    media,
    options,
  }: {
    container: HTMLElement
    media: HTMLMediaElement
    options: VisualizerOptions
  }) {
    this.optionsHandler = new OptionsHandler(options)
    this.options = this.optionsHandler.options

    this.canvas = createElement(
      "canvas",
      { container },
      { class: CSSClass.Visualizer },
    ) as HTMLCanvasElement
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D
    this.media = media

    this.initializeComponents()

    this.canvasManager.initializeCanvas()
    this.initialized = true
    this.update(true)
  }

  private initializeComponents() {
    this.canvasManager = new CanvasManager(
      this.canvas,
      this.context,
      this.options,
    )
    this.audioProcessor = new AudioProcessor(this.media)
    this.lineRenderer = new LineRenderer(this.context, this.options)
    this.circleRenderer = new CircleRenderer(this.context, this.options)
    this.stackUtils = new StackUtils(this.context, this.options)
    this.freqUtils = new FrequencyUtils(this.options)
    this.debugUtils = new DebugUtils(this.context, this.options)
  }

  update(paused: boolean, timestamp?: number) {
    if (!paused && !this.audioProcessor.isInitialized()) {
      this.audioProcessor.initialize()
    }

    this.canvasManager.clearCanvas()
    if (this.options.debug.showAxis) this.debugUtils.showAxis()
    if (this.options.debug.showFPS) this.debugUtils.showFPS(timestamp)
    if (this.options.invertColors) this.canvasManager.invertCanvasColors()

    let frequencies = this.freqUtils.getProcessedFrequencies(
      paused,
      this.audioProcessor,
    )
    if (!frequencies.length) return frequencies

    this.renderWithStackOption(frequencies)
    return frequencies
  }

  private renderWithStackOption(frequencies: number[]) {
    switch (this.options.stack) {
      case VisualizerStack.Duplicate:
        this.stackUtils.renderDuplicateStack(
          frequencies,
          this.renderVisualization.bind(this),
        )
        break
      case VisualizerStack.Divide:
        this.stackUtils.renderDividedStack(
          frequencies,
          this.renderVisualization.bind(this),
        )
        break
      case VisualizerStack.Shift:
        this.stackUtils.renderShiftedStack(
          frequencies,
          this.renderVisualization.bind(this),
        )
        break
      default:
        this.stackUtils.setStackColors(0)
        this.renderVisualization(frequencies)
    }
  }

  private renderVisualization(frequencies: number[]) {
    if (this.options.shape === VisualizerShape.Line) {
      this.lineRenderer.render(frequencies)
    } else if (this.options.shape === VisualizerShape.Circle) {
      this.circleRenderer.render(frequencies)
    }
  }
}
