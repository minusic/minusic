import { test } from "node:test"
import assert from "node:assert"
import { StateHandler } from "../../../src/core/state"
import { MockEventBus } from "../../mocks/EventBus.mock"
import { MockElement } from "../../mocks/HTMLElement.mock"

test("StateHandler", async (t) => {
  let stateHandler: StateHandler
  let mockElement: HTMLElement
  let eventBus: MockEventBus

  // Set up fresh instances before each test
  t.beforeEach(() => {
    mockElement = new MockElement() as unknown as HTMLElement

    eventBus = new MockEventBus()
    stateHandler = new StateHandler(mockElement, eventBus as any)
  })

  await t.test("should initialize with default state", () => {
    // Check default state values
    const state = stateHandler.getState(null as any) as Record<string, any>

    assert.strictEqual(state.playing, false, "playing should default to false")
    assert.strictEqual(state.paused, true, "paused should default to true")
    assert.strictEqual(state.started, false, "started should default to false")
    assert.strictEqual(state.muted, false, "muted should default to false")
    assert.strictEqual(state.random, false, "random should default to false")
    assert.strictEqual(state.controls, true, "controls should default to true")
    assert.strictEqual(state.repeat, 0, "repeat should default to 0")
    assert.strictEqual(state.volume, 1, "volume should default to 1")
    assert.strictEqual(
      state.playbackRate,
      1,
      "playbackRate should default to 1",
    )
  })

  await t.test("should set and get state properly", () => {
    // Set a single state property
    stateHandler.setState({ playing: true })
    assert.strictEqual(
      stateHandler.getState("playing"),
      true,
      "should update playing state",
    )

    // Set multiple state properties
    stateHandler.setState({ volume: 0.5, muted: true, repeat: 2 })

    assert.strictEqual(
      stateHandler.getState("volume"),
      0.5,
      "should update volume",
    )
    assert.strictEqual(
      stateHandler.getState("muted"),
      true,
      "should update muted",
    )
    assert.strictEqual(
      stateHandler.getState("repeat"),
      2,
      "should update repeat",
    )

    // Get the entire state
    const fullState = stateHandler.getState(null as any)
    assert.strictEqual(
      fullState.playing,
      true,
      "full state should contain updated playing value",
    )
    assert.strictEqual(
      fullState.volume,
      0.5,
      "full state should contain updated volume value",
    )
  })

  await t.test("should reflect state in DOM element dataset", () => {
    // Test boolean properties
    stateHandler.setState({ playing: true })
    assert.strictEqual(
      mockElement.dataset.playing,
      "true",
      "should set data-playing attribute",
    )

    stateHandler.setState({ playing: false })
    assert.strictEqual(
      mockElement.dataset.playing,
      undefined,
      "should remove data-playing attribute",
    )

    // Test numeric properties
    stateHandler.setState({ volume: 0.75 })
    assert.strictEqual(
      mockElement.dataset.volume,
      "0.75",
      "should set data-volume attribute",
    )

    // Test multiple properties
    stateHandler.setState({ muted: true, random: true })
    assert.strictEqual(
      mockElement.dataset.muted,
      "true",
      "should set data-muted attribute",
    )
    assert.strictEqual(
      mockElement.dataset.random,
      "true",
      "should set data-random attribute",
    )

    // Test setting to zero (falsy but should be set)
    stateHandler.setState({ repeat: 0 })
    assert.strictEqual(
      mockElement.dataset.repeat,
      "0",
      'should set data-repeat to "0"',
    )
  })

  await t.test("should emit events when state changes", () => {
    // Track events
    let emittedState: Record<string, any> | null = null

    // Set up a spy on the eventBus.emit method
    const originalEmit = eventBus.emit
    eventBus.emit = (event: string, payload: any) => {
      if (event === "stateChange") {
        emittedState = payload
      }
      return originalEmit.call(eventBus, event, payload)
    }

    // Change state
    stateHandler.setState({ playing: true, volume: 0.8 })

    // Verify event was emitted with correct payload
    assert(emittedState !== null, "stateChange event should be emitted")
    assert.strictEqual(
      emittedState!.playing,
      true,
      "event payload should contain playing=true",
    )
    assert.strictEqual(
      emittedState!.volume,
      0.8,
      "event payload should contain volume=0.8",
    )
  })

  await t.test("should handle subscription to state changes", () => {
    let callCount = 0
    let lastState: Record<string, any> | null = null

    // Subscribe to state changes
    const callback = () => {
      callCount++
      lastState = stateHandler.getState(null as any)
    }

    const unsubscribe = stateHandler.subscribe(callback)

    // Change state
    stateHandler.setState({ playing: true })
    assert.strictEqual(callCount, 1, "callback should be called once")
    assert.strictEqual(
      lastState!.playing,
      true,
      "callback should receive updated state",
    )

    // Change state again
    stateHandler.setState({ volume: 0.3 })
    assert.strictEqual(callCount, 2, "callback should be called again")
    assert.strictEqual(
      lastState!.volume,
      0.3,
      "callback should receive newly updated state",
    )

    // Unsubscribe
    unsubscribe()

    // Change state after unsubscribe
    stateHandler.setState({ muted: true })
    assert.strictEqual(
      callCount,
      2,
      "callback should not be called after unsubscribe",
    )

    assert.strictEqual(
      lastState!.muted,
      false,
      "last state should not include muted change",
    )
  })

  await t.test("should handle complex state transitions", () => {
    // Play/pause cycle
    stateHandler.setState({ playing: true, paused: false })
    assert.strictEqual(
      mockElement.dataset.playing,
      "true",
      "should set playing attribute",
    )
    assert.strictEqual(
      mockElement.dataset.paused,
      undefined,
      "should remove paused attribute",
    )

    stateHandler.setState({ playing: false, paused: true })
    assert.strictEqual(
      mockElement.dataset.playing,
      undefined,
      "should remove playing attribute",
    )
    assert.strictEqual(
      mockElement.dataset.paused,
      "true",
      "should set paused attribute",
    )

    // Volume/mute cycle
    stateHandler.setState({ volume: 0.5, muted: false })
    assert.strictEqual(
      mockElement.dataset.volume,
      "0.5",
      "should set volume attribute",
    )
    assert.strictEqual(
      mockElement.dataset.muted,
      undefined,
      "should remove muted attribute",
    )

    stateHandler.setState({ muted: true })
    assert.strictEqual(
      mockElement.dataset.muted,
      "true",
      "should set muted attribute",
    )
    assert.strictEqual(
      mockElement.dataset.volume,
      "0.5",
      "volume should remain unchanged",
    )

    // Repeat cycle (0 -> 1 -> 2 -> 0)
    stateHandler.setState({ repeat: 0 })
    assert.strictEqual(
      mockElement.dataset.repeat,
      "0",
      'should set repeat attribute to "0"',
    )

    stateHandler.setState({ repeat: 1 })
    assert.strictEqual(
      mockElement.dataset.repeat,
      "1",
      'should set repeat attribute to "1"',
    )

    stateHandler.setState({ repeat: 2 })
    assert.strictEqual(
      mockElement.dataset.repeat,
      "2",
      'should set repeat attribute to "2"',
    )
  })

  await t.test("should maintain state integrity during updates", () => {
    // Set initial state
    stateHandler.setState({
      playing: true,
      volume: 0.7,
      repeat: 1,
    })

    // Update just one property
    stateHandler.setState({ volume: 0.3 })

    // Verify other properties remain unchanged
    const state = stateHandler.getState(null as any)
    assert.strictEqual(state.playing, true, "playing should remain unchanged")
    assert.strictEqual(state.volume, 0.3, "volume should be updated")
    assert.strictEqual(state.repeat, 1, "repeat should remain unchanged")

    // Verify dataset attributes are correctly maintained
    assert.strictEqual(
      mockElement.dataset.playing,
      "true",
      "playing attribute should remain",
    )
    assert.strictEqual(
      mockElement.dataset.volume,
      "0.3",
      "volume attribute should be updated",
    )
    assert.strictEqual(
      mockElement.dataset.repeat,
      "1",
      "repeat attribute should remain",
    )
  })

  await t.test("should handle undefined and null values", () => {
    // Set a value then set it to undefined
    stateHandler.setState({ volume: 0.5 })
    assert.strictEqual(
      mockElement.dataset.volume,
      "0.5",
      "volume attribute should be set",
    )

    stateHandler.setState({ volume: undefined })
    assert.strictEqual(
      mockElement.dataset.volume,
      undefined,
      "volume attribute should be removed",
    )

    // Set a value then set it to null
    stateHandler.setState({ repeat: 2 })
    assert.strictEqual(
      mockElement.dataset.repeat,
      "2",
      "repeat attribute should be set",
    )

    stateHandler.setState({ repeat: null as any })
    assert.strictEqual(
      mockElement.dataset.repeat,
      undefined,
      "repeat attribute should be removed",
    )
  })
})
