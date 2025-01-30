export function drawLine(
  context: CanvasRenderingContext2D,
  points: number[][],
  closePath: boolean = false,
  loop: boolean = false,
) {
  context.beginPath()
  points.forEach(([x, y], index) => {
    index === 0 ? context.moveTo(x, y) : context.lineTo(x, y)
  })
  if (loop) context.lineTo(points[0][0], points[0][1])
  if (closePath) context.closePath()
  context.stroke()
}

function getMidpoint([x1, y1]: number[], [x2, y2]: number[]): [number, number] {
  return [(x1 + x2) / 2, (y1 + y2) / 2]
}

function drawSegment(
  context: CanvasRenderingContext2D,
  current: number[],
  next: number[],
) {
  const [x, y] = current
  const [controlX, controlY] = getMidpoint(current, next)
  context.quadraticCurveTo(x, y, controlX, controlY)
}

export function drawCurve(
  context: CanvasRenderingContext2D,
  points: number[][],
  closePath: boolean = false,
) {
  if (!points.length) return
  context.beginPath()

  const firstPoint = points[0] as [number, number]
  const startPoint = closePath
    ? getMidpoint(points[points.length - 1], firstPoint)
    : firstPoint

  context.moveTo(...startPoint)

  points.forEach((point, index) => {
    const isLastPoint = index === points.length - 1
    if (!closePath && isLastPoint)
      context.lineTo(...(point as [number, number]))
    else {
      const nextPoint = points[(index + 1) % points.length]
      drawSegment(context, point, nextPoint)
    }
  })

  if (closePath) drawSegment(context, firstPoint, points[1])
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
  if (width === 0) width = 1
  if (height === 0) height = 1

  if (radius < 0) radius = 0
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
