import { test } from "node:test"
import assert from "node:assert"
import { randomNumber } from "../../../../src/utils/math/random"

test("randomNumber utility", async (t) => {
  // Mock Math.random to make tests deterministic
  let randomValue = 0.5
  const originalRandom = Math.random

  // Setup and teardown for each test
  t.beforeEach(() => {
    Math.random = () => randomValue
  })

  t.afterEach(() => {
    Math.random = originalRandom
  })

  await t.test("should generate a number within the specified range", () => {
    // With Math.random = 0.5, should return middle of range
    randomValue = 0.5
    assert.strictEqual(
      randomNumber(1, 10),
      6,
      "Should generate middle value with random = 0.5",
    )

    // Test lower bound (Math.random = 0)
    randomValue = 0
    assert.strictEqual(
      randomNumber(1, 10),
      1,
      "Should generate min value with random = 0",
    )

    // Test upper bound (Math.random just under 1)
    randomValue = 0.999999
    assert.strictEqual(
      randomNumber(1, 10),
      10,
      "Should generate max value with random = 0.999999",
    )
  })

  await t.test("should exclude specified numbers", () => {
    // Setup to generate 5 with Math.random = 0.5 in range 1-9
    randomValue = 0.5

    // Test excluding a single number
    let attempts = 0
    const generateWithExclusion = () => {
      // If first attempt would return 5, next should return 6
      if (attempts++ === 0) {
        randomValue = 0.5 // Would generate 5
        return randomNumber(1, 9, 5)
      } else {
        randomValue = 0.6 // Would generate 6
        return randomNumber(1, 9, 5)
      }
    }

    assert.notStrictEqual(
      generateWithExclusion(),
      5,
      "Should not return excluded number",
    )

    // Test excluding multiple numbers
    randomValue = 0.5 // Would normally generate 5 in range 1-9
    assert.notStrictEqual(
      randomNumber(1, 9, [4, 5, 6]),
      5,
      "Should not return any excluded number",
    )
  })

  await t.test("should handle single-item ranges", () => {
    // Range with only one possible value
    assert.strictEqual(
      randomNumber(7, 7),
      7,
      "Should return the only possible value",
    )

    // Range with only one possible value, but it's excluded
    try {
      randomNumber(7, 7, 7)
      assert.fail("Should throw error when all possible values are excluded")
    } catch (error) {
      assert.match(
        error.message,
        /Invalid range/,
        "Should throw appropriate error message",
      )
    }
  })

  await t.test("should ignore invalid exclusions", () => {
    // Exclude number outside range
    randomValue = 0.5
    assert.strictEqual(
      randomNumber(1, 10, [15, 20]),
      6,
      "Should ignore exclusions outside range",
    )

    // Exclude non-integer in integer range
    assert.strictEqual(
      randomNumber(1, 10, [3.5, 6.7]),
      6,
      "Should ignore non-integer exclusions",
    )
  })

  await t.test(
    "should throw error when all values in range are excluded",
    () => {
      try {
        // Exclude all possible values in range
        randomNumber(1, 3, [1, 2, 3])
        assert.fail("Should throw error when all values are excluded")
      } catch (error) {
        assert.match(
          error.message,
          /Invalid range/,
          "Should throw appropriate error message",
        )
      }
    },
  )

  await t.test("should generate correct distribution", () => {
    // Restore actual Math.random for this test
    Math.random = originalRandom

    // Generate 1000 random numbers between 1-10
    const counts = Array(10).fill(0)
    for (let i = 0; i < 1000; i++) {
      const num = randomNumber(1, 10)
      assert(num >= 1 && num <= 10, "Number should be within range")
      counts[num - 1]++
    }

    // Check that each number appears with roughly 10% frequency (allowing some variance)
    const targetFrequency = 1000 / 10
    for (let i = 0; i < counts.length; i++) {
      const frequency = counts[i]
      // Allow 30% variance from expected frequency
      assert(
        frequency > targetFrequency * 0.7 && frequency < targetFrequency * 1.3,
        `Number ${i + 1} should appear with roughly equal frequency (got ${frequency})`,
      )
    }
  })

  await t.test("should handle edge cases", () => {
    // Test negative ranges
    randomValue = 0.5
    assert.strictEqual(
      randomNumber(-10, -1),
      -5,
      "Should work with negative ranges",
    )

    // Test large ranges
    randomValue = 0.5
    assert.strictEqual(
      randomNumber(1, 1000000),
      500001,
      "Should work with large ranges",
    )

    // Test inverted min/max
    try {
      randomNumber(10, 1)
      assert.fail("Should throw error when min > max")
    } catch (error) {
      assert.match(
        error.message,
        /Invalid range/,
        "Should throw appropriate error message for inverted range",
      )
    }
  })
})
