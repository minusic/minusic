type EventHandler<T = any> = (payload: T) => void

export class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map()

  on<T = any>(event: string, handler: EventHandler<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler as EventHandler)
  }

  off<T = any>(event: string, handler: EventHandler<T>): void {
    this.listeners.get(event)?.delete(handler as EventHandler)
  }

  once<T = any>(event: string, handler: EventHandler<T>): void {
    const onceHandler: EventHandler<T> = (payload) => {
      handler(payload)
      this.off(event, onceHandler)
    }
    this.on(event, onceHandler)
  }

  emit<T = any>(event: string, payload?: T): void {
    console.log(event, payload)
    this.listeners.get(event)?.forEach((handler) => handler(payload))
  }
}
