import { test, describe, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { PlaybackController } from "../../../src/core/playbackController"
import { EventBus } from "../../../src/utils/eventBus/eventBus.js"
import { StateHandler } from "../../../src/core/state.js"
import { MockStateHandler } from "../../mocks/StateHandler.mock.js"

// Mock HTMLMediaElement
class MockMediaElement {
  private _currentTime = 0
  private _duration = 100
  private _volume = 1
  private _muted = false
  private _paused = true
  private _playbackRate = 1
  private _preservesPitch = true
  private _buffered: MockTimeRanges

  constructor() {
    this._buffered = new MockTimeRanges([{ start: 0, end: 50 }]) // Mock 50% buffered
  }

  // Playback state
  get paused() {
    return this._paused
  }
  get currentTime() {
    return this._currentTime
  }
  set currentTime(value: number) {
    this._currentTime = Math.max(0, Math.min(value, this._duration))
  }
  get duration() {
    return this._duration
  }
  set duration(value: number) {
    this._duration = value
  }

  // Volume
  get volume() {
    return this._volume
  }
  set volume(value: number) {
    this._volume = Math.max(0, Math.min(1, value))
  }
  get muted() {
    return this._muted
  }
  set muted(value: boolean) {
    this._muted = value
  }

  // Playback rate
  get playbackRate() {
    return this._playbackRate
  }
  set playbackRate(value: number) {
    this._playbackRate = value
  }
  get preservesPitch() {
    return this._preservesPitch
  }
  set preservesPitch(value: boolean) {
    this._preservesPitch = value
  }

  // Buffered
  get buffered() {
    return this._buffered
  }

  // Methods
  async play(): Promise<void> {
    this._paused = false
    return Promise.resolve()
  }

  pause(): void {
    this._paused = true
  }

  // Test helpers
  setDuration(duration: number) {
    this._duration = duration
  }

  setBuffered(ranges: Array<{ start: number; end: number }>) {
    this._buffered = new MockTimeRanges(ranges)
  }

  simulatePlayError() {
    this.play = async () => {
      throw new Error("Play failed - user interaction required")
    }
  }

  resetPlayMethod() {
    this.play = async () => {
      this._paused = false
      return Promise.resolve()
    }
  }
}

// Mock TimeRanges
class MockTimeRanges {
  private ranges: Array<{ start: number; end: number }>

  constructor(ranges: Array<{ start: number; end: number }> = []) {
    this.ranges = ranges
  }

  get length() {
    return this.ranges.length
  }

  start(index: number): number {
    if (index >= 0 && index < this.ranges.length) {
      return this.ranges[index].start
    }
    throw new Error("Index out of range")
  }

  end(index: number): number {
    if (index >= 0 && index < this.ranges.length) {
      return this.ranges[index].end
    }
    throw new Error("Index out of range")
  }
}

// Mock EventBus
class MockEventBus extends EventBus {
  public emittedEvents: Array<{ event: string; payload?: any }> = []

  emit<T = any>(event: string, payload?: T): void {
    this.emittedEvents.push({ event, payload })
    super.emit(event, payload)
  }

  clearEvents() {
    this.emittedEvents = []
  }

  getEmittedEvents(eventName?: string) {
    if (eventName) {
      return this.emittedEvents.filter((e) => e.event === eventName)
    }
    return this.emittedEvents
  }
}

describe("PlaybackController", () => {
  let playbackController: PlaybackController
  let mockMedia: MockMediaElement
  let mockEventBus: MockEventBus
  let mockState: MockStateHandler
  let mockContainer: HTMLElement

  beforeEach(() => {
    mockMedia = new MockMediaElement()
    mockEventBus = new MockEventBus()

    // Create a minimal mock container for StateHandler
    mockContainer = {
      dataset: {},
      setAttribute: () => {},
      removeAttribute: () => {},
    } as any

    mockState = new MockStateHandler(mockContainer, mockEventBus)

    playbackController = new PlaybackController(
      mockMedia as any,
      mockEventBus,
      mockState,
      15, // skipDuration
    )
  })

  afterEach(() => {
    mockEventBus.clearEvents()
    mockState.clearStateChanges()
  })

  describe("Basic Playback Control", () => {
    test("should play media successfully", async () => {
      await playbackController.play()

      assert.strictEqual(mockMedia.paused, false)
    })

    test("should handle play errors gracefully", async () => {
      mockMedia.simulatePlayError()

      try {
        await playbackController.play()
        assert.fail("Should have thrown an error")
      } catch (error) {
        assert.ok(error instanceof Error)
        assert.ok(error.message.includes("Play failed"))
      }
    })

    test("should pause media", () => {
      mockMedia.pause = function () {
        this._paused = true
      }.bind(mockMedia)

      playbackController.pause()

      assert.strictEqual(mockMedia.paused, true)
    })

    test("should stop media and reset time", () => {
      mockMedia.currentTime = 50

      playbackController.stop()

      assert.strictEqual(mockMedia.paused, true)
      assert.strictEqual(mockMedia.currentTime, 0)
    })

    test("should restart media from beginning", async () => {
      mockMedia.currentTime = 50

      await playbackController.restart()

      assert.strictEqual(mockMedia.currentTime, 0)
      assert.strictEqual(mockMedia.paused, false)
    })
  })

  describe("Toggle Play Functionality", () => {
    test("should toggle from paused to playing", async () => {
      mockMedia._paused = true

      await playbackController.togglePlay()

      assert.strictEqual(mockMedia.paused, false)
    })

    test("should toggle from playing to paused", () => {
      mockMedia._paused = false

      playbackController.togglePlay()

      assert.strictEqual(mockMedia.paused, true)
    })

    test("should respect explicit state parameter - play", async () => {
      mockMedia._paused = true

      await playbackController.togglePlay(true)

      assert.strictEqual(mockMedia.paused, false)
    })

    test("should respect explicit state parameter - pause", () => {
      mockMedia._paused = false

      playbackController.togglePlay(false)

      assert.strictEqual(mockMedia.paused, true)
    })

    test("should handle play errors in toggle", async () => {
      mockMedia._paused = true
      mockMedia.simulatePlayError()

      try {
        await playbackController.togglePlay(true)
        assert.fail("Should have thrown an error")
      } catch (error) {
        assert.ok(error instanceof Error)
      }
    })
  })

  describe("Time Control", () => {
    test("should get current time", () => {
      mockMedia.currentTime = 45.5

      const currentTime = playbackController.currentTime

      assert.strictEqual(currentTime, 45.5)
    })

    test("should set current time within bounds", () => {
      mockMedia.setDuration(100)

      playbackController.currentTime = 50

      assert.strictEqual(mockMedia.currentTime, 50)
    })

    test("should bound current time to minimum (0)", () => {
      mockMedia.setDuration(100)

      playbackController.currentTime = -10

      assert.strictEqual(mockMedia.currentTime, 0)
    })

    test("should bound current time to maximum (duration)", () => {
      mockMedia.setDuration(100)

      playbackController.currentTime = 150

      assert.strictEqual(mockMedia.currentTime, 100)
    })

    test("should get duration", () => {
      mockMedia.setDuration(120.75)

      const duration = playbackController.duration

      assert.strictEqual(duration, 120.75)
    })

    test("should handle invalid duration", () => {
      mockMedia._duration = NaN

      const duration = playbackController.duration

      assert.strictEqual(duration, 0)
    })

    test("should handle infinite duration", () => {
      mockMedia._duration = Infinity

      const duration = playbackController.duration

      assert.strictEqual(duration, 0)
    })
  })

  describe("Skip Controls", () => {
    test("should skip backward by default duration", () => {
      mockMedia.currentTime = 30

      playbackController.backward()

      assert.strictEqual(mockMedia.currentTime, 15) // 30 - 15
    })

    test("should not skip backward below 0", () => {
      mockMedia.currentTime = 10

      playbackController.backward()

      assert.strictEqual(mockMedia.currentTime, 0)
    })

    test("should skip forward by default duration", () => {
      mockMedia.currentTime = 30
      mockMedia.setDuration(100)

      playbackController.forward()

      assert.strictEqual(mockMedia.currentTime, 45) // 30 + 15
    })

    test("should not skip forward beyond duration", () => {
      mockMedia.currentTime = 90
      mockMedia.setDuration(100)

      playbackController.forward()

      assert.strictEqual(mockMedia.currentTime, 100)
    })

    test("should use custom skip duration", () => {
      const customController = new PlaybackController(
        mockMedia as any,
        mockEventBus,
        mockState,
        30, // Custom skip duration
      )

      mockMedia.currentTime = 50

      customController.backward()

      assert.strictEqual(mockMedia.currentTime, 20) // 50 - 30
    })
  })

  describe("Playback Rate Control", () => {
    test("should get playback rate", () => {
      mockMedia.playbackRate = 1.5

      const rate = playbackController.playbackRate

      assert.strictEqual(rate, 1.5)
    })

    test("should set playback rate", () => {
      playbackController.playbackRate = 2.0

      assert.strictEqual(mockMedia.playbackRate, 2.0)
    })

    test("should set preserves pitch", () => {
      playbackController.preservesPitch = false

      assert.strictEqual(mockMedia.preservesPitch, false)
    })

    test("should handle various playback rates", () => {
      const rates = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0]

      rates.forEach((rate) => {
        playbackController.playbackRate = rate
        assert.strictEqual(mockMedia.playbackRate, rate)
      })
    })
  })

  describe("Buffer and Progress Information", () => {
    test("should get buffered end time", () => {
      mockMedia.setBuffered([{ start: 0, end: 60 }])

      const buffered = playbackController.buffered

      assert.strictEqual(buffered, 60)
    })

    test("should handle no buffered ranges", () => {
      mockMedia.setBuffered([])

      const buffered = playbackController.buffered

      assert.strictEqual(buffered, 0)
    })

    test("should calculate progress percentage", () => {
      mockMedia.setDuration(100)
      mockMedia.currentTime = 25

      const progress = playbackController.progress

      assert.strictEqual(progress, 25)
    })

    test("should handle zero duration for progress", () => {
      mockMedia.setDuration(0)
      mockMedia.currentTime = 10

      const progress = playbackController.progress

      assert.strictEqual(progress, 0)
    })

    test("should calculate buffer percentage", () => {
      mockMedia.setDuration(100)
      mockMedia.setBuffered([{ start: 0, end: 40 }])

      const buffer = playbackController.buffer

      assert.strictEqual(buffer, 40)
    })

    test("should handle zero duration for buffer", () => {
      mockMedia.setDuration(0)
      mockMedia.setBuffered([{ start: 0, end: 50 }])

      const buffer = playbackController.buffer

      assert.strictEqual(buffer, 0)
    })

    test("should handle multiple buffered ranges", () => {
      mockMedia.setBuffered([
        { start: 0, end: 30 },
        { start: 50, end: 80 },
      ])

      const buffered = playbackController.buffered

      // Should return the end of the first range
      assert.strictEqual(buffered, 30)
    })
  })

  describe("State Properties", () => {
    test("should get paused state", () => {
      mockMedia._paused = true
      assert.strictEqual(playbackController.paused, true)

      mockMedia._paused = false
      assert.strictEqual(playbackController.paused, false)
    })

    test("should handle edge cases in progress calculation", () => {
      // Test with NaN duration
      mockMedia._duration = NaN
      mockMedia.currentTime = 50
      assert.strictEqual(playbackController.progress, 0)

      // Test with Infinity duration
      mockMedia._duration = Infinity
      assert.strictEqual(playbackController.progress, 0)

      // Test with negative current time
      mockMedia.setDuration(100)
      mockMedia._currentTime = -10
      const progress = playbackController.progress
      assert.ok(progress >= 0)
    })
  })

  describe("Time Bounds Validation", () => {
    test("should handle current time setter edge cases", () => {
      mockMedia.setDuration(100)

      // Test NaN
      playbackController.currentTime = NaN
      assert.ok(!isNaN(mockMedia.currentTime))

      // Test very large number
      playbackController.currentTime = 1e6
      assert.strictEqual(mockMedia.currentTime, 100)

      // Test very small negative number
      playbackController.currentTime = -1e6
      assert.strictEqual(mockMedia.currentTime, 0)
    })

    test("should handle skip operations with edge durations", () => {
      // Test with very short duration
      mockMedia.setDuration(5)
      mockMedia.currentTime = 2

      playbackController.forward()
      assert.strictEqual(mockMedia.currentTime, 5)

      playbackController.backward()
      assert.strictEqual(mockMedia.currentTime, 0)
    })

    test("should handle skip operations with zero duration", () => {
      mockMedia.setDuration(0)
      mockMedia.currentTime = 0

      playbackController.forward()
      assert.strictEqual(mockMedia.currentTime, 0)

      playbackController.backward()
      assert.strictEqual(mockMedia.currentTime, 0)
    })
  })

  describe("Integration Scenarios", () => {
    test("should handle rapid play/pause cycles", async () => {
      for (let i = 0; i < 10; i++) {
        await playbackController.play()
        assert.strictEqual(mockMedia.paused, false)

        playbackController.pause()
        assert.strictEqual(mockMedia.paused, true)
      }
    })

    test("should handle rapid time changes", () => {
      mockMedia.setDuration(100)

      const times = [0, 25, 50, 75, 100, 0, 50]
      times.forEach((time) => {
        playbackController.currentTime = time
        assert.strictEqual(mockMedia.currentTime, time)
      })
    })

    test("should handle multiple skip operations", () => {
      mockMedia.setDuration(100)
      mockMedia.currentTime = 50

      // Multiple forward skips
      playbackController.forward() // 65
      playbackController.forward() // 80
      playbackController.forward() // 95
      playbackController.forward() // 100 (capped)

      assert.strictEqual(mockMedia.currentTime, 100)

      // Multiple backward skips
      playbackController.backward() // 85
      playbackController.backward() // 70
      playbackController.backward() // 55

      assert.strictEqual(mockMedia.currentTime, 55)
    })

    test("should handle playback rate changes during playback", async () => {
      await playbackController.play()

      const rates = [0.5, 1.0, 1.5, 2.0, 0.75]
      rates.forEach((rate) => {
        playbackController.playbackRate = rate
        assert.strictEqual(mockMedia.playbackRate, rate)
        assert.strictEqual(mockMedia.paused, false) // Should remain playing
      })
    })

    test("should maintain consistency during complex operations", async () => {
      mockMedia.setDuration(120)

      // Start playback
      await playbackController.play()
      assert.strictEqual(mockMedia.paused, false)

      // Change time and rate
      playbackController.currentTime = 30
      playbackController.playbackRate = 1.5

      // Skip around
      playbackController.forward() // 45
      playbackController.backward() // 30

      // Stop and restart
      playbackController.stop()
      assert.strictEqual(mockMedia.currentTime, 0)
      assert.strictEqual(mockMedia.paused, true)

      await playbackController.restart()
      assert.strictEqual(mockMedia.currentTime, 0)
      assert.strictEqual(mockMedia.paused, false)
      assert.strictEqual(mockMedia.playbackRate, 1.5) // Rate preserved
    })
  })

  describe("Error Handling", () => {
    test("should handle play promise rejection", async () => {
      mockMedia.play = async () => {
        throw new Error("Autoplay prevented")
      }

      try {
        await playbackController.play()
        assert.fail("Should have thrown")
      } catch (error) {
        assert.ok(error instanceof Error)
        assert.strictEqual(error.message, "Autoplay prevented")
      }
    })

    test("should handle invalid playback rates gracefully", () => {
      // The controller doesn't validate rates, but media element might
      const invalidRates = [0, -1, Infinity, NaN]

      invalidRates.forEach((rate) => {
        playbackController.playbackRate = rate
        // Just verify it doesn't throw
        assert.ok(typeof mockMedia.playbackRate === "number")
      })
    })

    test("should handle corrupted time values", () => {
      mockMedia.setDuration(100)

      // Simulate corrupted values that might come from media element
      mockMedia._currentTime = Infinity
      const time1 = playbackController.currentTime
      assert.ok(isFinite(time1))

      mockMedia._currentTime = -Infinity
      const time2 = playbackController.currentTime
      assert.ok(isFinite(time2))
    })
  })
})
