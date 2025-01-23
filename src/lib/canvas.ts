export function drawRectangle(
  context: any,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  context.strokeRect(x, y, width, height)
  //context.fillRect(x, y , width, height)
}

export function drawRoundedRectangle(
  context: any,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
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
  //context.fill()
  context.stroke()
}
