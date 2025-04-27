import { CSSClass } from "../enums"
import { createElement } from "../utils/dom/elements"

export function createProgressContainer(controls: HTMLElement) {
  return createElement(
    "div",
    { container: controls },
    { class: [CSSClass.ProgressContainer] },
  )
}
