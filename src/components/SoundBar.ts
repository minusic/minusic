import { CSSClass, RangeShape } from "../enums"
import CircularRange from "../lib/ui/circularRange"
import Range from "../lib/ui/range"
import { PlayerConfiguration } from "../types"

export function createSoundBar(
  container: HTMLElement,
  options: PlayerConfiguration,
  player: any,
) {
  if (options.displayOptions.soundBar?.shape === RangeShape.Circle) {
    return new CircularRange({
      container,
      label: "Sound bar",
      handler: (value: number) => {
        player.volume = value
      },
      value: player.volume,
      cssClass: [CSSClass.SoundBar],
      radius: options.displayOptions.soundBar.radius,
      startAngle: options.displayOptions.soundBar.startAngle,
      endAngle: options.displayOptions.soundBar.endAngle,
      clockwise: options.displayOptions.soundBar.clockwise,
    })
  } else {
    return new Range({
      container,
      label: "Sound bar",
      handler: (value: number) => {
        player.volume = value
      },
      value: player.volume,
      cssClass: [CSSClass.SoundBar],
    })
  }
}
