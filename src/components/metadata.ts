import { CSSClass } from "../enums"
import { createElement } from "../utils/dom/elements"
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
  const { title, artist, album, thumbnail } =
    options.media.currentTrack?.metadata || {}

  return {
    title: createElement(
      "p",
      { text: title, container: metadata },
      { class: CSSClass.Title },
    ),
    author: createElement(
      "p",
      { text: artist, container: metadata },
      { class: CSSClass.Author },
    ),
    album: createElement(
      "p",
      { text: album, container: metadata },
      { class: CSSClass.Album },
    ),
    thumbnail: createElement(
      "img",
      { container: metadata },
      {
        src: thumbnail ? thumbnail : "",
        class: CSSClass.Thumbnail,
      },
    ) as HTMLImageElement,
  }
}
