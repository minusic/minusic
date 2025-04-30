import { EventBus } from "../utils/eventBus/eventBus"

interface State {
  playing: boolean
  paused: boolean
  started: boolean
  muted: boolean
  random: boolean
  controls: boolean
  repeat: number

  volume: number
  playbackRate: number
}
export class StateHandler {
  private state: State
  private eventBus
  private instance

  constructor(instance: HTMLElement, eventBus: EventBus) {
    this.state = {
      playing: false,
      paused: true,
      started: false,
      muted: false,
      random: false,
      controls: true,
      repeat: 0,

      volume: 1,
      playbackRate: 1,
    }

    this.eventBus = eventBus
    this.instance = instance
    this.reflectState()
  }

  getState(property: keyof State) {
    if (property) {
      return this.state[property]
    }
    return { ...this.state }
  }

  setState(changes: Partial<State>) {
    this.state = { ...this.state, ...changes }
    this.eventBus.emit("stateChange", this.state)
    this.reflectState()
  }

  reflectState(): void {
    Object.entries(this.state).forEach(([key, value]) => {
      if (typeof value === "boolean") {
        if (value) {
          this.instance.dataset[key] = "true"
        } else {
          delete this.instance.dataset[key]
        }
      } else if (value !== null && value !== undefined) {
        this.instance.dataset[key] = String(value)
      } else {
        delete this.instance.dataset[key]
      }
    })
  }

  subscribe(callback: () => void) {
    this.eventBus.on("stateChange", callback)
    return () => this.eventBus.off("stateChange", callback)
  }
}
