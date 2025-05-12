import { CSSClass } from "../enums"
import { createElement } from "../utils/dom/elements"
import Minusic from "../core/minusic"
import { PlayerConfiguration, TrackInfo } from "../types"

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
  const tracks = options.media.playlist

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

    if (track.metadata?.thumbnail) {
      createElement(
        "img",
        { container: trackDetails },
        {
          class: CSSClass.PlaylistItemThumbnail,
          src: track.metadata?.thumbnail,
        },
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
      { container: trackDetails, text: track.metadata?.title },
      { class: CSSClass.PlaylistItemTitle },
    )

    // Author
    createElement(
      "span",
      { container: trackDetails, text: track.metadata?.artist },
      { class: CSSClass.PlaylistItemAuthor },
    )

    // Album
    createElement(
      "span",
      { container: trackDetails, text: track.metadata?.album },
      { class: CSSClass.PlaylistItemAlbum },
    )

    createElement(
      "span",
      { container: trackDetails },
      {
        class: CSSClass.PlaylistItemWaveform,
        style: `background-image: ${track.metadata?.waveform ? `url("${track.metadata.waveform}")` : "none"}`,
      },
    )

    if (track.allowDownload)
      createElement(
        "a",
        { container: trackDetails, text: "Download" },
        {
          class: CSSClass.PlaylistItemDownload,
          href: getDownloadTitle(track),
          download: track.metadata?.title || "",
          title: `Download track ${track.metadata?.title || ""}`,
        },
      )

    // Duration
    createElement(
      "span",
      {
        container: trackDetails,
        text: `${track.metadata?.duration || ""}`,
      },
      { class: CSSClass.PlaylistItemDuration },
    )

    playlistTracks.push(trackEntry)
  }

  return { trackContainer, tracks: playlistTracks }
}

export function getDownloadTitle(track: TrackInfo | string): string {
  if (track instanceof Array) return getDownloadTitle(track[0])
  else if (typeof track === "string") return track
  else if (track instanceof Object) {
    if (track.source instanceof Array) return getDownloadTitle(track.source[0])
    return (track.source as string) || "track"
  } else return "track"
}
