import Minusic from "../../core/minusic"
import { CSSClass } from "../../enums"
import { PlaybackSpeedConfiguration } from "../../types"
import { ToggleButton } from "./toggleButton"

export class PlayBackSpeedButton {
  public button: ToggleButton

  constructor(
    configuration: PlaybackSpeedConfiguration,
    player: Minusic,
    container: HTMLElement,
  ) {
    const callback = (value: string) => {
      player.playbackRate = parseFloat(value)
    }
    this.button = new ToggleButton({
      options: configuration.options,
      container,
      callback,
      defaultValue: configuration.defaultSpeed,
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
