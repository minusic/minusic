import { CSSClass } from "../../enums"
import { createSVGElement } from "../../utils/dom/elements"
import { bound } from "../utils"

interface CircularRangeConfig {
  value: number
  startAngle?: number
  endAngle?: number
  min?: number
  max?: number
  step?: number
  radius?: number
  clockwise?: boolean
  angleRange?: number
}

interface CircularRangeOptions extends CircularRangeConfig {
  container: HTMLElement
  label: string
  handler: (value: number) => void
  cssClass?: string[]
}

interface Point {
  x: number
  y: number
}

export default class CircularRange {
  private readonly strokeWidth = 15
  private readonly radius: number
  private readonly handler: (value: number) => void
  private readonly config: Required<CircularRangeConfig> & { isActive: boolean }
  private readonly elements: {
    range: SVGElement
    progress: SVGElement
    background: SVGElement
    thumb: SVGElement
  }

  constructor({
    container,
    label,
    handler,
    value,
    step = 0.05,
    min = 0,
    max = 1,
    startAngle = 0,
    endAngle = 360,
    radius = 0,
    cssClass = [],
    clockwise = true,
  }: CircularRangeOptions) {
    this.radius = radius
    this.handler = handler
    this.config = {
      value,
      startAngle,
      endAngle,
      step,
      min,
      max,
      radius,
      clockwise,
      isActive: false,
      angleRange: endAngle - startAngle,
    }

    this.elements = this.createSVGElements(container, cssClass, label)
    this.updateBackground()
    this.setupEventListeners()
    this.value = value
  }

  private createSVGElements(
    container: HTMLElement,
    cssClass: string[],
    label: string = "",
  ) {
    const range = this.createRangeSVG(cssClass, label)
    const background = this.createBackgroundPath()
    const progress = this.createProgressPath()
    const thumb = this.createThumb()

    range.append(background, progress, thumb)
    container.appendChild(range)

    return { range, progress, background, thumb }
  }

  private createRangeSVG(cssClass: string[], label: string): SVGElement {
    return createSVGElement("svg", {
      width: `${this.radius * 2}`,
      height: `${this.radius * 2}`,
      class: [CSSClass.CircularRange, ...cssClass].join(" "),
      "aria-label": label,
    })
  }

  private createBackgroundPath(): SVGElement {
    return createSVGElement("path", {
      "stroke-width": `${this.strokeWidth}`,
      class: CSSClass.CircularRangeBackground,
    })
  }

  private createProgressPath(): SVGElement {
    return createSVGElement("path", {
      "stroke-width": `${this.strokeWidth}`,
      class: CSSClass.CircularRangeProgress,
    })
  }

  private createThumb(): SVGElement {
    return createSVGElement("circle", {
      r: "7.5",
      class: CSSClass.CircularRangeThumb,
      tabindex: "0",
    })
  }

  private setupEventListeners(): void {
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

    this.attachElementListeners()
  }

  private attachElementListeners(): void {
    const interactiveElements = [
      this.elements.background,
      this.elements.progress,
      this.elements.thumb,
    ]

    interactiveElements.forEach((element) => {
      element.addEventListener("click", this.handleInteraction.bind(this))
      element.addEventListener("mousedown", this.handleMouseDown.bind(this))
      element.addEventListener("touchstart", this.handleTouchStart.bind(this))
      element.addEventListener("keydown", this.handleKeyDown.bind(this))
    })
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
    const { left, width, top, height } =
      this.elements.range.getBoundingClientRect()
    const { clientX, clientY } = this.extractClientCoordinates(event)

    const centerX = left + width / 2
    const centerY = top + height / 2

    const angle = this.calculateAngle(clientX, clientY, centerX, centerY)
    const value = this.calculateValue(angle)

    this.update(value)
    this.handler(value)
  }

  private extractClientCoordinates(event: MouseEvent | TouchEvent): {
    clientX: number
    clientY: number
  } {
    return event instanceof MouseEvent
      ? { clientX: event.clientX, clientY: event.clientY }
      : { clientX: event.touches[0].clientX, clientY: event.touches[0].clientY }
  }

