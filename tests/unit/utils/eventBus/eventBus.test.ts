import { test } from "node:test"
import assert from "node:assert"
import { EventBus } from "../../../../src/utils/eventBus/eventBus"

test("EventBus", async (t) => {
  let eventBus: EventBus

  // Set up a fresh EventBus instance before each test
  t.beforeEach(() => {
    eventBus = new EventBus()
  })

  await t.test("should register event handlers with on()", () => {
    const handler = () => {}
    eventBus.on("test", handler)

    // Access private listeners Map using type assertion for testing
    const listeners = (eventBus as any).listeners
    assert(listeners.has("test"), "Event should be registered")
    assert(listeners.get("test").has(handler), "Handler should be registered")
  })

  await t.test(
    "should call registered handlers when events are emitted",
    () => {
      // Create handlers with counters to track calls
      let counter1 = 0
      let counter2 = 0
      let payload1: any
      let payload2: any

      const handler1 = (data: any) => {
        counter1++
        payload1 = data
      }

      const handler2 = (data: any) => {
        counter2++
        payload2 = data
      }

      // Register multiple handlers for the same event
      eventBus.on("test", handler1)
      eventBus.on("test", handler2)

      // Emit event with payload
      const testPayload = { value: "test-data" }
      eventBus.emit("test", testPayload)

      // Verify both handlers were called with the payload
      assert.strictEqual(counter1, 1, "First handler should be called once")
      assert.strictEqual(counter2, 1, "Second handler should be called once")
      assert.deepStrictEqual(
        payload1,
        testPayload,
        "First handler should receive payload",
      )
      assert.deepStrictEqual(
        payload2,
        testPayload,
        "Second handler should receive payload",
      )

      // Emit again to verify handlers are called multiple times
      eventBus.emit("test", "second call")
      assert.strictEqual(counter1, 2, "First handler should be called again")
      assert.strictEqual(counter2, 2, "Second handler should be called again")
    },
  )

  await t.test("should not call handlers for different events", () => {
    let counter = 0
    const handler = () => {
      counter++
    }

    eventBus.on("event1", handler)
    eventBus.emit("event2", {})

    assert.strictEqual(
      counter,
      0,
      "Handler should not be called for different events",
    )
  })

  await t.test("should remove handlers with off()", () => {
    let counter = 0
    const handler = () => {
      counter++
    }

    // Register and then remove handler
    eventBus.on("test", handler)
    eventBus.off("test", handler)
    eventBus.emit("test", {})

    assert.strictEqual(counter, 0, "Removed handler should not be called")

    // Verify it doesn't affect other handlers
    let counter2 = 0
    const handler2 = () => {
      counter2++
    }

    eventBus.on("test", handler2)
    eventBus.off("test", handler) // Remove already-removed handler
    eventBus.emit("test", {})

    assert.strictEqual(counter2, 1, "Other handlers should still be called")
  })

  await t.test("should register one-time handlers with once()", () => {
    let counter = 0
    let lastPayload: any
    const handler = (data: any) => {
      counter++
      lastPayload = data
    }

    // Register one-time handler
    eventBus.once("test", handler)

    // First emission should trigger handler
    eventBus.emit("test", "first")
    assert.strictEqual(counter, 1, "Handler should be called once")
    assert.strictEqual(lastPayload, "first", "Handler should receive payload")

    // Second emission should not trigger handler
    eventBus.emit("test", "second")
    assert.strictEqual(counter, 1, "Handler should not be called again")
    assert.strictEqual(lastPayload, "first", "Payload should not change")
  })

  await t.test(
    "should support multiple events and handler removal edge cases",
    () => {
      let counters = {
        event1: 0,
        event2: 0,
        event3: 0,
      }

      const handler1 = () => {
        counters.event1++
      }
      const handler2 = () => {
        counters.event2++
      }
      const handler3 = () => {
        counters.event3++
      }

      // Register handlers for different events
      eventBus.on("event1", handler1)
      eventBus.on("event2", handler2)
      eventBus.on("event3", handler3)

      // Basic functionality check
      eventBus.emit("event1", {})
      eventBus.emit("event2", {})
      eventBus.emit("event3", {})

      assert.deepStrictEqual(
        counters,
        {
          event1: 1,
          event2: 1,
          event3: 1,
        },
        "All handlers should be called once",
      )

      // Edge case: removing handler for event that doesn't exist
      eventBus.off("nonexistent", handler1)

      // Edge case: removing handler that isn't registered
      const unregisteredHandler = () => {}
      eventBus.off("event1", unregisteredHandler)

      // Verify functionality still works
      eventBus.emit("event1", {})
      assert.strictEqual(
        counters.event1,
        2,
        "Handler should still work after edge cases",
      )
    },
  )

  await t.test("should handle complex usage patterns", () => {
    let results: string[] = []

    // Handler that registers another handler
    const handler1 = () => {
      results.push("handler1")
      eventBus.on("event2", handler3)
    }

    // Handler that unregisters itself
    const handler2 = () => {
      results.push("handler2")
      eventBus.off("event1", handler2)
    }

    // Handler that emits another event
    const handler3 = () => {
      results.push("handler3")
      eventBus.emit("event3", {})
    }

    // Handler for the cascaded event
    const handler4 = () => {
      results.push("handler4")
    }

    // Set up handlers
    eventBus.on("event1", handler1)
    eventBus.on("event1", handler2)
    eventBus.on("event3", handler4)

    // First emission
    eventBus.emit("event1", {})
    assert.deepStrictEqual(
      results,
      ["handler1", "handler2"],
      "Both handlers should be called on first emission",
    )

    // Second emission - handler2 should have unregistered itself
    results = []
    eventBus.emit("event1", {})
    eventBus.emit("event2", {})

    assert.deepStrictEqual(
      results,
      ["handler1", "handler3", "handler4"],
      "Complex chain of events should work correctly",
    )
  })

  await t.test("should handle typed events correctly", () => {
    interface UserEvent {
      id: number
      name: string
    }

    let receivedUser: UserEvent | null = null

    // Typed handler
    const userHandler = (user: UserEvent) => {
      receivedUser = user
    }

    eventBus.on<UserEvent>("userEvent", userHandler)

    const user: UserEvent = { id: 1, name: "John" }
    eventBus.emit("userEvent", user)

    assert.deepStrictEqual(
      receivedUser,
      user,
      "Should handle typed payloads correctly",
    )
  })
})
