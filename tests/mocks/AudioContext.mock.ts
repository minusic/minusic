import { MockMediaElementAudioSourceNode } from "./HTMLMedia.mock"

export class MockAnalyserNode {
  frequencyBinCount = 256

  getByteFrequencyData(array: Uint8Array) {
    for (let i = 0; i < array.length; i++) {
      array[i] = i % 256
    }
  }

  connect(target: any) {
    return target
  }

  disconnect() {}
}

export class MockAudioContext {
  state = "running"
  destination = {}

  createMediaElementSource(media: HTMLMediaElement) {
    return new MockMediaElementAudioSourceNode()
  }

  createAnalyser() {
    return new MockAnalyserNode()
  }

  close() {
    this.state = "closed"
    return Promise.resolve()
  }
}
