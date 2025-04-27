export function bound(value: number, min: number, max: number) {
  return Math.max(Math.min(value, max), min)
}

export function nearest(value: number, a: number, b: number) {
  return Math.abs(value - a) < Math.abs(value - b) ? a : b
}
