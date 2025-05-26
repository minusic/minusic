import { test, describe, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import {
  normalizeSources,
  inferMimeType,
  isSourceSupported,
  filterSupportedSources,
  attachSources,
  preloadSource,
  getValidSource,
  SourceErrorType,
} from "../../../../src/core/media/sourceHandler"
import { TrackInfo, TrackSource } from "../../../../src/types"
import {
  MockAudioElement,
  MockMediaElement,
  MockSourceElement,
} from "../../../mocks/HTMLMedia.mock"

describe("SourceHandler", () => {
  let originalDocument: any
  let mockAudio: MockAudioElement
  let mockMedia: MockMediaElement

  beforeEach(() => {
    // Store original document
    originalDocument = global.document

    // Setup mock audio and media elements
    mockAudio = new MockAudioElement()
    mockMedia = new MockMediaElement()

    // Mock document.createElement
    global.document = {
      createElement: (tagName: string) => {
        if (tagName === "audio") {
          return mockAudio
        } else if (tagName === "source") {
          return new MockSourceElement()
        }
        return {}
      },
    }

    // Mock global fetch for preloadSource tests
    global.fetch = undefined
    global.window = {
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
    }
  })

  afterEach(() => {
    // Restore original document
    global.document = originalDocument
  })

  describe("normalizeSources", () => {
    test("should handle string source", () => {
      const result = normalizeSources("track.mp3")

      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].source, "track.mp3")
      assert.strictEqual(result[0].type, "audio/mpeg")
    })

    test("should handle array of strings", () => {
      const result = normalizeSources(["track.mp3", "track.ogg"])

      assert.strictEqual(result.length, 2)
      assert.strictEqual(result[0].source, "track.mp3")
      assert.strictEqual(result[0].type, "audio/mpeg")
      assert.strictEqual(result[1].source, "track.ogg")
      assert.strictEqual(result[1].type, "audio/ogg")
    })

    test("should handle TrackSource object", () => {
      const source: TrackSource = { source: "track.mp3", type: "audio/mpeg" }
      const result = normalizeSources(source)

      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].source, "track.mp3")
      assert.strictEqual(result[0].type, "audio/mpeg")
    })

    test("should handle array of TrackSource objects", () => {
      const sources: TrackSource[] = [
        { source: "track.mp3", type: "audio/mpeg" },
        { source: "track.ogg", type: "audio/ogg" },
      ]
      const result = normalizeSources(sources)

      assert.strictEqual(result.length, 2)
      assert.strictEqual(result[0].source, "track.mp3")
      assert.strictEqual(result[0].type, "audio/mpeg")
      assert.strictEqual(result[1].source, "track.ogg")
      assert.strictEqual(result[1].type, "audio/ogg")
    })

    test("should handle mixed array of strings and objects", () => {
      const sources = ["track.mp3", { source: "track.ogg", type: "audio/ogg" }]
      const result = normalizeSources(sources)

      assert.strictEqual(result.length, 2)
      assert.strictEqual(result[0].source, "track.mp3")
      assert.strictEqual(result[0].type, "audio/mpeg")
      assert.strictEqual(result[1].source, "track.ogg")
      assert.strictEqual(result[1].type, "audio/ogg")
    })

    test("should handle empty or null input", () => {
      assert.strictEqual(normalizeSources("").length, 0)
      assert.strictEqual(normalizeSources(null as any).length, 0)
      assert.strictEqual(normalizeSources(undefined as any).length, 0)
      assert.strictEqual(normalizeSources([]).length, 0)
    })
  })

  describe("inferMimeType", () => {
    test("should infer correct MIME types for common extensions", () => {
      assert.strictEqual(inferMimeType("track.mp3"), "audio/mpeg")
      assert.strictEqual(inferMimeType("track.MP3"), "audio/mpeg") // Case insensitive
      assert.strictEqual(inferMimeType("track.mp4"), "audio/mp4")
      assert.strictEqual(inferMimeType("track.m4a"), "audio/mp4")
      assert.strictEqual(inferMimeType("track.ogg"), "audio/ogg")
      assert.strictEqual(inferMimeType("track.oga"), "audio/ogg")
      assert.strictEqual(inferMimeType("track.wav"), "audio/wav")
      assert.strictEqual(inferMimeType("track.aac"), "audio/aac")
      assert.strictEqual(inferMimeType("track.flac"), "audio/flac")
      assert.strictEqual(inferMimeType("track.webm"), "audio/webm")
    })

    test("should handle URLs with query parameters", () => {
      assert.strictEqual(inferMimeType("track.mp3?version=1"), "audio/mpeg")
      assert.strictEqual(
        inferMimeType("/path/to/track.ogg?param=value"),
        "audio/ogg",
      )
    })

    test("should handle URLs with no extension", () => {
      assert.strictEqual(inferMimeType("/path/to/track"), "")
      assert.strictEqual(inferMimeType("https://example.com/audio"), "")
    })

    test("should handle unknown extensions", () => {
      assert.strictEqual(inferMimeType("track.xyz"), "")
      assert.strictEqual(inferMimeType("track.unknown"), "")
    })

    test("should handle empty or invalid input", () => {
      assert.strictEqual(inferMimeType(""), "")
      assert.strictEqual(inferMimeType("."), "")
      assert.strictEqual(inferMimeType(".."), "")
    })
  })

  describe("isSourceSupported", () => {
    test("should check support for sources with MIME types", () => {
      const mp3Source: TrackSource = { source: "track.mp3", type: "audio/mpeg" }
      const oggSource: TrackSource = { source: "track.ogg", type: "audio/ogg" }

      assert.strictEqual(isSourceSupported(mp3Source), true) // 'probably'
      assert.strictEqual(isSourceSupported(oggSource), false) // ''
    })

    test("should infer MIME type when not provided", () => {
      const mp3Source: TrackSource = { source: "track.mp3", type: "" }
      const unknownSource: TrackSource = { source: "track.xyz", type: "" }

      assert.strictEqual(isSourceSupported(mp3Source), true)
      assert.strictEqual(isSourceSupported(unknownSource), true) // Falls back to true
    })

    test("should handle invalid sources", () => {
      assert.strictEqual(isSourceSupported(null as any), false)
      assert.strictEqual(isSourceSupported(undefined as any), false)
      assert.strictEqual(isSourceSupported({ source: "", type: "" }), false)
    })

    test("should handle sources without type", () => {
      const source: TrackSource = { source: "track.mp3", type: "" }
      assert.strictEqual(isSourceSupported(source), true)
    })
  })

  describe("filterSupportedSources", () => {
    test("should filter out unsupported sources", () => {
      const sources: TrackSource[] = [
        { source: "track.mp3", type: "audio/mpeg" }, // supported
        { source: "track.ogg", type: "audio/ogg" }, // not supported
        { source: "track.wav", type: "audio/wav" }, // supported
      ]

      const result = filterSupportedSources(sources)

      assert.strictEqual(result.length, 2)
      assert.strictEqual(result[0].source, "track.mp3")
      assert.strictEqual(result[1].source, "track.wav")
    })

    test("should handle empty or invalid input", () => {
      assert.strictEqual(filterSupportedSources([]).length, 0)
      assert.strictEqual(filterSupportedSources(null as any).length, 0)
      assert.strictEqual(filterSupportedSources(undefined as any).length, 0)
    })

    test("should handle all unsupported sources", () => {
      const sources: TrackSource[] = [
        { source: "track.ogg", type: "audio/ogg" },
        { source: "track.flac", type: "audio/flac" },
      ]

      const result = filterSupportedSources(sources)
      assert.strictEqual(result.length, 0)
    })
  })

  describe("attachSources", () => {
    test("should attach sources to media element", () => {
      const sources: TrackSource[] = [
        { source: "track.mp3", type: "audio/mpeg" },
        { source: "track.ogg", type: "audio/ogg" },
      ]

      const result = attachSources(mockMedia as any, sources)

      assert.strictEqual(result.length, 2)
      assert.strictEqual(mockMedia.children.length, 2)
      assert.strictEqual(mockMedia.children[0].src, "track.mp3")
      assert.strictEqual(mockMedia.children[0].type, "audio/mpeg")
      assert.strictEqual(mockMedia.children[1].src, "track.ogg")
      assert.strictEqual(mockMedia.children[1].type, "audio/ogg")
    })

    test("should clear existing src attribute", () => {
      mockMedia.src = "existing.mp3"
      const sources: TrackSource[] = [{ source: "new.mp3", type: "audio/mpeg" }]

      attachSources(mockMedia as any, sources)

      assert.strictEqual(mockMedia.src, "")
    })

    test("should set crossOrigin attribute", () => {
      const sources: TrackSource[] = [
        { source: "track.mp3", type: "audio/mpeg" },
      ]

      attachSources(mockMedia as any, sources, { crossOrigin: "anonymous" })

      assert.strictEqual(mockMedia.crossOrigin, "anonymous")
    })

    test("should handle boolean crossOrigin", () => {
      const sources: TrackSource[] = [
        { source: "track.mp3", type: "audio/mpeg" },
      ]

      attachSources(mockMedia as any, sources, { crossOrigin: true })

      assert.strictEqual(mockMedia.crossOrigin, "anonymous")
    })

    test("should handle empty sources array", () => {
      const result = attachSources(mockMedia as any, [])

      assert.strictEqual(result.length, 0)
      assert.strictEqual(mockMedia.children.length, 0)
    })

    test("should handle invalid input", () => {
      const result = attachSources(null as any, [])
      assert.strictEqual(result.length, 0)

      const result2 = attachSources(mockMedia as any, null as any)
      assert.strictEqual(result2.length, 0)
    })
  })

  describe("preloadSource", () => {
    test("should resolve with success for valid source", async () => {
      // Mock successful audio loading
      const mockPreloadAudio = {
        crossOrigin: null,
        src: "",
        error: null,
        addEventListener: (event: string, callback: Function) => {
          if (event === "canplay") {
            setTimeout(() => callback(), 0)
          }
        },
        removeEventListener: () => {},
        load: () => {},
        setAttribute: () => {},
      }

      global.document.createElement = (tagName: string) => {
        if (tagName === "audio") {
          return mockPreloadAudio
        }
        return new MockSourceElement()
      }

      const source: TrackSource = { source: "track.mp3", type: "audio/mpeg" }
      const result = await preloadSource(source)

      assert.strictEqual(result.success, true)
      assert.strictEqual(result.source, "track.mp3")
      assert.strictEqual(result.type, "audio/mpeg")
    })

    test("should resolve with error for invalid source", async () => {
      const mockErrorAudio = {
        crossOrigin: null,
        src: "",
        error: { code: 4, message: "Media not supported" },
        addEventListener: (event: string, callback: Function) => {
          if (event === "error") {
            setTimeout(() => callback({ error: new Error("Load failed") }), 0)
          }
        },
        removeEventListener: () => {},
        load: () => {},
        setAttribute: () => {},
      }

      global.document.createElement = (tagName: string) => {
        if (tagName === "audio") {
          return mockErrorAudio
        }
        return new MockSourceElement()
      }

      const source: TrackSource = { source: "invalid.mp3", type: "audio/mpeg" }
      const result = await preloadSource(source)

      assert.strictEqual(result.success, false)
      assert.strictEqual(result.source, "invalid.mp3")
      assert.strictEqual(result.error?.type, SourceErrorType.FORMAT)
    })

    test("should handle timeout", async () => {
      const mockTimeoutAudio = {
        crossOrigin: null,
        src: "",
        error: null,
        addEventListener: () => {}, // Never fires events
        removeEventListener: () => {},
        load: () => {},
        setAttribute: () => {},
      }

      global.document.createElement = () => mockTimeoutAudio

      const source: TrackSource = { source: "slow.mp3", type: "audio/mpeg" }
      const result = await preloadSource(source, { timeout: 10 })

      assert.strictEqual(result.success, false)
      assert.strictEqual(result.error?.type, SourceErrorType.NETWORK)
      assert.ok(result.error?.message.includes("timed out"))
    })

    test("should handle missing source", async () => {
      const result = await preloadSource(null as any)

      assert.strictEqual(result.success, false)
      assert.strictEqual(result.error?.type, SourceErrorType.UNAVAILABLE)
      assert.strictEqual(result.error?.message, "No source provided")
    })

    test("should handle empty source", async () => {
      const result = await preloadSource({ source: "", type: "" })

      assert.strictEqual(result.success, false)
      assert.strictEqual(result.error?.type, SourceErrorType.UNAVAILABLE)
    })

    test("should set crossOrigin options", async () => {
      let capturedCrossOrigin: string | null = null

      const mockCORSAudio = {
        set crossOrigin(value: string) {
          capturedCrossOrigin = value
        },
        src: "",
        error: null,
        addEventListener: (event: string, callback: Function) => {
          if (event === "canplay") {
            setTimeout(() => callback(), 0)
          }
        },
        removeEventListener: () => {},
        load: () => {},
        setAttribute: () => {},
      }

      global.document.createElement = () => mockCORSAudio

      const source: TrackSource = { source: "track.mp3", type: "audio/mpeg" }
      await preloadSource(source, { crossOrigin: "use-credentials" })

      assert.strictEqual(capturedCrossOrigin, "use-credentials")
    })
  })

  describe("getValidSource", () => {
    test("should return first valid source", async () => {
      // Mock successful preloadSource
      const originalDocument = global.document
      global.document = {
        createElement: () => ({
          canPlayType: (type: string) =>
            type === "audio/mpeg" ? "probably" : "",
          crossOrigin: null,
          src: "",
          error: null,
          addEventListener: (event: string, callback: Function) => {
            if (event === "canplay") {
              setTimeout(() => callback(), 0)
            }
          },
          removeEventListener: () => {},
          load: () => {},
          setAttribute: () => {},
        }),
      }

      const track: TrackInfo = {
        source: [
          { source: "track.ogg", type: "audio/ogg" }, // not supported
          { source: "track.mp3", type: "audio/mpeg" }, // supported
        ],
        metadata: {
          title: "Test Track",
          artist: "Test Artist",
        },
      }

      const result = await getValidSource(track)

      assert.ok(result)
      assert.strictEqual(result.source, "track.mp3")
      assert.strictEqual(result.type, "audio/mpeg")
      global.document = originalDocument
    })

    test("should return null for track with no valid sources", async () => {
      const track: TrackInfo = {
        source: [
          { source: "track.ogg", type: "audio/ogg" },
          { source: "track.flac", type: "audio/flac" },
        ],
        metadata: {
          title: "Test Track",
          artist: "Test Artist",
        },
      }

      const result = await getValidSource(track)
      assert.strictEqual(result, null)
    })

    test("should handle track with no sources", async () => {
      const track: TrackInfo = {
        source: [],
        metadata: {
          title: "Test Track",
          artist: "Test Artist",
        },
      }

      const result = await getValidSource(track)
      assert.strictEqual(result, null)
    })

    test("should handle null/undefined track", async () => {
      const result1 = await getValidSource(null as any)
      const result2 = await getValidSource(undefined as any)

      assert.strictEqual(result1, null)
      assert.strictEqual(result2, null)
    })

    test("should handle track without source property", async () => {
      const track = {
        metadata: {
          title: "Test Track",
          artist: "Test Artist",
        },
      } as TrackInfo

      const result = await getValidSource(track)
      assert.strictEqual(result, null)
    })
  })

  describe("Error Type Determination", () => {
    test("should determine correct error types from MediaError codes", async () => {
      const testCases = [
        { code: 1, expectedType: SourceErrorType.UNAVAILABLE }, // MEDIA_ERR_ABORTED
        { code: 2, expectedType: SourceErrorType.NETWORK }, // MEDIA_ERR_NETWORK
        { code: 3, expectedType: SourceErrorType.DECODE }, // MEDIA_ERR_DECODE
        { code: 4, expectedType: SourceErrorType.FORMAT }, // MEDIA_ERR_SRC_NOT_SUPPORTED
        { code: 99, expectedType: SourceErrorType.UNKNOWN }, // Unknown error code
      ]

      for (const testCase of testCases) {
        const mockErrorAudio = {
          crossOrigin: null,
          src: "",
          error: { code: testCase.code, message: "Test error" },
          addEventListener: (event: string, callback: Function) => {
            if (event === "error") {
              setTimeout(() => callback({ error: new Error("Test") }), 0)
            }
          },
          removeEventListener: () => {},
          load: () => {},
          setAttribute: () => {},
        }

        global.document.createElement = () => mockErrorAudio

        const source: TrackSource = { source: "test.mp3", type: "audio/mpeg" }
        const result = await preloadSource(source)

        assert.strictEqual(result.success, false)
        assert.strictEqual(result.error?.type, testCase.expectedType)
      }
    })
  })

  describe("Integration Tests", () => {
    test("should handle complete workflow from normalization to attachment", () => {
      const sources = ["track.mp3", "track.ogg", "track.wav"]

      // Normalize sources
      const normalized = normalizeSources(sources)
      assert.strictEqual(normalized.length, 3)

      // Filter supported sources
      const supported = filterSupportedSources(normalized)
      assert.strictEqual(supported.length, 2) // mp3 and wav

      // Attach to media element
      const attached = attachSources(mockMedia as any, supported)
      assert.strictEqual(attached.length, 2)
      assert.strictEqual(mockMedia.children.length, 2)
    })

    test("should handle edge cases gracefully", () => {
      // Test with various invalid inputs
      assert.strictEqual(normalizeSources("").length, 0)
      assert.strictEqual(filterSupportedSources([]).length, 0)
      assert.strictEqual(attachSources(mockMedia as any, []).length, 0)

      // Verify no errors thrown
      assert.strictEqual(inferMimeType(""), "")
      assert.strictEqual(isSourceSupported(null as any), false)
    })
  })
})
