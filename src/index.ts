import Debug from "./lib/debug"
import { ConstructorParameters } from "./types"

export * from "./types"
export default class Minusic {
  private media: HTMLElement | null
  private debug: Debug

  constructor({ target, options }: ConstructorParameters) {
    this.media =
      typeof target !== "undefined" && target?.length
        ? document.querySelector(target)
        : null
    this.debug = new Debug(options.debug)

    if (this.media?.nodeName !== "AUDIO") {
      this.debug.error(`Invalid selector "${target}"`)
      return
    }
  }
}
