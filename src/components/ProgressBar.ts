import { CSSClass } from "../enums"
import { createElement } from "../lib/elements"

export function createProgressContainer(controls: HTMLElement) {
  return createElement(
    "div",
    { container: controls },
    { class: [CSSClass.ProgressContainer] },
  )
}
