import { CSSClass } from "../enums"
import { createElement } from "../lib/elements"
import { PlayerConfiguration } from "../types"

export function buildPlayerStructure(options: PlayerConfiguration) {
  const container = createElement("div", {}, { class: CSSClass.Container })
  const controls = createElement(
    "div",
    { container },
    {
      class: CSSClass.Controls,
      "data-controls": `${options.displayOptions.showControls !== false}`,
    },
  )
  return { container, controls }
}
