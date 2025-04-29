import { createElement } from "../utils/dom/elements"

export function createTimeDisplay(
  container: HTMLElement,
  cssClass: string,
  label: string,
) {
  return createElement(
    "span",
    { container },
    {
      class: cssClass,
      "aria-label": label,
    },
  ) as HTMLSpanElement
}
