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
