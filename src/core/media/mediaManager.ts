import {
  createElement,
  wrapElement,
  unwrapElement,
} from "../../utils/dom/elements"

export class MediaManager {
  private media: HTMLMediaElement | null = null
  private container: HTMLElement | null = null

  constructor() {}

  public initialize(selectors: {
    media: string
    container: string
  }): HTMLMediaElement {
    this.media = document.querySelector(selectors.media) as HTMLMediaElement

    if (!this.validateMediaElement()) {
      if (!this.validateContainerElement(selectors.container)) {
        throw new Error("Neither valid media element nor container found")
      }
      this.createMediaElement()
    }
    return this.media as HTMLMediaElement
  }

  private validateMediaElement(): boolean {
    return this.media?.nodeName === "AUDIO" && !!this.media?.parentNode
  }

  private validateContainerElement(containerSelector: string): boolean {
    this.container = document.querySelector(containerSelector) as HTMLElement
    return this.container !== null
  }

  private createMediaElement(): void {
    if (!this.container) return

    this.media = createElement("audio", {
      container: this.container,
    }) as HTMLMediaElement
  }

  public wrapMediaElement(playerContainer: HTMLElement): void {
    if (!this.media) return
    wrapElement(playerContainer, this.media)
  }

  public unwrapMediaElement(playerContainer: HTMLElement): void {
    if (!this.media) return
    unwrapElement(playerContainer, this.media)
  }

  public getMediaElement(): HTMLMediaElement | null {
    return this.media
  }

  public destroy(): void {
    if (this.media && this.container) {
      this.container.removeChild(this.media)
    }
    this.media = null
    this.container = null
  }
}
