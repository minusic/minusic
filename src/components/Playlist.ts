import { CSSClass } from "../enums"
import { createElement } from "../lib/elements"
import { ConstructorParameters, PlayerConfiguration } from "../types"

export function createPlaylist(
  container: HTMLElement,
  tracks: PlayerConfiguration["tracks"],
  player: any,
) {
  const trackContainer = createElement(
    "menu",
    { container },
    { class: CSSClass.Playlist, role: "menu" },
  )

  if (!tracks) return { trackContainer, tracks: [] }

  const playlistTracks: HTMLElement[] = []
  for (const [index, track] of tracks.entries()) {
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

    if (track.thumbnail) {
      createElement(
        "img",
        { container: trackDetails },
        { class: CSSClass.PlaylistItemThumbnail, src: track.thumbnail },
      )
    } else {
      createElement(
        "span",
        { container: trackDetails },
        { class: CSSClass.PlaylistItemThumbnail },
      )
    }

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

    if (track.waveform)
      createElement(
        "span",
        { container: trackDetails },
        {
          class: CSSClass.PlaylistItemWaveform,
          style: `background-image: ${track.waveform ? `url("${track.waveform}")` : "none"}`,
        },
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

    playlistTracks.push(trackEntry)
  }

  return { trackContainer, tracks: playlistTracks }
}
