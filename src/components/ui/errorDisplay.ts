import { CSSClass } from "../../enums"
import { createElement } from "../../utils/dom/elements"

export class ErrorDisplay {
  private element: HTMLElement
  private container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
    this.element = this.createErrorElement()
    this.hide()
  }

  private createErrorElement(): HTMLElement {
    return createElement(
      "div",
      { container: this.container },
      {
        class: "minusic-error-display",
        role: "alert",
        "aria-live": "polite",
      },
    )
  }

  public show(message: string): void {
    this.element.textContent = message
    this.element.style.display = "block"
  }

  public hide(): void {
    this.element.style.display = "none"
    this.element.textContent = ""
  }

  public isVisible(): boolean {
    return this.element.style.display !== "none"
  }
}
