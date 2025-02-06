import { CSSClass } from "../../enums"
import { createElement, createSVGElement } from "../elements"
import { bound } from "../utils"

export default class CircularRange {
  private radius: number
  private handler: (value: number) => void
  private config: {
    value: number
    startAngle: number
    endAngle: number
    min: number
    max: number
    angleRange: number
    step: number
    isActive: boolean
    clockwise: boolean
  }
  private elements: {
    svg: SVGElement
    progress: SVGElement
    background: SVGElement
    thumb: SVGElement
  }
  private strokeWidth: number
  constructor({
    container,
    label,
    handler,
    step = 0.05,
    min = 0,
    max = 1,
    startAngle = 0,
    endAngle = 360,
    radius = 100,
    value = 0,
    cssClass = [],
    clockwise = true,
  }: {
    container: HTMLElement
    label: string
    handler: (value: number) => void
    value: number
    step?: number
    min?: number
    max?: number
    startAngle?: number
    endAngle?: number
    radius?: number
    cssClass: string[]
    clockwise?: boolean
  }) {
    this.radius = radius
    this.strokeWidth = 15
    this.config = {
      value,
      startAngle,
      endAngle,
      step,
      min,
      max,
      isActive: false,
      clockwise,
      angleRange: endAngle - startAngle,
    }
    this.handler = handler
    this.elements = this.createElements(container, cssClass, label)
    this.updateBackground()
    this.setupEventListeners()

    this.value = value
  }

  private createElements(
    container: HTMLElement,
    cssClass: string[],
    label: string = "",
  ) {
    const svg = createSVGElement("svg", {
      width: `${this.radius * 2}`,
      height: `${this.radius * 2}`,
      class: [CSSClass.CircularRange, ...cssClass].join(" "),
      "aria-label": label,
    })

    const background = createSVGElement("path", {
      "stroke-width": `${this.strokeWidth}`,
      class: CSSClass.CircularRangeBackground,
    })

    const progress = createSVGElement("path", {
      "stroke-width": `${this.strokeWidth}`,
      class: CSSClass.CircularRangeProgress,
    })

    const thumb = createSVGElement("circle", {
      r: `7.5`,
      class: CSSClass.CircularRangeThumb,
      tabindex: "1",
    })

    svg.append(background, progress, thumb)
    container.appendChild(svg)

    return { svg, progress, background, thumb }
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
    ;[
      this.elements.background,
      this.elements.progress,
      this.elements.thumb,
    ].forEach((element) => {
      element.addEventListener("click", this.handleInteraction.bind(this))
      element.addEventListener("mousedown", (event: MouseEvent) => {
        this.config.isActive = true
        this.handleInteraction(event)
      })
      element.addEventListener("touchstart", (event: TouchEvent) => {
        event.preventDefault()
        this.config.isActive = true
        this.handleInteraction(event)
      })
    })
    this.elements.thumb.addEventListener(
      "keydown",
      this.handleKeyDown.bind(this),
    )
  }

  private handleInteraction(event: MouseEvent | TouchEvent) {
    const { angleRange, min, max, clockwise, startAngle } = this.config
    const { left, width, top, height } =
      this.elements.svg.getBoundingClientRect()
    const clientX =
      event instanceof MouseEvent ? event.clientX : event.touches[0].clientX
    const clientY =
      event instanceof MouseEvent ? event.clientY : event.touches[0].clientY
    const centerX = left + width / 2
    const centerY = top + height / 2
    const x = clientX - centerX
    const y = clientY - centerY
    let angle = Math.atan2(y, x) * (180 / Math.PI)
    // normalize angle
    if (angle < 0) angle = 360 + angle
    // compute angle depending on startAngle
    angle = (angle + 90 - startAngle + 360) % 360
    // avoid value jumping from 0 to max when dragging to minimum
    if (angle > angleRange + (360 - angleRange) / 2) angle = 0

    let value = (angle / angleRange) * max
    value = bound(value, min, max)
    value = clockwise ? value : max - value
    this.update(value)
    this.handler(value)
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

  private updateBackground() {
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

  private update(value: number) {
    const endAngle =
      (value / this.config.max) * this.config.angleRange +
      this.config.startAngle
    this.elements.progress.setAttribute(
      "d",
      this.generateArcPath(
        { x: this.radius, y: this.radius },
        this.radius - this.strokeWidth / 2,
        this.config.startAngle,
        endAngle,
      ),
    )

    const angle = this.config.clockwise
      ? endAngle
      : this.config.angleRange +
        this.config.startAngle -
        (endAngle - this.config.startAngle)

    const { x, y } = this.convertAngle(
      { x: this.radius, y: this.radius },
      this.radius - 7.5,
      angle,
    )
    this.elements.thumb.setAttribute("cx", `${x}`)
    this.elements.thumb.setAttribute("cy", `${y}`)
  }

  private convertAngle(
    centerPoint: { x: number; y: number },
    radius: number,
    degrees: number,
  ) {
    const radians = ((degrees - 90) * Math.PI) / 180
    return {
      x: centerPoint.x + radius * Math.cos(radians),
      y: centerPoint.y + radius * Math.sin(radians),
    }
  }

  private generateArcPath(
    centerPoint: { x: number; y: number },
    radius: number,
    startAngle: number,
    endAngle: number,
  ) {
    if (!this.config.clockwise) {
      const gap = this.config.angleRange - (endAngle - startAngle)
      startAngle += gap
      endAngle += gap
    }
    const isFullCircle = (endAngle - startAngle) % 360 === 0
    const adjustedEndAngle = isFullCircle ? endAngle - 1 : endAngle

    const start = this.convertAngle(centerPoint, radius, adjustedEndAngle)
    const end = this.convertAngle(centerPoint, radius, startAngle)
    const rotation = 0
    const largeArc = endAngle - startAngle <= 180 ? "0" : "1"
    const sweepFlag = 0
    const closePath = isFullCircle ? "z" : ""

    return `
      M ${start.x} ${start.y}
      A ${radius} ${radius} ${rotation} ${largeArc} ${sweepFlag} ${end.x} ${end.y}
      ${closePath}
    `
  }

  get value() {
    return this.config.value
  }

  set value(newValue: number) {
    if (this.config.value !== newValue) this.config.value = newValue
    this.update(newValue)
  }
}
