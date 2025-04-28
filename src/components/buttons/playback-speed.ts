import { CSSClass } from "../../enums"
import { PlaybackSpeedConfiguration } from "../../types"
import { ToggleButton } from "./toggle-button"

export class PlayBackSpeedButton {
  public button: ToggleButton

  constructor(
    configuration: PlaybackSpeedConfiguration,
    player: any,
    parent: HTMLElement,
  ) {
    const callback = (value: string) => {
      player.playbackRate = parseFloat(value)
    }
    this.button = new ToggleButton({
      options: configuration.options,
      parent,
      callback,
      defaultValue: configuration.defaultSpeed,
      className: CSSClass.PlaybackSpeedButton,
    })
  }

  public render(): HTMLButtonElement {
    return this.button.render()
  }

  public update(value: number) {
    this.button.setValue(value)
  }
}
