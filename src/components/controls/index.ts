import { Elements, PlayerConfiguration } from "../../types"
import { createControlButtons } from "./controlButtons"
import { createProgressElements } from "./progressElements"
import { createMetadata } from "../metadata"
import { createPlaylist } from "../playlist"
import { createSoundBar } from "../soundBar"
import { createElement } from "../../utils/dom/elements"
import { CSSClass } from "../../enums"
import MinusicCore from "../../core/minusicCore"

export function createPlayerElements(
  container: HTMLElement,
  controlsContainer: HTMLElement,
  options: PlayerConfiguration,
  player: MinusicCore,
): Elements {
  const { controls, livestream } = options

  const progressContainer =
    controls.timeBar || controls.bufferBar
      ? createProgressContainer(controlsContainer)
      : null

  return {
    container,
    controls: controlsContainer,
    buttons: createControlButtons(controlsContainer, controls, options, player),
    progress: createProgressElements(
      controlsContainer,
      progressContainer,
      options,
      player,
    ),
    livestream: livestream
      ? createElement(
          "div",
          { container: controlsContainer, text: "Live" },
          { class: CSSClass.Livestream },
        )
      : null,
    playlist: createPlaylist(container, options, player),
    soundBar: controls.soundBar
      ? createSoundBar(controlsContainer, options, player)
      : null,
    ...createMetadata(container, options),
  }
}

function createProgressContainer(controls: HTMLElement) {
  return createElement(
    "div",
    { container: controls },
    { class: [CSSClass.ProgressContainer] },
  )
}
