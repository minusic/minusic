import { test } from "node:test"
import assert from "node:assert"
import { createElement } from "../../../../src/utils/dom/elements"
import { MockElement } from "../../../mocks/HTMLElement.mock"

global.document = {
  createElement(tag) {
    return new MockElement(tag)
  },
}

test("createElement utility", async (t) => {
  await t.test("should create a DOM element with the specified tag", () => {
    const div = createElement("div")
    assert.strictEqual(
      div.tagName,
      "div",
      "Should create an element with the correct tag name",
    )
  })

  await t.test("should set text content when provided", () => {
    const span = createElement("span", { text: "Hello World" })
    assert.strictEqual(
      span.innerText,
      "Hello World",
      "Should set innerText when text property is provided",
    )
  })

  await t.test("should set HTML content when provided", () => {
    const div = createElement("div", { html: "<span>Test</span>" })
    assert.strictEqual(
      div.innerHTML,
      "<span>Test</span>",
      "Should set innerHTML when html property is provided",
    )
  })

  await t.test("should append to container when provided", () => {
    const container = new MockElement("div")
    const child = createElement("p", { container })

    assert.strictEqual(
      container.children.length,
      1,
      "Should append element to container",
    )
    assert.strictEqual(
      container.children[0],
      child,
      "Container should contain the created element",
    )
  })

  await t.test("should set attributes correctly", () => {
    const input = createElement(
      "input",
      {},
      {
        type: "text",
        id: "username",
        class: "form-control",
        "data-test": "input-field",
      },
    )

    assert.strictEqual(
      input.attributes.type,
      "text",
      "Should set simple attribute",
    )
    assert.strictEqual(
      input.attributes.id,
      "username",
      "Should set id attribute",
    )
    assert.strictEqual(
      input.attributes.class,
      "form-control",
      "Should set class attribute",
    )
    assert.strictEqual(
      input.attributes["data-test"],
      "input-field",
      "Should set data attribute",
    )
  })

  await t.test("should set array attributes as space-separated strings", () => {
    const div = createElement(
      "div",
      {},
      {
        class: ["btn", "btn-primary", "large"],
      },
    )

    assert.strictEqual(
      div.attributes.class,
      "btn btn-primary large",
      "Should join array attributes with spaces",
    )
  })

  await t.test("should attach event listeners", () => {
    const clickHandler = () => {}
    const mouseoverHandler = () => {}

    const button = createElement(
      "button",
      {},
      {},
      {
        click: clickHandler,
        mouseover: mouseoverHandler,
      },
    )

    assert.strictEqual(
      button.eventListeners.click.length,
      1,
      "Should attach click event listener",
    )
    assert.strictEqual(
      button.eventListeners.click[0],
      clickHandler,
      "Should attach the correct click handler",
    )

    assert.strictEqual(
      button.eventListeners.mouseover.length,
      1,
      "Should attach mouseover event listener",
    )
    assert.strictEqual(
      button.eventListeners.mouseover[0],
      mouseoverHandler,
      "Should attach the correct mouseover handler",
    )
  })

  await t.test("should handle all parameters together", () => {
    const container = new MockElement("div")
    const clickHandler = () => {}

    const element = createElement(
      "button",
      {
        text: "Click Me",
        container,
      },
      {
        class: ["btn", "primary"],
        id: "submit-btn",
        "aria-label": "Submit",
      },
      {
        click: clickHandler,
      },
    )

    assert.strictEqual(
      element.tagName,
      "button",
      "Should create correct element type",
    )
    assert.strictEqual(element.innerText, "Click Me", "Should set text content")
    assert.strictEqual(
      element.attributes.class,
      "btn primary",
      "Should set class attribute",
    )
    assert.strictEqual(
      element.attributes.id,
      "submit-btn",
      "Should set id attribute",
    )
    assert.strictEqual(
      element.attributes["aria-label"],
      "Submit",
      "Should set aria attribute",
    )
    assert.strictEqual(
      element.eventListeners.click[0],
      clickHandler,
      "Should attach event handler",
    )
    assert.strictEqual(
      container.children[0],
      element,
      "Should append to container",
    )
  })
})
