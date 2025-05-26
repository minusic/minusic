import { mock } from "node:test"

export class MockSourceElement {
  src = ""
  type = ""

  remove() {
    // Mock remove functionality
  }
}

export class MockAudioElement {
  private supportedTypes: Record<string, string> = {
    "audio/mpeg": "probably",
    "audio/mp4": "maybe",
    "audio/ogg": "",
    "audio/wav": "probably",
    "audio/aac": "maybe",
    "audio/flac": "",
    "audio/webm": "probably",
  }

  canPlayType(type: string): string {
    return this.supportedTypes[type] || ""
  }
}

export class MockMediaElement {
  paused = false
  currentTime = 0
  duration = 100
  volume = 1
  muted = false

  play = mock.fn(async () => undefined)
  pause = mock.fn()
  addEventListener = mock.fn()
  removeEventListener = mock.fn()

  src = ""
  crossOrigin: string | null = null
  children: MockSourceElement[] = []

  setAttribute(name: string, value: string) {
    if (name === "crossorigin") {
      this.crossOrigin = value
    }
  }

  removeAttribute(name: string) {
    if (name === "src") {
      this.src = ""
    }
  }

  appendChild(element: MockSourceElement) {
    this.children.push(element)
  }

  querySelectorAll(selector: string): MockSourceElement[] {
    if (selector === "source") {
      return this.children
    }
    return []
  }
}

export class MockMediaElementAudioSourceNode {
  connect(target: any) {
    return target
  }
  disconnect() {}
}
