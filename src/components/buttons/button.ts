import { CSSClass } from "../../enums"

interface ButtonParams {
  text?: string
  label?: string
  container?: HTMLElement
  cssClass?: string | string[]
  callback?: (value: any) => void
}

export class Button {
  private element: HTMLButtonElement
  constructor(params: ButtonParams) {
    const { text, label, container, callback, cssClass } = params
    this.element = document.createElement("button")
    if (text) this.element.innerText = text
    if (label) this.element.setAttribute("aria-label", label)
    if (container) container.appendChild(this.element)
    if (callback) this.element.addEventListener("click", callback)
    if (cssClass) {
      const buttonClass: string[] = [CSSClass.ControlButton]
      if (Array.isArray(cssClass)) buttonClass.push(...cssClass)
      else if (typeof cssClass === "string") buttonClass.push(cssClass)
      this.element.classList.add(...buttonClass)
    }
  }

  render() {
    return this.element
  }

  set text(value: string) {
    this.element.innerText = value
  }
}
