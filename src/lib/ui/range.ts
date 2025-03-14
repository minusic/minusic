import { CSSClass } from "../../enums"
import { createElement } from "../elements"
import { bound } from "../utils"

export default class Range {
  private container: HTMLElement
  private handler: (value: number) => void
  private elements: {
    range: HTMLElement
    background: HTMLElement
    progress: HTMLElement
    thumb: HTMLElement
  }
  private config: {
    step: number
    min: number
    max: number
    value: number
    isActive: boolean
  }

  constructor({
    container,
    label,
    step = 0.05,
    min = 0,
    max = 1,
    handler,
    cssClass = [],
    value = 0,
  }: {
    container: HTMLElement
    label: string
    step?: number
    min?: number
    max?: number
    handler: (value: number) => void
    cssClass?: string[]
    value?: number
  }) {
    this.container = container
    this.handler = handler
    this.config = { step, min, max, value, isActive: false }

    this.elements = this.createRangeElements(label, cssClass)
    this.setupEventListeners()
    this.value = value
  }

  private createRangeElements(label: string, cssClass: string[]) {
    const range = createElement(
      "div",
      { container: this.container },
      {
        class: [CSSClass.Range, ...cssClass],
        "aria-label": label,
        tabIndex: "0",
      },
      {
        click: this.handleInteraction.bind(this),
        mousedown: (event) => {
          this.config.isActive = true
          this.handleInteraction(event)
        },
        touchstart: (event) => {
          event.preventDefault()
          this.config.isActive = true
          this.handleInteraction(event)
        },
        keydown: this.handleKeyDown.bind(this),
      },
    )

    const background = createElement(
      "div",
      { container: range },
      { class: [CSSClass.RangeBackground] },
    )

    const progress = createElement(
      "div",
      { container: background },
      { class: [CSSClass.RangeProgress] },
    )

    const thumb = createElement(
      "div",
      { container: background },
      { class: [CSSClass.RangeThumb] },
    )

    return { range, background, progress, thumb }
  }

  private setupEventListeners() {
    const moveHandler = (event: MouseEvent | TouchEvent) => {
      if (this.config.isActive) this.handleInteraction(event)
    }
    const upHandler = () => (this.config.isActive = false)

    document.addEventListener("mousemove", moveHandler)
    document.addEventListener("mouseup", upHandler)
    document.addEventListener("touchmove", moveHandler)
    document.addEventListener("touchend", upHandler)
  }

  private handleInteraction(event: MouseEvent | TouchEvent) {
    const { left, width } = this.elements.background.getBoundingClientRect()
    const clientX =
      event instanceof MouseEvent ? event.clientX : event.touches[0].clientX
    const newValue = ((clientX - left) / width) * this.config.max

    if (!isNaN(newValue)) {
      this.value = newValue
      this.handler(this.value)
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault()
      const adjustment =
        event.key === "ArrowLeft" ? -this.config.step : this.config.step
      this.value = this.value + adjustment * this.config.max
      this.handler(this.value)
    }
  }

  private normalize(value: number) {
    return Math.round(value / this.config.step) * this.config.step
  }

  get element() {
    return this.elements.range
  }

  get value() {
    return this.config.value
  }

  set value(newValue: number) {
    newValue = this.normalize(newValue)
    this.config.value = bound(newValue, this.config.min, this.config.max)

    const percentage = (this.config.value / this.config.max) * 100
    this.elements.progress.style.width = `${percentage}%`
    this.elements.thumb.style.left = `${percentage}%`
  }
}
