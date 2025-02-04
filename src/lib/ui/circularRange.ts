import { CSSClass } from "../../enums"
import { createElement, createSVGElement } from "../elements"
import { bound } from "../utils"
import Range from "./range"

export default class CircularRange {
  private radius: number
  private circumference: number
  private config: {
    value: number
  }
  private elements: {
    progress: SVGElement
  }
  private strokeWidth: number
  constructor({
    container,
    label,
    handler,
    step = 0.05,
    min = 0,
    max = 1,
    radius = 100,
    value = 0,
    cssClass = [],
  }: {
    container: HTMLElement
    label: string
    radius?: number
    handler: (value: number) => void
    value: number
    step?: number
    min?: number
    max?: number
    cssClass: string[]
  }) {
    //super(rangeProps)
    this.radius = radius
    this.strokeWidth = 15
    this.circumference = 2 * Math.PI * this.radius
    this.elements = this.createElements(container, cssClass)
    this.config = { value }
    this.update(90)
    this.value = value
  }

  private createElements(container: HTMLElement, cssClass: string[]) {
    const svg = createSVGElement("svg", {
      width: `${this.radius * 2}`,
      height: `${this.radius * 2}`,
      class: [CSSClass.CircularRange, ...cssClass].join(" "),
    })

    const background = createSVGElement("circle", {
      cx: `${this.radius}`,
      cy: `${this.radius}`,
      r: `${this.radius - this.strokeWidth / 2}`,
      fill: "none",
      stroke: "#eee",
      "stroke-width": `${this.strokeWidth}`,
    })

    const progress = createSVGElement("path", {
      cx: `${this.radius}`,
      cy: `${this.radius}`,
      r: `${this.radius - this.strokeWidth / 2}`,
      fill: "none",
      stroke: "#f44",
      "stroke-width": `${this.strokeWidth}`,
      class: CSSClass.CircularRangeProgress,
      "stroke-linecap": "round",
    })

    const thumb = createSVGElement("circle", {
      cx: `${this.radius}`,
      cy: `${7.5}`,
      r: `7.5`,
      fill: "#fff",
      stroke: "none",
      //class: CSSClass.CircularRangeProgress,
    })

    svg.appendChild(background)
    svg.appendChild(progress)
    svg.appendChild(thumb)
    container.appendChild(svg)

    return { progress }
  }

  private update(value: number) {
    this.elements.progress.setAttribute(
      "d",
      this.generateArcPath(
        { x: this.radius, y: this.radius },
        this.radius - this.strokeWidth / 2,
        0,
        value * 360,
      ),
    )
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
    const isFullCircle = endAngle - startAngle === 360
    const adjustedEndAngle = isFullCircle ? 359 : endAngle

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
