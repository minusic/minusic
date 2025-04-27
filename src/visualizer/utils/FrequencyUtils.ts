import { VisualizerConfiguration } from "../../types"
import { VisualizerDirection, VisualizerSymmetry } from "../../enums"
import { AudioProcessor } from "../core/AudioProcessor"

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

    const processedFreq = Array.from(
      { length: tick },
      (_, i) => frequencies[step * i],
    )

    if (symmetry === VisualizerSymmetry.Symmetric) {
      return [...processedFreq, ...processedFreq.reverse()]
    } else if (symmetry === VisualizerSymmetry.Reversed) {
      return [...[...processedFreq].reverse(), ...processedFreq]
    } else if (
      [
        VisualizerDirection.RightToLeft,
        VisualizerDirection.BottomToTop,
      ].includes(direction)
    ) {
      return processedFreq.reverse()
    }

    return processedFreq
  }

  isVertical(): boolean {
    const { direction } = this.options
    return [
      VisualizerDirection.TopToBottom,
      VisualizerDirection.BottomToTop,
    ].includes(direction)
  }
}
