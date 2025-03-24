import { CSSClass } from "../enums"
import { createElement } from "../lib/elements"
import { ConstructorParameters } from "../types"

export function buildPlayerStructure(
  options: ConstructorParameters["options"],
) {
  const container = createElement("div", {}, { class: CSSClass.Container })
  const controls = createElement(
    "div",
    { container },
    {
      class: CSSClass.Controls,
      "data-controls": `${options.showControls !== false}`,
    },
  )
  return { container, controls }
}
