import { test } from "node:test"
import assert from "node:assert"
import { createLinearGradient } from "../../../../src/utils/canvas/gradients"
import {
  MockCanvasContext,
  MockCanvasGradient,
} from "../../../mocks/HTMLCanvas.mock"

test("createLinearGradient utility", async (t) => {
  await t.test("should create horizontal gradient (0° angle)", () => {
    const context = new MockCanvasContext()
    const canvasProperties = {
      width: 300,
      height: 200,
      context: context as unknown as CanvasRenderingContext2D,
    }

    const parameters = {
      angle: 0,
      values: {
        0: "red",
        0.5: "green",
        1: "blue",
      },
    }

    const gradient = createLinearGradient(
      canvasProperties,
      parameters,
    ) as unknown as MockCanvasGradient
    const params = context.lastLinearGradientParams

    // For 0° angle, gradient should be horizontal (left to right)
    // The gradient line should be longer than canvas width (using diagonal)
    assert(params !== null, "Gradient parameters should be set")

    // Check that start and end points are on horizontal axis
    assert.strictEqual(
      params!.y0,
      params!.y1,
      "Y coordinates should be the same for horizontal gradient",
    )
    assert(
      params!.x0 < params!.x1,
      "X coordinates should increase from left to right",
    )

    // Check that the color stops are correctly added
    const colorStops = gradient.getColorStops()
    assert.strictEqual(colorStops.length, 3, "Should have 3 color stops")

    assert.strictEqual(
      colorStops[0].offset,
      0,
      "First stop should be at offset 0",
    )
    assert.strictEqual(colorStops[0].color, "red", "First stop should be red")

    assert.strictEqual(
      colorStops[1].offset,
      0.5,
      "Second stop should be at offset 0.5",
    )
    assert.strictEqual(
      colorStops[1].color,
      "green",
      "Second stop should be green",
    )

    assert.strictEqual(
      colorStops[2].offset,
      1,
      "Third stop should be at offset 1",
    )
    assert.strictEqual(colorStops[2].color, "blue", "Third stop should be blue")
  })

  await t.test("should create vertical gradient (90° angle)", () => {
    const context = new MockCanvasContext()
    const canvasProperties = {
      width: 300,
      height: 200,
      context: context as unknown as CanvasRenderingContext2D,
    }

    const parameters = {
      angle: 90,
      values: {
        0: "yellow",
        1: "purple",
      },
    }

    createLinearGradient(canvasProperties, parameters)
    const params = context.lastLinearGradientParams

    // For 90° angle, gradient should be vertical (top to bottom)
    assert(params !== null, "Gradient parameters should be set")

    // Check that start and end points are on vertical axis
    assert(
      params!.x0,
      params!.x1,
      "X coordinates should be the same for vertical gradient",
    )
    assert(
      params!.y0 < params!.y1,
      "Y coordinates should increase from top to bottom",
    )
  })

  await t.test("should create diagonal gradient (45° angle)", () => {
    const context = new MockCanvasContext()
    const canvasProperties = {
      width: 300,
      height: 200,
      context: context as unknown as CanvasRenderingContext2D,
    }

    const parameters = {
      angle: 45,
      values: {
        0: "white",
        1: "black",
      },
    }

    createLinearGradient(canvasProperties, parameters)
    const params = context.lastLinearGradientParams

    // For 45° angle, gradient should be diagonal (top-left to bottom-right)
    assert(params !== null, "Gradient parameters should be set")
    assert(params!.x0 < params!.x1, "X should increase from left to right")
    assert(params!.y0 < params!.y1, "Y should increase from top to bottom")

    // Check that angles are roughly 45 degrees
    const dx = params!.x1 - params!.x0
    const dy = params!.y1 - params!.y0
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)

    assert(angle, 45, "Angle should be approximately 45 degrees")
  })

  await t.test("should use default angle when not specified", () => {
    const context = new MockCanvasContext()
    const canvasProperties = {
      width: 300,
      height: 200,
      context: context as unknown as CanvasRenderingContext2D,
    }

    const parameters = {
      values: {
        0: "red",
        1: "blue",
      },
    }

    createLinearGradient(canvasProperties, parameters)
    const params = context.lastLinearGradientParams

    // Default angle should be 0° (horizontal)
    assert(params !== null, "Gradient parameters should be set")
    assert.strictEqual(
      params!.y0,
      params!.y1,
      "Y coordinates should be the same for default horizontal gradient",
    )
    assert(
      params!.x0 < params!.x1,
      "X coordinates should increase from left to right",
    )
  })

  await t.test("should handle edge cases", () => {
    const context = new MockCanvasContext()
    const canvasProperties = {
      width: 300,
      height: 200,
      context: context as unknown as CanvasRenderingContext2D,
    }

    // Test with a single color stop
    const singleStopParams = {
      angle: 0,
      values: {
        0.5: "red",
      },
    }

    const singleStopGradient = createLinearGradient(
      canvasProperties,
      singleStopParams,
    ) as unknown as MockCanvasGradient
    const singleStopColorStops = singleStopGradient.getColorStops()

    assert.strictEqual(
      singleStopColorStops.length,
      1,
      "Should have 1 color stop",
    )
    assert.strictEqual(
      singleStopColorStops[0].offset,
      0.5,
      "Stop should be at offset 0.5",
    )
    assert.strictEqual(
      singleStopColorStops[0].color,
      "red",
      "Stop should be red",
    )

    // Test with unusual angles
    const angles = [180, 270, 360, -45, 720]
    for (const angle of angles) {
      const angleParams = {
        angle,
        values: {
          0: "red",
          1: "blue",
        },
      }

      const angleGradient = createLinearGradient(canvasProperties, angleParams)
      assert(
        angleGradient !== null,
        `Gradient should be created for angle ${angle}°`,
      )
    }

    // Test with unusual canvas dimensions
    const dimensionTests = [
      { width: 0, height: 0 },
      { width: 1, height: 1 },
      { width: 10000, height: 10000 },
    ]

    for (const dims of dimensionTests) {
      const narrowCanvas = {
        width: dims.width,
        height: dims.height,
        context: context as unknown as CanvasRenderingContext2D,
      }

      const narrowGradient = createLinearGradient(narrowCanvas, {
        angle: 45,
        values: { 0: "red", 1: "blue" },
      })

      assert(
        narrowGradient !== null,
        `Gradient should be created for dimensions ${dims.width}x${dims.height}`,
      )
    }
  })

  await t.test("should calculate gradient line longer than canvas size", () => {
    const context = new MockCanvasContext()
    const canvasProperties = {
      width: 300,
      height: 200,
      context: context as unknown as CanvasRenderingContext2D,
    }

    const parameters = {
      angle: 0,
      values: {
        0: "red",
        1: "blue",
      },
    }

    createLinearGradient(canvasProperties, parameters)
    const params = context.lastLinearGradientParams

    // Calculate the length of the gradient line
    const dx = params!.x1 - params!.x0
    const dy = params!.y1 - params!.y0
    const length = Math.sqrt(dx * dx + dy * dy)

    // The gradient line should be at least as long as the diagonal of the canvas
    const canvasDiagonal = Math.sqrt(
      canvasProperties.width * canvasProperties.width +
        canvasProperties.height * canvasProperties.height,
    )

    assert(
      length >= canvasDiagonal,
      "Gradient line should be at least as long as canvas diagonal",
    )
  })
})
