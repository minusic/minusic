import { CSSClass, VisualizerShape, VisualizerStack } from "../enums"
import { VisualizerConfiguration, VisualizerOptions } from "../types"
import { createElement } from "../utils/dom/elements"
import { AudioProcessor } from "../core/audio/audioProcessor"
import { CanvasManager } from "./core/canvasManager"
import { OptionsHandler } from "./core/options"
import { CircleRenderer } from "./renderers/CircleRenderer"
import { LineRenderer } from "./renderers/LineRenderer"
import { PolygonRenderer } from "./renderers/PolygonRenderer"
import { DebugUtils } from "./utils/DebugUtils"
import { FrequencyUtils } from "./utils/FrequencyUtils"
import { StackUtils } from "./utils/StackUtils"

export default class Visualizer {
  private media: HTMLMediaElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private context: CanvasRenderingContext2D | null = null
  private optionsHandler: OptionsHandler | null = null
  private canvasManager: CanvasManager | null = null
  private audioProcessor: AudioProcessor | null = null
  private stackUtils: StackUtils | null = null
  private freqUtils: FrequencyUtils | null = null
  private debugUtils: DebugUtils | null = null
  private lineRenderer: LineRenderer | null = null
  private circleRenderer: CircleRenderer | null = null
  private polygonRenderer: PolygonRenderer | null = null
  private options: VisualizerConfiguration | null = null
  initialized = false
  private destroyed = false

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
    this.options = this.optionsHandler.options as VisualizerConfiguration

    this.canvas = createElement(
      "canvas",
      { container },
      { class: CSSClass.Visualizer },
    ) as HTMLCanvasElement
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D
    this.media = media

    this.initializeComponents()

    this.canvasManager?.initializeCanvas()
    this.initialized = true
    this.update(true)
  }

  private initializeComponents() {
    if (!this.canvas || !this.context || !this.options) return

    this.canvasManager = new CanvasManager(
      this.canvas,
      this.context,
      this.options,
    )
    this.audioProcessor = new AudioProcessor(this.media!)
    this.lineRenderer = new LineRenderer(this.context, this.options)
    this.circleRenderer = new CircleRenderer(this.context, this.options)
    this.polygonRenderer = new PolygonRenderer(this.context, this.options)
    this.stackUtils = new StackUtils(this.context, this.options)
    this.freqUtils = new FrequencyUtils(this.options)
    this.debugUtils = new DebugUtils(this.context, this.options)
  }

  update(paused: boolean, timestamp?: number) {
    if (
      !paused &&
      this.audioProcessor &&
      !this.audioProcessor.isInitialized()
    ) {
      this.audioProcessor.initialize()
    }

    this.canvasManager?.clearCanvas()
    if (this.options?.debug.showAxis) this.debugUtils?.showAxis()
    if (this.options?.debug.showFPS) this.debugUtils?.showFPS(timestamp)
    if (this.options?.invertColors) this.canvasManager?.invertCanvasColors()

    const frequencies =
      this.freqUtils?.getProcessedFrequencies(paused, this.audioProcessor!) ??
      []

    if (!frequencies.length) return frequencies

    this.renderWithStackOption(frequencies)
    return frequencies
  }

  private renderWithStackOption(frequencies: number[]) {
    if (!this.options || !this.stackUtils) return

    switch (this.options.stack.type) {
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
    if (!this.options) return

    if (this.options.shape === VisualizerShape.Line) {
      this.lineRenderer?.render(frequencies)
    } else if (this.options.shape === VisualizerShape.Circle) {
      this.circleRenderer?.render(frequencies)
    } else if (this.options.shape === VisualizerShape.Polygon) {
      this.polygonRenderer?.render(frequencies)
    }
  }

  public dispose(): void {
    if (this.destroyed) return
    this.initialized = false

    this.audioProcessor?.dispose()
    this.canvasManager?.clearCanvas()

    this.canvas?.parentNode?.removeChild(this.canvas)

    this.audioProcessor = null
    this.canvasManager = null
    this.lineRenderer = null
    this.circleRenderer = null
    this.polygonRenderer = null
    this.stackUtils = null
    this.freqUtils = null
    this.debugUtils = null
    this.optionsHandler = null
    this.options = null

    this.canvas = null
    this.context = null
    this.media = null

    this.destroyed = true
  }
}
