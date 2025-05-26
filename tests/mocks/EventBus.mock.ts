import { EventBus } from "../../src/utils/eventBus/eventBus"

export class MockEventBus extends EventBus {
  public emittedEvents: Array<{ event: string; payload?: any }> = []

  emit<T = any>(event: string, payload?: T): void {
    this.emittedEvents.push({ event, payload })
    super.emit(event, payload)
  }

  clearEvents() {
    this.emittedEvents = []
  }

  getEmittedEvents(eventName?: string) {
    if (eventName) {
      return this.emittedEvents.filter((e) => e.event === eventName)
    }
    return this.emittedEvents
  }
}
