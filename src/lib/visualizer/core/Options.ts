import {
  VisualizerDirection,
  VisualizerMode,
  VisualizerPosition,
  VisualizerShape,
  VisualizerStack,
  VisualizerSymmetry,
} from "../../../enums"
import { VisualizerOptions } from "../../../types"

export class OptionsHandler {
  visualizerOptions: VisualizerOptions

  constructor(options: VisualizerOptions) {
    this.visualizerOptions = this.getDefaultOptions()
    this.update(options)
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
      polygonRadius: 0,
      polygonSides: 0,
      polygonRotation: 0,
    }
  }

  private update(options: VisualizerOptions) {
    this.visualizerOptions = { ...this.options, ...options }
  }

  get options() {
    return this.visualizerOptions
  }
}
