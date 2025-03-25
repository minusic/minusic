import { CSSClass } from "../enums"
import { createElement } from "../lib/elements"
import { PlayerConfiguration } from "../types"

export function createMetadata(
  container: HTMLElement,
  options: PlayerConfiguration,
) {
  if (!options.controls.metadata) return {}

  const metadata = createElement(
    "div",
    { container },
    { class: CSSClass.Metadata },
  )

  return {
    title: createElement(
      "p",
      { text: options.metadata.title, container: metadata },
      { class: CSSClass.Title },
    ),
    author: createElement(
      "p",
      { text: options.metadata.author, container: metadata },
      { class: CSSClass.Author },
    ),
    album: createElement(
      "p",
      { text: options.metadata.album, container: metadata },
      { class: CSSClass.Album },
    ),
    thumbnail: createElement(
      "img",
      { container: metadata },
      {
        src: options.metadata.thumbnail ? options.metadata.thumbnail : "",
        class: CSSClass.Thumbnail,
      },
    ) as HTMLImageElement,
  }
}
