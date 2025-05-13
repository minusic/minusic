import { test } from "node:test"
import assert from "node:assert"
import { bound } from "../../../../src/utils/math/bounds"

test("bound utility", async (t) => {
  await t.test("should constrain value within min and max", () => {
    // Constrain a value that's already within bounds
    assert.strictEqual(
      bound(5, 0, 10),
      5,
      "Value within bounds should remain unchanged",
    )

    // Constrain a value that's below minimum
    assert.strictEqual(
      bound(-5, 0, 10),
      0,
      "Value below minimum should be set to minimum",
    )

    // Constrain a value that's above maximum
    assert.strictEqual(
      bound(15, 0, 10),
      10,
      "Value above maximum should be set to maximum",
    )

    // Constrain a value when min and max are the same
    assert.strictEqual(
      bound(7, 5, 5),
      5,
      "When min equals max, value should be set to that value",
    )

    // Test with floating point numbers
    assert.strictEqual(
      bound(3.5, 1.5, 5.5),
      3.5,
      "Should work with floating point numbers",
    )

    // Edge cases
    assert.strictEqual(
      bound(0, 0, 10),
      0,
      "Value equal to minimum should remain unchanged",
    )
    assert.strictEqual(
      bound(10, 0, 10),
      10,
      "Value equal to maximum should remain unchanged",
    )
  })

  await t.test("should handle inverted min/max arguments", () => {
    // When min is greater than max, bound should still return a value within
    // the range, treating the smaller value as the minimum
    assert.strictEqual(
      bound(5, 10, 0),
      5,
      "Should handle min greater than max by using min as upper bound",
    )
    assert.strictEqual(
      bound(15, 10, 0),
      10,
      "Should constrain to smaller of min/max when they are inverted",
    )
    assert.strictEqual(
      bound(-5, 10, 0),
      0,
      "Should constrain to larger of min/max when they are inverted",
    )
  })

  await t.test("should handle edge cases with non-number inputs", () => {
    // Handle NaN values (should return the minimum value as a fallback)
    assert.strictEqual(
      bound(NaN, 0, 10),
      0,
      "NaN should be constrained to minimum",
    )

    // Handle Infinity values
    assert.strictEqual(
      bound(Infinity, 0, 10),
      10,
      "Positive Infinity should be constrained to maximum",
    )
    assert.strictEqual(
      bound(-Infinity, 0, 10),
      0,
      "Negative Infinity should be constrained to minimum",
    )
  })
})
