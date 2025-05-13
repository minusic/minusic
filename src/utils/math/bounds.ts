export function bound(value: number, min: number, max: number): number {
  if (isNaN(value)) return min

  if (min > max) {
    ;[min, max] = [max, min]
  }
  return Math.max(min, Math.min(max, value))
}
