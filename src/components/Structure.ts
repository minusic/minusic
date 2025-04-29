import Minusic from "../core/minusic"
import MinusicCore from "../core/minusicCore"
import { CSSClass } from "../enums"
import { createPlayerElements } from "./controls"

export function buildPlayerStructure(
  player: MinusicCore,
  options: MinusicCore["options"],
) {
  const container = document.createElement("minusic-player")
  container.className = CSSClass.Container

  const controls = document.createElement("div")
  controls.className = CSSClass.Controls

  container.appendChild(controls)

  const elements = createPlayerElements(container, controls, options, player)

  return elements
}
