export function drawLine(
  context: CanvasRenderingContext2D,
  points: number[][],
  closePath: boolean = false,
  loop: boolean = false,
) {
  context.beginPath()
  points.forEach(([x, y], index) => {
    if (index === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
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
  context.fillRect(x, y, width, height)
}

export function drawRoundedRectangle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number = 0,
  alpha: number = 1,
  angle = 0,
) {
  if (alpha !== context.globalAlpha) context.globalAlpha = alpha
  if (radius < 0) radius = 0
  if (width < 2 * radius) radius = Math.round(width / 2)
  if (height < 2 * radius) radius = Math.round(height / 2)

  if (angle) {
    context.save()
    context.translate(x + width / 2, y + height / 2)
    context.rotate(angle * (Math.PI / 180))
    context.translate(-(x + width / 2), -(y + height / 2))
  }
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
  context.closePath()
  context.fill()
  context.stroke()
  if (angle) {
    context.restore()
  }
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
  size: number, // value between 0 and 1 representing sound level
  radius: number = 0,
  vertical: boolean = false,
) {
  if (vertical) {
    const squaresToDraw = Math.ceil(width / size)
    for (let i = 0; i < squaresToDraw; i++) {
      const squareX = x + width - (i + 1) * size
      drawRoundedRectangle(context, squareX, y, size, height, radius)
    }
  } else {
    const squaresToDraw = Math.ceil(height / size)
    for (let i = 0; i < squaresToDraw; i++) {
      const squareY = y + height - (i + 1) * size
      drawRoundedRectangle(context, x, squareY, width, size, radius)
    }
  }
}
