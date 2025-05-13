import { test } from "node:test"
import assert from "node:assert"
import { formatTime } from "../../../../src/utils/media/timeFormatter"

test("formatTime utility", async (t) => {
  await t.test("should format seconds into MM:SS format correctly", () => {
    // Zero seconds
    assert.strictEqual(
      formatTime(0),
      "0:00",
      "Zero seconds should format as 0:00",
    )

    // Seconds only (less than a minute)
    assert.strictEqual(
      formatTime(45),
      "0:45",
      "Seconds less than a minute should format as 0:SS",
    )

    // Seconds with leading zero
    assert.strictEqual(
      formatTime(5),
      "0:05",
      "Single-digit seconds should have leading zero",
    )

    // Minutes and seconds
    assert.strictEqual(
      formatTime(65),
      "1:05",
      "One minute and 5 seconds should format as 1:05",
    )
    assert.strictEqual(
      formatTime(127),
      "2:07",
      "Two minutes and 7 seconds should format as 2:07",
    )

    // Just under an hour
    assert.strictEqual(
      formatTime(3599),
      "59:59",
      "59 minutes and 59 seconds should format as 59:59",
    )
  })

  await t.test("should format hours correctly in H:MM:SS format", () => {
    // Exactly one hour
    assert.strictEqual(
      formatTime(3600),
      "1:00:00",
      "One hour should format as 1:00:00",
    )

    // Hour with minutes and seconds
    assert.strictEqual(
      formatTime(3723),
      "1:02:03",
      "1 hour, 2 minutes, 3 seconds should format as 1:02:03",
    )

    // Multiple hours
    assert.strictEqual(
      formatTime(7890),
      "2:11:30",
      "2 hours, 11 minutes, 30 seconds should format as 2:11:30",
    )

    // Hours with leading zeros for minutes and seconds
    assert.strictEqual(
      formatTime(3661),
      "1:01:01",
      "1 hour, 1 minute, 1 second should format as 1:01:01",
    )
  })

  await t.test("should handle edge cases", () => {
    // Negative time (should be treated as 0)
    assert.strictEqual(
      formatTime(-10),
      "0:00",
      "Negative seconds should be formatted as 0:00",
    )

    // Decimal seconds (should be rounded)
    assert.strictEqual(
      formatTime(61.7),
      "1:02",
      "Decimal seconds should be rounded",
    )
    assert.strictEqual(
      formatTime(59.2),
      "0:59",
      "Decimal seconds should be rounded",
    )

    // Very large values
    assert.strictEqual(
      formatTime(86400),
      "24:00:00",
      "24 hours should format as 24:00:00",
    )

    // Undefined/missing input (defaults to 0)
    assert.strictEqual(
      formatTime(),
      "0:00",
      "Undefined input should default to 0:00",
    )

    // NaN
    assert.strictEqual(
      formatTime(NaN),
      "0:00",
      "NaN should be formatted as 0:00",
    )
  })
})
