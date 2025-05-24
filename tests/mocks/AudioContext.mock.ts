import { mock } from "node:test"

export class MockAudioContext {
  state = "running"
  destination = { connect: mock.fn() }

  createMediaElementSource = mock.fn(() => ({
    connect: mock.fn().mockReturnThis(),
    disconnect: mock.fn(),
  }))

  createAnalyser = mock.fn(() => ({
    frequencyBinCount: 256,
    getByteFrequencyData: mock.fn((array) => {
      // Fill with mock frequency data
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 255)
      }
    }),
    connect: mock.fn().mockReturnThis(),
    disconnect: mock.fn(),
  }))

  close = mock.fn().mockResolvedValue(undefined)
}
