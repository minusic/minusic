import { CSSClass } from "../../enums"
import { createElement } from "../elements"
import { bound } from "../utils"

export default class Progress {
  private container: HTMLElement
  private elements: {
    progressContainer: HTMLElement
    progressBar: HTMLElement
  }
  private config: {
    min: number
    max: number
    value: number
  }
  constructor({
    container,
    min = 0,
    max = 100,
    value = 0,
    cssClass = [],
  }: {
    container: HTMLElement
    min?: number
    max?: number
    value?: number
    cssClass?: string[]
  }) {
    this.container = container
    this.config = { min, max, value }
    this.elements = this.createProgressElements(cssClass)
  }
  private createProgressElements(cssClass: string[]) {
    const progressContainer = createElement(
      "div",
      { container: this.container },
      { class: [CSSClass.Progress, ...cssClass] },
    )

    const progressBar = createElement(
      "div",
      { container: progressContainer },
      { class: [CSSClass.ProgressBar] },
    )

    return { progressContainer, progressBar }
  }

  get value() {
    return this.config.value
  }

  set value(newValue: number) {
    this.config.value = bound(newValue, this.config.min, this.config.max)

    const percentage = (this.config.value / this.config.max) * 100
    this.elements.progressBar.style.width = `${percentage}%`
  }
}
