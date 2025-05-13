export class MockElement {
  tagName
  attributes = {}
  innerHTML = ""
  innerText = ""
  eventListeners = {}
  dataset: Record<string, string> = {}
  children: MockElement[] = []

  constructor(tagName) {
    this.tagName = tagName
  }

  setAttribute(name, value) {
    this.attributes[name] = value
  }

  getAttribute(name) {
    return this.attributes[name]
  }

  addEventListener(type, handler) {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = []
    }
    this.eventListeners[type].push(handler)
  }

  appendChild(child) {
    this.children.push(child)
    return child
  }
}
