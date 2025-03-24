import { CSSClass } from "../enums"
import { createElement } from "../lib/elements"
import { ConstructorParameters } from "../types"

export function createMetadata(
  container: HTMLElement,
  options: ConstructorParameters["options"],
) {
  if (!options.metadata) return {}

  const metadata = createElement(
    "div",
    { container },
    { class: CSSClass.Metadata },
  )

  return {
    title: createElement(
      "p",
      { text: options.title, container: metadata },
      { class: CSSClass.Title },
    ),
    author: createElement(
      "p",
      { text: options.author, container: metadata },
      { class: CSSClass.Author },
    ),
    album: createElement(
      "p",
      { text: options.album, container: metadata },
      { class: CSSClass.Album },
    ),
    thumbnail: createElement(
      "img",
      { container: metadata },
      {
        src: options.thumbnail ? options.thumbnail : "",
        class: CSSClass.Thumbnail,
      },
    ) as HTMLImageElement,
  }
}
