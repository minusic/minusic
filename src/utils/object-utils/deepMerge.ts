/**
 * Deep merges two objects together, preserving keys from target that don't exist in source
 * @param target The target object to merge into
 * @param source The source object to merge from
 * @returns A new object with merged properties
 */
export function deepMerge<T extends object, S extends object>(
  target: T,
  source: S,
): T & S {
  const output = { ...target } as T & S

  if (isObject(source) && isObject(target)) {
    Object.keys(source).forEach((key) => {
      const sourceValue = source[key as keyof S]
      const targetValue = target[key as keyof T]

      if (isObject(sourceValue) && isObject(targetValue)) {
        output[key as keyof (T & S)] = deepMerge(
          targetValue as object,
          sourceValue as object,
        ) as any
      } else {
        output[key as keyof (T & S)] = sourceValue as any
      }
    })
  }

  return output
}

/**
 * Type guard to check if a value is an object
 * @param item Value to check
 * @returns Boolean indicating if the value is an object
 */
function isObject(item: unknown): item is object {
  return Boolean(item && typeof item === "object" && !Array.isArray(item))
}
