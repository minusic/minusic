import { test, describe, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { VolumeController } from "../../../src/core/volumeController.js"
import { StateHandler } from "../../../src/core/state.js"
import { EventBus } from "../../../src/utils/eventBus/eventBus.js"
import { Elements } from "../../../src/types.js"
import { MockEventBus } from "../../mocks/EventBus.mock.js"

// Mock HTMLMediaElement
class MockMediaElement {
  private _volume = 1
  private _muted = false

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

  // Test helpers
  reset() {
    this._volume = 1
    this._muted = false
  }
}

// Mock Range/CircularRange for sound bar
class MockSoundBar {
  private _value = 1
  public valueChanges: number[] = []

  get value() {
    return this._value
  }
  set value(newValue: number) {
    this._value = newValue
    this.valueChanges.push(newValue)
  }

  reset() {
    this._value = 1
    this.valueChanges = []
  }
}

// Mock Elements
class MockElements {
  public soundBar: MockSoundBar | null = null

  constructor(includeSoundBar: boolean = true) {
    if (includeSoundBar) {
      this.soundBar = new MockSoundBar()
    }
  }

  reset() {
    if (this.soundBar) {
      this.soundBar.reset()
    }
  }
}

// Mock StateHandler
class MockStateHandler extends StateHandler {
  public stateChanges: any[] = []

  setState(changes: any) {
    this.stateChanges.push(changes)
    super.setState(changes)
  }

  clearStateChanges() {
    this.stateChanges = []
  }

  getLastStateChange() {
    return this.stateChanges[this.stateChanges.length - 1]
  }
}

describe("VolumeController", () => {
  let volumeController: VolumeController
  let mockMedia: MockMediaElement
  let mockElements: MockElements
  let mockState: MockStateHandler
  let mockEventBus: MockEventBus
  let mockContainer: HTMLElement

  beforeEach(() => {
    mockMedia = new MockMediaElement()
    mockElements = new MockElements(true) // Include sound bar
    mockEventBus = new MockEventBus()

    // Create a minimal mock container for StateHandler
    mockContainer = {
      dataset: {},
      setAttribute: () => {},
      removeAttribute: () => {},
    } as any

    mockState = new MockStateHandler(mockContainer, mockEventBus)

    volumeController = new VolumeController(
      mockMedia as any,
      mockElements as any,
      mockState,
    )
  })

  afterEach(() => {
    mockMedia.reset()
    mockElements.reset()
    mockState.clearStateChanges()
    mockEventBus.clearEvents()
  })

  describe("Basic Volume Control", () => {
    test("should get current volume", () => {
      mockMedia.volume = 0.7

      const volume = volumeController.volume

      assert.strictEqual(volume, 0.7)
    })

    test("should set volume within valid range", () => {
      volumeController.volume = 0.5

      assert.strictEqual(mockMedia.volume, 0.5)
    })

    test("should bound volume to minimum (0)", () => {
      volumeController.volume = -0.5

      assert.strictEqual(mockMedia.volume, 0)
    })

    test("should bound volume to maximum (1)", () => {
      volumeController.volume = 1.5

      assert.strictEqual(mockMedia.volume, 1)
    })

    test("should update sound bar when setting volume", () => {
      volumeController.volume = 0.8

      assert.strictEqual(mockElements.soundBar!.value, 0.8)
      assert.strictEqual(mockElements.soundBar!.valueChanges.length, 1)
    })

    test("should handle volume change when no sound bar present", () => {
      const elementsWithoutSoundBar = new MockElements(false)
      const controller = new VolumeController(
        mockMedia as any,
        elementsWithoutSoundBar as any,
        mockState,
      )

      // Should not throw
      controller.volume = 0.6
      assert.strictEqual(mockMedia.volume, 0.6)
    })

    test("should handle edge volume values", () => {
      const edgeValues = [0, 0.001, 0.5, 0.999, 1]

      edgeValues.forEach((value) => {
        volumeController.volume = value
        assert.strictEqual(mockMedia.volume, value)
        assert.strictEqual(mockElements.soundBar!.value, value)
      })
    })
  })

  describe("Mute Functionality", () => {
    test("should mute audio", () => {
      volumeController.mute()

      assert.strictEqual(mockMedia.muted, true)
      assert.strictEqual(mockElements.soundBar!.value, 0)
    })

    test("should update state when muting", () => {
      volumeController.mute()

      const stateChange = mockState.getLastStateChange()
      assert.strictEqual(stateChange.muted, true)
    })

    test("should unmute audio", () => {
      mockMedia.muted = true

      volumeController.unmute()

      assert.strictEqual(mockMedia.muted, false)
    })

    test("should update state when unmuting", () => {
      volumeController.unmute()

      const stateChange = mockState.getLastStateChange()
      assert.strictEqual(stateChange.muted, false)
    })

    test("should restore volume when unmuting from zero volume", () => {
      mockMedia.volume = 0
      mockMedia.muted = true

      volumeController.unmute()

      assert.strictEqual(mockMedia.volume, 1)
      assert.strictEqual(mockElements.soundBar!.value, 1)
    })

    test("should update sound bar when unmuting", () => {
      mockMedia.volume = 0.7
      mockMedia.muted = true

      volumeController.unmute()

      assert.strictEqual(mockElements.soundBar!.value, 0.7)
    })

    test("should handle mute without sound bar", () => {
      const elementsWithoutSoundBar = new MockElements(false)
      const controller = new VolumeController(
        mockMedia as any,
        elementsWithoutSoundBar as any,
        mockState,
      )

      // Should not throw
      controller.mute()
      assert.strictEqual(mockMedia.muted, true)

      controller.unmute()
      assert.strictEqual(mockMedia.muted, false)
    })
  })

  describe("Toggle Mute Functionality", () => {
    test("should toggle from unmuted to muted", () => {
      mockMedia.muted = false

      volumeController.toggleMute()

      assert.strictEqual(mockMedia.muted, true)
    })

    test("should toggle from muted to unmuted", () => {
      mockMedia.muted = true

      volumeController.toggleMute()

      assert.strictEqual(mockMedia.muted, false)
    })

    test("should respect explicit state parameter - mute", () => {
      mockMedia.muted = false

      volumeController.toggleMute(false) // false means mute

      assert.strictEqual(mockMedia.muted, true)
    })

    test("should respect explicit state parameter - unmute", () => {
      mockMedia.muted = true

      volumeController.toggleMute(true) // true means unmute

      assert.strictEqual(mockMedia.muted, false)
    })

    test("should handle multiple rapid toggles", () => {
      const initialMuted = mockMedia.muted

      for (let i = 0; i < 10; i++) {
        volumeController.toggleMute()
      }

      // Should be same as initial state (even number of toggles)
      assert.strictEqual(mockMedia.muted, initialMuted)
    })
  })

  describe("Muted State Detection", () => {
    test("should detect muted state from media.muted", () => {
      mockMedia.muted = true
      mockMedia.volume = 0.5

      assert.strictEqual(volumeController.muted, true)
    })

    test("should detect muted state from zero volume", () => {
      mockMedia.muted = false
      mockMedia.volume = 0

      assert.strictEqual(volumeController.muted, true)
    })

    test("should detect unmuted state", () => {
      mockMedia.muted = false
      mockMedia.volume = 0.5

      assert.strictEqual(volumeController.muted, false)
    })

    test("should prioritize media.muted over volume", () => {
      mockMedia.muted = true
      mockMedia.volume = 1 // High volume but muted

      assert.strictEqual(volumeController.muted, true)
    })
  })

  describe("Auto-unmute on Volume Change", () => {
    test("should unmute when setting non-zero volume while muted", () => {
      mockMedia.muted = true
      mockMedia.volume = 0

      volumeController.volume = 0.5

      assert.strictEqual(mockMedia.muted, false)
    })

    test("should not change mute state when setting zero volume", () => {
      mockMedia.muted = true

      volumeController.volume = 0

      assert.strictEqual(mockMedia.muted, true)
    })

    test("should not change mute state when already unmuted", () => {
      mockMedia.muted = false
      mockMedia.volume = 0.3

      volumeController.volume = 0.7

      assert.strictEqual(mockMedia.muted, false)
    })

    test("should handle edge case of very small volume values", () => {
      mockMedia.muted = true

      volumeController.volume = 0.001

      assert.strictEqual(mockMedia.muted, false)
    })
  })

  describe("Initial Volume Setup", () => {
    test("should set initial volume without muting", () => {
      volumeController.setInitialVolume(0.8, false)

      assert.strictEqual(mockMedia.volume, 0.8)
      assert.strictEqual(mockMedia.muted, false)
      assert.strictEqual(mockElements.soundBar!.value, 0.8)
    })

    test("should set initial volume with muting", () => {
      volumeController.setInitialVolume(0.6, true)

      assert.strictEqual(mockMedia.volume, 0.6)
      assert.strictEqual(mockMedia.muted, true)
      assert.strictEqual(mockElements.soundBar!.value, 0)
    })

    test("should use default volume when not specified", () => {
      volumeController.setInitialVolume()

      assert.strictEqual(mockMedia.volume, 1)
      assert.strictEqual(mockMedia.muted, false)
    })

    test("should bound initial volume values", () => {
      volumeController.setInitialVolume(1.5, false)
      assert.strictEqual(mockMedia.volume, 1)

      volumeController.setInitialVolume(-0.2, false)
      assert.strictEqual(mockMedia.volume, 0)
    })

    test("should handle initial volume with no sound bar", () => {
      const elementsWithoutSoundBar = new MockElements(false)
      const controller = new VolumeController(
        mockMedia as any,
        elementsWithoutSoundBar as any,
        mockState,
      )

      // Should not throw
      controller.setInitialVolume(0.7, false)
      assert.strictEqual(mockMedia.volume, 0.7)
    })
  })

  describe("Sound Bar Synchronization", () => {
    test("should sync sound bar value when volume changes", () => {
      const volumes = [0, 0.25, 0.5, 0.75, 1]

      volumes.forEach((volume) => {
        volumeController.volume = volume
        assert.strictEqual(mockElements.soundBar!.value, volume)
      })
    })

    test("should set sound bar to 0 when muting", () => {
      mockElements.soundBar!.value = 0.8

      volumeController.mute()

      assert.strictEqual(mockElements.soundBar!.value, 0)
    })

    test("should restore sound bar value when unmuting", () => {
      mockMedia.volume = 0.6

      volumeController.unmute()

      assert.strictEqual(mockElements.soundBar!.value, 0.6)
    })

    test("should track all sound bar value changes", () => {
      volumeController.volume = 0.3
      volumeController.mute()
      volumeController.unmute()
      volumeController.volume = 0.8

      const changes = mockElements.soundBar!.valueChanges
      assert.strictEqual(changes.length, 4)
      assert.strictEqual(changes[0], 0.3)
      assert.strictEqual(changes[1], 0) // mute
      assert.strictEqual(changes[2], 0.3) // unmute
      assert.strictEqual(changes[3], 0.8) // new volume
    })
  })

  describe("State Management Integration", () => {
    test("should update state when muting", () => {
      volumeController.mute()

      const stateChanges = mockState.stateChanges
      assert.strictEqual(stateChanges.length, 1)
      assert.strictEqual(stateChanges[0].muted, true)
    })

    test("should update state when unmuting", () => {
      volumeController.unmute()

      const stateChanges = mockState.stateChanges
      assert.strictEqual(stateChanges.length, 1)
      assert.strictEqual(stateChanges[0].muted, false)
    })

    test("should track multiple state changes", () => {
      volumeController.mute()
      volumeController.unmute()
      volumeController.toggleMute()

      const stateChanges = mockState.stateChanges
      assert.strictEqual(stateChanges.length, 3)
      assert.strictEqual(stateChanges[0].muted, true)
      assert.strictEqual(stateChanges[1].muted, false)
      assert.strictEqual(stateChanges[2].muted, true)
    })

    test("should not update state for volume changes (only mute state)", () => {
      mockState.clearStateChanges()

      volumeController.volume = 0.5
      volumeController.volume = 0.8

      // Volume changes shouldn't trigger state updates (only mute/unmute do)
      assert.strictEqual(mockState.stateChanges.length, 0)
    })
  })

  describe("Edge Cases and Error Handling", () => {
    test("should handle NaN volume values", () => {
      volumeController.volume = NaN

      // Should be bounded to 0 by Math.max/min
      assert.strictEqual(mockMedia.volume, 0)
    })

    test("should handle Infinity volume values", () => {
      volumeController.volume = Infinity

      assert.strictEqual(mockMedia.volume, 1)
    })

    test("should handle negative Infinity volume values", () => {
      volumeController.volume = -Infinity

      assert.strictEqual(mockMedia.volume, 0)
    })

    test("should handle very precise decimal values", () => {
      const preciseValue = 0.123456789

      volumeController.volume = preciseValue

      assert.strictEqual(mockMedia.volume, preciseValue)
    })

    test("should handle rapid volume changes", () => {
      const values = Array.from({ length: 100 }, (_, i) => i / 100)

      values.forEach((value) => {
        volumeController.volume = value
        assert.strictEqual(mockMedia.volume, value)
      })
    })

    test("should maintain consistency during complex operations", () => {
      // Complex sequence of operations
      volumeController.setInitialVolume(0.8, false)
      volumeController.mute()
      volumeController.volume = 0.5 // Should auto-unmute
      volumeController.toggleMute(false) // Explicit mute
      volumeController.unmute()

      // Final state verification
      assert.strictEqual(mockMedia.muted, false)
      assert.strictEqual(mockMedia.volume, 0.5)
      assert.strictEqual(mockElements.soundBar!.value, 0.5)
    })
  })

  describe("Integration Scenarios", () => {
    test("should handle media element volume property changes", () => {
      // Simulate external volume change (e.g., from media controls)
      mockMedia.volume = 0.3

      // VolumeController should reflect the change
      assert.strictEqual(volumeController.volume, 0.3)
    })

    test("should handle media element muted property changes", () => {
      // Simulate external mute change
      mockMedia.muted = true

      // VolumeController should reflect the change
      assert.strictEqual(volumeController.muted, true)
    })

    test("should work with different sound bar implementations", () => {
      // Test with different sound bar mock
      class AlternateSoundBar {
        private _value = 0.5
        get value() {
          return this._value
        }
        set value(val: number) {
          this._value = Math.max(0, Math.min(1, val))
        }
      }

      const altElements = {
        soundBar: new AlternateSoundBar(),
      }

      const altController = new VolumeController(
        mockMedia as any,
        altElements as any,
        mockState,
      )

      altController.volume = 0.7
      assert.strictEqual(altElements.soundBar.value, 0.7)
    })

    test("should handle simultaneous mute and volume operations", () => {
      // Start with specific state
      volumeController.setInitialVolume(0.6, false)

      // Perform operations in rapid succession
      volumeController.mute()
      volumeController.volume = 0.8 // Should auto-unmute
      volumeController.toggleMute() // Should mute again

      // Verify final state
      assert.strictEqual(mockMedia.muted, true)
      assert.strictEqual(mockMedia.volume, 0.8)
      assert.strictEqual(mockElements.soundBar!.value, 0)
    })

    test("should preserve volume through mute/unmute cycles", () => {
      const originalVolume = 0.7
      volumeController.volume = originalVolume

      // Multiple mute/unmute cycles
      for (let i = 0; i < 5; i++) {
        volumeController.mute()
        assert.strictEqual(mockMedia.volume, originalVolume) // Volume preserved

        volumeController.unmute()
        assert.strictEqual(mockMedia.volume, originalVolume)
        assert.strictEqual(mockElements.soundBar!.value, originalVolume)
      }
    })
  })
})
