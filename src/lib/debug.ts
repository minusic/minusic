export default class Debug {
  private enabled: boolean
  private prefix: string

  constructor(enabled = false) {
    this.enabled = window.console && enabled
    this.prefix = "Minusic - "

    if (this.enabled) this.log("logging enabled")
  }

  private createLogger(method: keyof Console) {
    return this.enabled
      ? Function.prototype.bind.call(console[method], console, this.prefix)
      : () => {}
  }

  get log() {
    return this.createLogger("log")
  }

  get warn() {
    return this.createLogger("warn")
  }

  get error() {
    return this.createLogger("error")
  }
}
