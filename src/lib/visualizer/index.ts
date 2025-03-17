import {
  CSSClass,
  VisualizerDirection,
  VisualizerMode,
  VisualizerPosition,
  VisualizerShape,
  VisualizerStack,
  VisualizerSymmetry,
} from "../../enums"
import { VisualizerOptions } from "../../types"
import { createElement } from "../elements"
import { AudioProcessor } from "./core/AudioProcessor"
import { CanvasManager } from "./core/CanvasManager"
import { CircleRenderer } from "./renderers/CircleRenderer"
import { LineRenderer } from "./renderers/LineRenderer"
import { DebugUtils } from "./utils/DebugUtils"
import { FrequencyUtils } from "./utils/FrequencyUtils"
import { StackUtils } from "./utils/StackUtils"

export default class Visualizer {
  private media!: HTMLMediaElement
  private canvas!: HTMLCanvasElement
  private context!: CanvasRenderingContext2D
  private canvasManager!: CanvasManager
  private audioProcessor!: AudioProcessor
  private stackUtils!: StackUtils
  private freqUtils!: FrequencyUtils
  private debugUtils!: DebugUtils
  private lineRenderer!: LineRenderer
  private circleRenderer!: CircleRenderer
  initialized = false
  options: VisualizerOptions = {
    tick: 0,
    width: 0,
    height: 0,
    barAmplitude: 0,
    outlineSize: 0,
    tickRadius: 0,
    strokeWidth: 0,
    frequencyRange: 1,
    frequencyMaxValue: 255,
    circleRadius: 0,
    circleStartAngle: 0,
    circleEndAngle: 360,
    shape: VisualizerShape.Line,
    mode: VisualizerMode.Bars,
    position: VisualizerPosition.Center,
    direction: VisualizerDirection.LeftToRight,
    symmetry: VisualizerSymmetry.None,
    canvasBackground: "transparent",
    fillColor: "transparent",
    outlineColor: "transparent",
    invertColors: false,
    shadowColor: "transparent",
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    stack: VisualizerStack.None,
    stackDepth: 0,
    stackScale: 1,
    stackShift: 0,
    debug: {
      showAxis: false,
      showFPS: false,
    },
  }

  constructor({
    container,
    media,
    options,
  }: {
    container: HTMLElement
    media: HTMLMediaElement
    options: VisualizerOptions
  }) {
    this.options = this.getDefaultOptions()
    this.options = { ...this.options, ...options }

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

  private getDefaultOptions(): VisualizerOptions {
    return {
      tick: 0,
      width: 0,
      height: 0,
      barAmplitude: 0,
      outlineSize: 0,
      tickRadius: 0,
      strokeWidth: 0,
      frequencyRange: 1,
      frequencyMaxValue: 255,
      circleRadius: 0,
      circleStartAngle: 0,
      circleEndAngle: 360,
      shape: VisualizerShape.Line,
      mode: VisualizerMode.Bars,
      position: VisualizerPosition.Center,
      direction: VisualizerDirection.LeftToRight,
      symmetry: VisualizerSymmetry.None,
      canvasBackground: "transparent",
      fillColor: "transparent",
      outlineColor: "transparent",
      invertColors: false,
      shadowColor: "transparent",
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      stack: VisualizerStack.None,
      stackDepth: 0,
      stackScale: 1,
      stackShift: 0,
      debug: {
        showAxis: false,
        showFPS: false,
      },
    }
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
