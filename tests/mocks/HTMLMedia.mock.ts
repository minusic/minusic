export class MockMediaElement {
  paused = false
  currentTime = 0
  duration = 100
  volume = 1
  muted = false

  play = mock.fn().mockResolvedValue(undefined)
  pause = mock.fn()
  addEventListener = mock.fn()
  removeEventListener = mock.fn()
}
