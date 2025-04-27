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
