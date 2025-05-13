export function randomNumber(
  min: number,
  max: number,
  exclude: number | number[] = [],
): number {
  if (!Array.isArray(exclude)) exclude = [exclude]

  const validExclusions = Array.from(
    new Set(
      exclude.filter(
        (num) => Number.isInteger(num) && num >= min && num <= max,
      ),
    ),
  )

  const validNumbers = []
  for (let number = min; number <= max; number++) {
    if (!validExclusions.includes(number)) validNumbers.push(number)
  }

  if (validNumbers.length === 0)
    throw new Error("Invalid range: No available numbers to choose from")

  return validNumbers[Math.floor(Math.random() * validNumbers.length)]
}
