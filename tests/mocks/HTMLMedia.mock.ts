import { mock } from "node:test"

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
}

export class MockMediaElementAudioSourceNode {
  connect(target: any) {
    return target
  }
  disconnect() {}
}
