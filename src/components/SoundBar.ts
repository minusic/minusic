import { CSSClass } from "../enums"
import CircularRange from "../lib/ui/circularRange"
import Range from "../lib/ui/range"
import { ConstructorParameters } from "../types"

export function createSoundBar(
  container: HTMLElement,
  options: ConstructorParameters["options"],
  player: any,
) {
  if (options.circularSoundBar) {
    return new CircularRange({
      container,
      label: "Sound bar",
      handler: (value: number) => {
        player.volume = value
      },
      value: player.volume,
      cssClass: [CSSClass.SoundBar],
      radius: options.circularSoundBar.radius,
      startAngle: options.circularSoundBar.startAngle,
      endAngle: options.circularSoundBar.endAngle,
      clockwise: options.circularSoundBar.clockwise,
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
