import { CSSClass } from "../../enums"
import { createElement } from "../../utils/dom/elements"
import { bound } from "../../utils/math/bounds"

interface RangeConfig {
  step?: number
  min?: number
  max?: number
  value?: number
}

interface RangeOptions extends RangeConfig {
  container: HTMLElement
  label: string
  handler: (value: number) => void
  cssClass?: string[]
}

export default class Range {
  private readonly container: HTMLElement
  private readonly handler: (value: number) => void
  private readonly config: Required<RangeConfig> & { isActive: boolean }
  private readonly elements: {
    range: HTMLElement
    background: HTMLElement
    progress: HTMLElement
    thumb: HTMLElement
  }

  constructor({
    container,
    label,
    handler,
    step = 0.05,
    min = 0,
    max = 1,
    cssClass = [],
    value = 0,
  }: RangeOptions) {
    this.container = container
    this.handler = handler
    this.config = { step, min, max, value, isActive: false }
    this.elements = this.createRangeElements(label, cssClass)
    this.setupGlobalEventListeners()
    this.value = value
  }

  private createRangeElements(
    label: string,
    cssClass: string[],
  ): Range["elements"] {
    const range = this.createRangeContainer(label, cssClass)
    const background = this.createBackground(range)
    const progress = this.createProgress(background)
    const thumb = this.createThumb(background)

    return { range, background, progress, thumb }
  }

  private createRangeContainer(label: string, cssClass: string[]): HTMLElement {
    return createElement(
      "div",
      { container: this.container },
      {
        class: [CSSClass.Range, ...cssClass],
        "aria-label": label,
        tabIndex: "0",
      },
      {
        click: this.handleInteraction.bind(this),
        mousedown: this.handleMouseDown.bind(this),
        touchstart: this.handleTouchStart.bind(this),
        keydown: this.handleKeyDown.bind(this),
      },
    )
  }

  private createBackground(range: HTMLElement): HTMLElement {
    return createElement(
      "div",
      { container: range },
      { class: [CSSClass.RangeBackground] },
    )
  }

  private createProgress(background: HTMLElement): HTMLElement {
    return createElement(
      "div",
      { container: background },
      { class: [CSSClass.RangeProgress] },
    )
  }

  private createThumb(background: HTMLElement): HTMLElement {
    return createElement(
      "div",
      { container: background },
      { class: [CSSClass.RangeThumb] },
    )
  }

  private setupGlobalEventListeners(): void {
    const moveHandler = (event: MouseEvent | TouchEvent) => {
      if (this.config.isActive) this.handleInteraction(event)
    }
    const upHandler = () => {
      this.config.isActive = false
    }

    document.addEventListener("mousemove", moveHandler)
    document.addEventListener("mouseup", upHandler)
    document.addEventListener("touchmove", moveHandler)
    document.addEventListener("touchend", upHandler)
  }

  private handleMouseDown(event: MouseEvent): void {
    this.config.isActive = true
    this.handleInteraction(event)
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault()
    this.config.isActive = true
    this.handleInteraction(event)
  }

  private handleInteraction(event: MouseEvent | TouchEvent): void {
    const { left, width } = this.elements.background.getBoundingClientRect()
    const clientX = this.getClientX(event)
    const newValue = ((clientX - left) / width) * this.config.max

    if (!isNaN(newValue)) {
      this.value = newValue
      this.handler(this.value)
    }
  }

  private getClientX(event: MouseEvent | TouchEvent): number {
    return event instanceof MouseEvent
      ? event.clientX
      : event.touches[0].clientX
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault()
      const adjustment =
        event.key === "ArrowLeft" ? -this.config.step : this.config.step
      this.value = this.value + adjustment * this.config.max
      this.handler(this.value)
    }
  }

  private normalize(value: number): number {
    return Math.round(value / this.config.step) * this.config.step
  }

  set background(url: string | undefined) {
    const applyBackground = (element: HTMLElement) => {
      element.style.backgroundImage = url ? `url("${url}")` : "none"
    }

    applyBackground(this.elements.range)
    applyBackground(this.elements.progress)
  }

  get value(): number {
    return this.config.value
  }

  set value(newValue: number) {
    const normalizedValue = this.normalize(newValue)
    this.config.value = bound(normalizedValue, this.config.min, this.config.max)

    const percentage = (this.config.value / this.config.max) * 100
    this.elements.progress.style.width = `${percentage}%`
    this.elements.thumb.style.left = `${percentage}%`
  }
}
