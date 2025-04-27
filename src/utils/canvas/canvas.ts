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

export function createLinearGradient(
  canvasProperties: {
    width: number
    height: number
    context: CanvasRenderingContext2D
  },
  parameters: {
    angle?: number
    values: { [key: number]: string }
  },
) {
  const angleInRadians =
    typeof parameters.angle !== "undefined"
      ? (parameters.angle * Math.PI) / 180
      : 0
  const { width, height, context } = canvasProperties
  const diagonal = Math.sqrt(width * width + height * height)
  const centerX = width / 2
  const centerY = height / 2
  const startX = centerX - (diagonal / 2) * Math.cos(angleInRadians)
  const startY = centerY - (diagonal / 2) * Math.sin(angleInRadians)
  const endX = centerX + (diagonal / 2) * Math.cos(angleInRadians)
  const endY = centerY + (diagonal / 2) * Math.sin(angleInRadians)

  const gradient = context.createLinearGradient(startX, startY, endX, endY)

  Object.entries(parameters.values).forEach(([key, value]) => {
    gradient.addColorStop(parseFloat(key), value)
  })

  return gradient
}

export function createRadialGradient(
  canvasProperties: {
    width: number
    height: number
    context: CanvasRenderingContext2D
  },
  parameters: {
    centerX?: number
    centerY?: number
    startRadius?: number
    endRadius?: number
    values: { [key: number]: string }
  },
) {
  const { width, height, context } = canvasProperties

  const centerX =
    parameters.centerX !== undefined ? parameters.centerX : width / 2
  const centerY =
    parameters.centerY !== undefined ? parameters.centerY : height / 2

  const startRadius =
    parameters.startRadius !== undefined ? parameters.startRadius : 0

  let endRadius = parameters.endRadius
  if (endRadius === undefined) {
    const distToTopLeft = Math.sqrt(centerX * centerX + centerY * centerY)
    const distToTopRight = Math.sqrt(
      (width - centerX) * (width - centerX) + centerY * centerY,
    )
    const distToBottomLeft = Math.sqrt(
      centerX * centerX + (height - centerY) * (height - centerY),
    )
    const distToBottomRight = Math.sqrt(
      (width - centerX) * (width - centerX) +
        (height - centerY) * (height - centerY),
    )

    endRadius = Math.max(
      distToTopLeft,
      distToTopRight,
      distToBottomLeft,
      distToBottomRight,
    )
  }

  const gradient = context.createRadialGradient(
    centerX,
    centerY,
    startRadius,
    centerX,
    centerY,
    endRadius,
  )

  Object.entries(parameters.values).forEach(([key, value]) => {
    gradient.addColorStop(parseFloat(key), value)
  })

  return gradient
}

export function createConicGradient(
  canvasProperties: {
    width: number
    height: number
    context: CanvasRenderingContext2D
  },
  parameters: {
    angle?: number
    centerX?: number
    centerY?: number
    values: { [key: number]: string }
  },
) {
  const { width, height, context } = canvasProperties

  const startAngle =
    parameters.angle !== undefined ? (parameters.angle * Math.PI) / 180 : 0
  const centerX =
    parameters.centerX !== undefined ? parameters.centerX : width / 2
  const centerY =
    parameters.centerY !== undefined ? parameters.centerY : height / 2

  if (typeof context.createConicGradient !== "function") {
    console.warn("createConicGradient is not supported in this browser")
    return createRadialGradient(canvasProperties, {
      centerX: centerX,
      centerY: centerY,
      values: parameters.values,
    })
  }

  const gradient = context.createConicGradient(startAngle, centerX, centerY)

  Object.entries(parameters.values).forEach(([key, value]) => {
    gradient.addColorStop(parseFloat(key), value)
  })

  return gradient
}
