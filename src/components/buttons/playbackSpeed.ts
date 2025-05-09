import Minusic from "../../core/minusic"
import { CSSClass } from "../../enums"
import { PlaybackSpeedOption } from "../../types"
import { ToggleButton } from "./toggleButton"

export class PlayBackSpeedButton {
  public button: ToggleButton

  constructor(
    options: PlaybackSpeedOption[],
    player: Minusic,
    container: HTMLElement,
    defaultValue: number,
  ) {
    const callback = (value: string) => {
      player.playbackRate = parseFloat(value)
    }
    this.button = new ToggleButton({
      options,
      container,
      callback,
      defaultValue,
      cssClass: CSSClass.PlaybackSpeedButton,
    })
  }

  public render(): HTMLButtonElement {
    return this.button.render()
  }

  public update(value: number) {
    this.button.setValue(value)
  }
}
