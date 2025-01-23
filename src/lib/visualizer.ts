import { drawRectangle, drawRoundedRectangle } from "./canvas"
import { setStyle } from "./elements"

export default class Visualizer {
  private canvas!: HTMLCanvasElement
  private context!: CanvasRenderingContext2D
  private audioContext!: AudioContext
  private audioSource!: MediaElementAudioSourceNode
  private analyser!: AnalyserNode
  initialized: Boolean = false

  constructor({
    canvas,
    media,
  }: {
    canvas: HTMLCanvasElement
    media: HTMLMediaElement
  }) {
    if (canvas?.nodeName !== "CANVAS") return

    this.canvas = canvas
    this.context = canvas.getContext("2d") as CanvasRenderingContext2D

    this.audioContext = this.getAudioContext() as AudioContext
    if (this.audioContext === null) return

    this.audioSource = this.audioContext.createMediaElementSource(media)
    this.analyser = this.audioContext.createAnalyser()

    this.audioSource.connect(this.analyser)
    this.analyser.connect(this.audioContext.destination)

    this.updateCanvasSize()
    this.strokeStyle()
    this.fillStyle()
    this.initialized = true
  }

  getAudioContext() {
    if (typeof AudioContext !== "undefined") {
      return new AudioContext()
    }
    return null
  }

  setScaleRatio() {
    const scale = window.devicePixelRatio || 1
    this.canvas.width = scale * 900 //this.elements.container.offsetWidth
    this.canvas.height = scale * 120 //this.elements.container.offsetHeight
    this.context.scale(scale, scale)
  }

  updateCanvasSize() {
    setStyle(this.canvas, { width: "900px", height: "120px" })
    this.setScaleRatio()
  }

  fillStyle() {
    //this.visualizer.context.fillStyle = "#000"
    this.context.fillStyle = "transparent"
  }

  strokeStyle() {
    const grad = this.context.createLinearGradient(0, 0, 900, 130)
    grad.addColorStop(0, "#98067F")
    grad.addColorStop(0.5, "#685FEE")
    grad.addColorStop(1, "#98067F")
    this.context.strokeStyle = grad
  }

  private frequencies(paused: boolean) {
    if (paused) {
      return new Uint8Array(Array(256).fill(0))
    } else {
      return new Uint8Array(this.analyser.frequencyBinCount)
    }
  }

  update(paused: boolean) {
    this.clearCanvas()
    var array = this.frequencies(paused)
    this.analyser.getByteFrequencyData(array)

    const tick = 50
    const width = 900
    const length = Math.floor(array.length * 0.75)
    const height = 120
    const tickSize = 255
    const tickWidth = 12

    for (let i = 0; i < tick; i++) {
      const current = Math.floor(length / tick) * i
      //drawRectangle(this.context, (width/tick)*i, 0, 10, array[current]/2)
      //drawRectangle(this.context, (width/tick)*i, (height-(array[current]/2)), 10, array[current]/2)

      // drawRectangle(
      //   this.context,
      //   (width / tick) * i,
      //   height - array[current] / 2,
      //   10,
      //   array[current] / 2,
      // )

      // drawRectangle(
      //   this.context,
      //   Math.round((width / tick) * i),
      //   Math.round((height - (array[current] / tickSize) * 100) / 2),
      //   tickWidth,
      //   Math.round((array[current] / tickSize) * 100) + 1,
      // )

      drawRoundedRectangle(
        this.context,
        Math.round((width / tick) * i),
        Math.round((height - (array[current] / tickSize) * 100) / 2),
        tickWidth,
        Math.round((array[current] / tickSize) * 100) + 1,
        2,
      )
    }

    this.context.stroke()
    this.context.fill()
    return array
  }

  clearCanvas() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }
}
