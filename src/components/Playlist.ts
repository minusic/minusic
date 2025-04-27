import { CSSClass } from "../enums"
import { createElement } from "../utils/dom/elements"
import Minusic from "../minusic"
import { PlayerConfiguration } from "../types"

export function createPlaylist(
  container: HTMLElement,
  options: PlayerConfiguration,
  player: Minusic,
) {
  const trackContainer = createElement(
    "menu",
    { container },
    { class: CSSClass.Playlist, role: "menu" },
  )
  const { tracks } = options

  if (!tracks || !options.controls.metadata)
    return { trackContainer, tracks: [] }

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

    // Title
    createElement(
      "span",
      { container: trackDetails, text: track.title },
      { class: CSSClass.PlaylistItemTitle },
    )

    // Author
    createElement(
      "span",
      { container: trackDetails, text: track.author },
      { class: CSSClass.PlaylistItemAuthor },
    )

    // Album
    createElement(
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

    // Duration
    createElement(
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