  private calculateAngle(
    clientX: number,
    clientY: number,
    centerX: number,
    centerY: number,
  ): number {
    const { startAngle, angleRange } = this.config
    const x = clientX - centerX
    const y = clientY - centerY

    let angle = Math.atan2(y, x) * (180 / Math.PI)
    angle = angle < 0 ? 360 + angle : angle
    angle = (angle + 90 - startAngle + 360) % 360

    // Prevent value jumping from 0 to max
    return angle > angleRange + (360 - angleRange) / 2 ? 0 : angle
  }

  private calculateValue(angle: number): number {
    const { min, max, angleRange, clockwise } = this.config
    let value = (angle / angleRange) * max
    value = bound(value, min, max)
    return clockwise ? value : max - value
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

  private updateBackground(): void {
    this.elements.background.setAttribute(
      "d",
      this.generateArcPath(
        { x: this.radius, y: this.radius },
        this.radius - this.strokeWidth / 2,
        this.config.startAngle,
        this.config.endAngle,
      ),
    )
  }

  private update(value: number): void {
    const endAngle =
      (value / this.config.max) * this.config.angleRange +
      this.config.startAngle

    // Update progress path
    this.elements.progress.setAttribute(
      "d",
      this.generateArcPath(
        { x: this.radius, y: this.radius },
        this.radius - this.strokeWidth / 2,
        this.config.startAngle,
        endAngle,
      ),
    )

    // Update thumb position
    const angle = this.calculateThumbAngle(endAngle)
    const { x, y } = this.convertAngle(
      { x: this.radius, y: this.radius },
      this.radius - 7.5,
      angle,
    )

    this.elements.thumb.setAttribute("cx", `${x}`)
    this.elements.thumb.setAttribute("cy", `${y}`)
  }

  private calculateThumbAngle(endAngle: number): number {
    const { clockwise, angleRange, startAngle } = this.config
    return clockwise
      ? endAngle
      : angleRange + startAngle - (endAngle - startAngle)
  }

  private convertAngle(
    centerPoint: Point,
    radius: number,
    degrees: number,
  ): Point {
    const radians = ((degrees - 90) * Math.PI) / 180
    return {
      x: centerPoint.x + radius * Math.cos(radians),
      y: centerPoint.y + radius * Math.sin(radians),
    }
  }

  private generateArcPath(
    centerPoint: Point,
    radius: number,
    startAngle: number,
    endAngle: number,
  ): string {
    const adjustedAngles = this.adjustAnglesForClockwise(startAngle, endAngle)
    const { start, end, largeArc, closePath } = this.calculateArcParameters(
      centerPoint,
      radius,
      adjustedAngles.startAngle,
      adjustedAngles.endAngle,
    )

    return `
      M ${start.x} ${start.y}
      A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}
      ${closePath}
    `
  }

  private adjustAnglesForClockwise(
    startAngle: number,
    endAngle: number,
  ): { startAngle: number; endAngle: number } {
    if (!this.config.clockwise) {
      const gap = this.config.angleRange - (endAngle - startAngle)
      return {
        startAngle: startAngle + gap,
        endAngle: endAngle + gap,
      }
    }
    return { startAngle, endAngle }
  }

  private calculateArcParameters(
    centerPoint: Point,
    radius: number,
    startAngle: number,
    endAngle: number,
  ) {
    const isFullCircle = (endAngle - startAngle) % 360 === 0
    const adjustedEndAngle = isFullCircle ? endAngle - 1 : endAngle

    const start = this.convertAngle(centerPoint, radius, adjustedEndAngle)
    const end = this.convertAngle(centerPoint, radius, startAngle)
    const largeArc = endAngle - startAngle <= 180 ? "0" : "1"
    const closePath = isFullCircle ? "z" : ""

    return { start, end, largeArc, closePath }
  }

  set background(url: string | undefined) {
    const applyBackground = (element: SVGElement) => {
      element.style.backgroundImage = url ? `url("${url}")` : "none"
    }

    applyBackground(this.elements.range)
    applyBackground(this.elements.progress)
  }

  get value(): number {
    return this.config.value
  }

  set value(newValue: number) {
    if (this.config.value !== newValue) {
      this.config.value = newValue
      this.update(newValue)
    }
  }
}
