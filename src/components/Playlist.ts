import { CSSClass } from "../enums"
import { createElement } from "../lib/elements"

export function createPlaylist(
  container: HTMLElement,
  options: any,
  player: any,
) {
  const trackContainer = createElement(
    "menu",
    { container },
    { class: CSSClass.Playlist, role: "menu" },
  )

  if (!options.tracks) return { trackContainer, tracks: [] }

  const tracks: HTMLElement[] = []
  for (const [index, track] of options.tracks.entries()) {
    const trackEntry = createElement(
      "li",
      { container: trackContainer },
      { class: CSSClass.PlaylistItem, role: "menuitem" },
    )

    const trackDetails = createElement(
      "button",
      { container: trackEntry },
      { class: CSSClass.PlaylistItemDetails },
      {
        click: () =>
          player.track !== index
            ? player.loadTrack(index, true)
            : player.togglePlay(),
      },
    )

    const thumbnail = createElement(
      track.thumbnail ? "img" : "span",
      { container: trackDetails },
      { class: CSSClass.PlaylistItemThumbnail, src: track.thumbnail },
    )

    createElement(
      "span",
      { container: trackDetails, text: `${index + 1}.` },
      { class: CSSClass.PlaylistItemIndex },
    )

    const title = createElement(
      "span",
      { container: trackDetails, text: track.title },
      { class: CSSClass.PlaylistItemTitle },
    )

    const author = createElement(
      "span",
      { container: trackDetails, text: track.author },
      { class: CSSClass.PlaylistItemAuthor },
    )

    const album = createElement(
      "span",
      { container: trackDetails, text: track.album },
      { class: CSSClass.PlaylistItemAlbum },
    )

    if (track.download)
      createElement(
        "a",
        { container: trackDetails, text: "Download" },
        {
          class: CSSClass.PlaylistItemDownload,
          href: track.source,
          download: track.title || "",
          title: `Download track ${track.title || ""}`,
        },
      )

    const duration = createElement(
      "span",
      {
        container: trackDetails,
        text: track.duration ? `${track.duration}` : "",
      },
      { class: CSSClass.PlaylistItemDuration },
    )

    tracks.push(trackEntry)
  }

  return { trackContainer, tracks }
}
