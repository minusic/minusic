export class MockEventBus {
  events: Record<string, any[]> = {}

  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
    return () => this.off(event, callback)
  }

  off(event: string, callback: Function) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((cb) => cb !== callback)
    }
  }

  emit(event: string, payload?: any) {
    if (this.events[event]) {
      this.events[event].forEach((callback) => callback(payload))
    }
  }
}
