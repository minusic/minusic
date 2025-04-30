import { VisualizerConfiguration } from "../../types"
import { VisualizerDirection, VisualizerSymmetry } from "../../enums"
import { AudioProcessor } from "../../core/audio/audioProcessor"

export class FrequencyUtils {
  private options: VisualizerConfiguration

  constructor(options: VisualizerConfiguration) {
    this.options = options
  }

  getProcessedFrequencies(
    paused: boolean,
    audioProcessor: AudioProcessor,
  ): number[] {
    const rawFrequencies = audioProcessor.getFrequencyData(paused)
    return this.applySymmetryAndDirection(rawFrequencies)
  }

  applySymmetryAndDirection(frequencies: Uint8Array): number[] {
    const { tick, frequencyRange, symmetry, direction } = this.options
    const step = Math.floor((frequencies.length * frequencyRange) / tick)

    // Preallocate the result array to avoid resizing
    let resultLength = tick
    if (
      symmetry === VisualizerSymmetry.Symmetric ||
      symmetry === VisualizerSymmetry.Reversed
    ) {
      resultLength = tick * 2
    }

    const result = new Array(resultLength)

    // Fill the array directly without intermediate arrays
    for (let i = 0; i < tick; i++) {
      const value = frequencies[step * i]

      if (symmetry === VisualizerSymmetry.Symmetric) {
        result[i] = value
        result[resultLength - 1 - i] = value
      } else if (symmetry === VisualizerSymmetry.Reversed) {
        result[i] = frequencies[step * (tick - 1 - i)]
        result[i + tick] = frequencies[step * i]
      } else if (
        [
          VisualizerDirection.RightToLeft,
          VisualizerDirection.BottomToTop,
        ].includes(direction)
      ) {
        result[i] = frequencies[step * (tick - 1 - i)]
      } else {
        result[i] = frequencies[step * i]
      }
    }

    return result
  }

  isVertical(): boolean {
    const { direction } = this.options
    return [
      VisualizerDirection.TopToBottom,
      VisualizerDirection.BottomToTop,
    ].includes(direction)
  }
}
