export class MockCanvasGradient {
  private colorStops: Array<{ offset: number; color: string }> = []

  addColorStop(offset: number, color: string) {
    this.colorStops.push({ offset, color })
  }

  getColorStops() {
    return [...this.colorStops].sort((a, b) => a.offset - b.offset)
  }
}

export class MockCanvasContext {
  createLinearGradient(x0: number, y0: number, x1: number, y1: number) {
    this.lastLinearGradientParams = { x0, y0, x1, y1 }
    return new MockCanvasGradient()
  }

  lastLinearGradientParams: {
    x0: number
    y0: number
    x1: number
    y1: number
  } | null = null
}
