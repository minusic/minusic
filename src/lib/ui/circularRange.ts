import { CSSClass } from "../../enums"
import { createElement, createSVGElement } from "../elements"
import { bound } from "../utils"
import Range from "./range"

export default class CircularRange {
  private radius: number
  private handler: (value: number) => void
  private config: {
    value: number
    startAngle: number
    endAngle: number
    min: number
    max: number
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
    startAngle = 90,
    endAngle = 270,
    radius = 100,
    value = 0,
    cssClass = [],
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
  }) {
    this.radius = radius
    this.strokeWidth = 15
    this.config = { value, startAngle, endAngle, min, max }
    this.handler = handler
    this.elements = this.createElements(container, cssClass)
    this.updateBackground()
    this.setupEventListeners()

    this.value = value
  }

  private createElements(container: HTMLElement, cssClass: string[]) {
    const svg = createSVGElement("svg", {
      width: `${this.radius * 2}`,
      height: `${this.radius * 2}`,
      class: [CSSClass.CircularRange, ...cssClass].join(" "),
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
    })

    svg.appendChild(background)
    svg.appendChild(progress)
    svg.appendChild(thumb)
    container.appendChild(svg)

    return { svg, progress, background, thumb }
  }

  private setupEventListeners() {
    this.elements.background.addEventListener(
      "click",
      this.handleInteraction.bind(this),
    )
    this.elements.progress.addEventListener(
      "click",
      this.handleInteraction.bind(this),
    )
    this.elements.thumb.addEventListener(
      "click",
      this.handleInteraction.bind(this),
    )
  }

  private handleInteraction(event: MouseEvent) {
    const angleRange = this.config.endAngle - this.config.startAngle
    const { left, width, top, height } =
      this.elements.svg.getBoundingClientRect()
    const centerX = left + width / 2
    const centerY = top + height / 2
    const x = event.clientX - centerX
    const y = event.clientY - centerY
    let angle = Math.atan2(y, x) * (180 / Math.PI)
    angle = (angle + 90 + 360) % 360
    angle = bound(angle, 0, 360)
    angle -= this.config.startAngle

    let value = (angle / angleRange) * this.config.max
    value = bound(value, this.config.min, this.config.max)
    this.update(value)
    this.handler(value)
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
      (value / this.config.max) *
        (this.config.endAngle - this.config.startAngle) +
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
    const { x, y } = this.convertAngle(
      { x: this.radius, y: this.radius },
      this.radius - 7.5,
      endAngle,
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
    const isFullCircle = (endAngle - startAngle) % 360 === 0
    const adjustedEndAngle = isFullCircle ? endAngle - 1 : endAngle

    const start = this.convertAngle(centerPoint, radius, adjustedEndAngle)
    const end = this.convertAngle(centerPoint, radius, startAngle)

    const arcSweep = endAngle - startAngle <= 180 ? "0" : "1"
    const pathCommands = [
      "M",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      arcSweep,
      0,
      end.x,
      end.y,
      ...(isFullCircle ? ["z"] : []),
    ]

    return pathCommands.join(" ")
  }

  get value() {
    return this.config.value
  }

  set value(newValue: number) {
    if (this.config.value !== newValue) this.config.value = newValue
    this.update(newValue)
  }
}
