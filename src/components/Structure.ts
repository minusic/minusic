import { CSSClass } from "../enums"
import { createElement } from "../lib/elements"

export function buildPlayerStructure(options: any) {
  const container = createElement("div", {}, { class: CSSClass.Container })
  const controls = createElement(
    "div",
    { container },
    {
      class: CSSClass.Controls,
      "data-hide": `${options.showControls === false}`,
    },
  )
  return { container, controls }
}
