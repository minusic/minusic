import { CSSClass } from "../enums"
import CircularRange from "../lib/ui/circularRange"
import Range from "../lib/ui/range"
import { PlayerConfiguration } from "../types"

export function createSoundBar(
  container: HTMLElement,
  options: PlayerConfiguration,
  player: any,
) {
  if (options.displayOptions.circularSoundBar) {
    return new CircularRange({
      container,
      label: "Sound bar",
      handler: (value: number) => {
        player.volume = value
      },
      value: player.volume,
      cssClass: [CSSClass.SoundBar],
      radius: options.displayOptions.circularSoundBar.radius,
      startAngle: options.displayOptions.circularSoundBar.startAngle,
      endAngle: options.displayOptions.circularSoundBar.endAngle,
      clockwise: options.displayOptions.circularSoundBar.clockwise,
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
