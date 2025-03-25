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

      strokeWidth: 0,
      frequencyRange: 1,
      frequencyMaxValue: 255,
      shapeOptions: {
        circleRadius: 0,
        circleStartAngle: 0,
        circleEndAngle: 360,
        polygonRadius: 0,
        polygonSides: 0,
        polygonRotation: 0,
      },
      elementStyling: {
        tickRadius: 0,
      },

      shadow: {
        color: "transparent",
        blur: 0,
        offsetX: 0,
        offsetY: 0,
      },
      shape: VisualizerShape.Line,
      mode: VisualizerMode.Bars,
      position: VisualizerPosition.Center,
      direction: VisualizerDirection.LeftToRight,
      symmetry: VisualizerSymmetry.None,
      canvasBackground: "transparent",
      fillColor: "transparent",
      outlineColor: "transparent",
      invertColors: false,

      stack: {
        type: VisualizerStack.None,
        depth: 0,
        scale: 1,
        shift: 0,
      },

      debug: {
        showAxis: false,
        showFPS: false,
      },
    }
  }

  private update(options: VisualizerOptions) {
    this.visualizerOptions = { ...this.options, ...options }
  }

  get options() {
    return this.visualizerOptions
  }
}
