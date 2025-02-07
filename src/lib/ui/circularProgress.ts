import { CSSClass } from "../../enums"
import { createSVGElement } from "../elements"
import { bound } from "../utils"

export default class CircularProgress {
  private container: HTMLElement
  private elements: {
    progressContainer: SVGElement
    progressBackground: SVGElement
    progressBar: SVGElement
  }
  private config: {
    min: number
    max: number
    value: number
    radius: number
    strokeWidth: number
    angleRange: number
    clockwise: boolean
    startAngle: number
    endAngle: number
  }
  constructor({
    container,
    min = 0,
    max = 100,
    value = 0,
    radius = 10,
    strokeWidth = 15,
    cssClass = [],
    startAngle = 0,
    endAngle = 360,
    clockwise = true,
  }: {
    container: HTMLElement
    min?: number
    max?: number
    value?: number
    radius?: number
    strokeWidth?: number
    cssClass?: string[]
    startAngle?: number
    endAngle?: number
    clockwise?: boolean
  }) {
    this.container = container
    this.config = {
      min,
      max,
      value,
      radius,
      strokeWidth,
      clockwise,
      startAngle,
      endAngle,
      angleRange: endAngle - startAngle,
    }
    this.elements = this.createProgressElements(cssClass)
  }
  private createProgressElements(cssClass: string[]) {
    const progressContainer = createSVGElement("svg", {
      width: `${this.config.radius * 2}`,
      height: `${this.config.radius * 2}`,
      class: [CSSClass.CircularProgress, ...cssClass].join(" "),
    })

    const progressBackground = createSVGElement("path", {
      "stroke-width": `${this.config.strokeWidth}`,
      class: CSSClass.CircularProgressBackground,
    })
    progressBackground.setAttribute(
      "d",
      this.generateArcPath(
        { x: this.config.radius, y: this.config.radius },
        this.config.radius - this.config.strokeWidth / 2,
        this.config.startAngle,
        this.config.endAngle,
      ),
    )

    const progressBar = createSVGElement("path", {
      "stroke-width": `${this.config.strokeWidth}`,
      class: CSSClass.CircularProgressBar,
    })

    progressContainer.append(progressBackground, progressBar)
    this.container.appendChild(progressContainer)

    return { progressContainer, progressBackground, progressBar }
  }

  private update(value: number) {
    const { radius, strokeWidth } = this.config
    const endAngle =
      (value / this.config.max) * this.config.angleRange +
      this.config.startAngle
    this.elements.progressBar.setAttribute(
      "d",
      this.generateArcPath(
        { x: radius, y: radius },
        radius - strokeWidth / 2,
        this.config.startAngle,
        endAngle,
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
