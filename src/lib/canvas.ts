export function drawLine(
  context: CanvasRenderingContext2D,
  points: number[][],
  closePath: boolean = false,
) {
  context.beginPath()
  points.forEach(([x, y], index) => {
    index === 0 ? context.moveTo(x, y) : context.lineTo(x, y)
  })
  if (closePath) context.closePath()
  context.stroke()
}

export function drawRectangle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  context.strokeRect(x, y, width, height)
  //context.fillRect(x, y , width, height)
}

export function drawRoundedRectangle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number = 0,
) {
  if (radius < 0) {
    radius = width
  }
  if (width < 2 * radius) radius = Math.round(width / 2)
  if (height < 2 * radius) radius = Math.round(height / 2)
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + width, y, x + width, y + height, radius)
  context.arcTo(x + width, y + height, x, y + height, radius)
  context.arcTo(x, y + height, x, y, radius)
  context.arcTo(x, y, x + width, y, radius)
  context.closePath()
  context.fill()
  context.stroke()
}

export function drawDrop(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  size: number,
  angles: number | number[] = 0,
  radius: number = 0,
  maxSize: number,
) {
  if (!Array.isArray(angles)) angles = [angles]

  for (const angle of angles) {
    let newX = x
    let newY = y
    const newH = [0, 2].includes(angle) ? size : height
    const newW = [1, 3].includes(angle) ? size : width
    if (angle === 0) {
      newY = Math.min(maxSize - size, Math.max(y + height, y + height - size))
    } else if (angle === 1) {
      newX = Math.min(maxSize - size, Math.max(x + width, x + width - size))
    } else if (angle === 2) {
      newY = Math.max(0, Math.min(y - size, y + height - size))
    } else if (angle === 3) {
      newX = Math.max(0, Math.min(x - size, x + width - size))
    }
    drawRoundedRectangle(context, newX, newY, newW, newH, radius)
  }
}

export function drawLevels(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  size: number,
  radius: number = 0,
) {
  //const size = Math.min(width, height)

  drawRoundedRectangle(context, x, y - size, width, size, radius)
}
