import { TrackInfo } from "../../src/types"

const createMockTrack = (id: number): TrackInfo => ({
  source: `track${id}.mp3`,
  metadata: {
    title: `Track ${id}`,
    artist: `Artist ${id}`,
    album: `Album ${id}`,
    duration: 180,
  },
  allowDownload: true,
})

export const createMockTracks = (count: number): TrackInfo[] =>
  Array.from({ length: count }, (_, i) => createMockTrack(i + 1))
