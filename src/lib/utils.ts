export function bound(value: number, min: number, max: number) {
  return Math.max(Math.min(value, max), min)
}

export function nearest(value: number, a: number, b: number) {
  return Math.abs(value - a) < Math.abs(value - b) ? a : b
}

export function formatTime(seconds: number = 0) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.round(seconds % 60)

  const formattedHours = hours > 0 ? `${hours}:` : ""
  const formattedMinutes = `${hours > 0 ? String(minutes).padStart(2, "0") : minutes}:`
  const formattedSeconds = String(secs).padStart(2, "0")

  return `${formattedHours}${formattedMinutes}${formattedSeconds}`
}

export function randomNumber(
  min: number,
  max: number,
  exclude: number | number[] = [],
) {
  if (!Array.isArray(exclude)) exclude = [exclude]
  const rangeSize = max - min + 1 - exclude.length
  if (rangeSize <= 0)
    throw new Error("Invalid range: Not enough numbers to generate")

  const validExclusions = exclude.filter(
    (num) => Number.isInteger(num) && num >= min && num <= max,
  )

  let randomNum
  do {
    randomNum = Math.floor(Math.random() * (max - min + 1)) + min
  } while (validExclusions.includes(randomNum))
  return randomNum
}
