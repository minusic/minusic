import { CSSClass } from "../enums"
import { createButton, createElement, createMenu } from "../lib/elements"
import { createProgressContainer } from "./ProgressBar"
import { createSoundBar } from "./SoundBar"
import { createTimeDisplay } from "./TimeDisplay"
import { createMetadata } from "./Metadata"
import { createPlaylist } from "./Playlist"
import CircularProgress from "../lib/ui/circularProgress"
import Progress from "../lib/ui/progress"
import CircularRange from "../lib/ui/circularRange"
import Range from "../lib/ui/range"
import { PlayerConfiguration } from "../types"

export function createPlayerElements(
  container: HTMLElement,
  controlsContainer: HTMLElement,
  options: PlayerConfiguration,
  player: any,
) {
  const progressContainer = createProgressContainer(controlsContainer)
  const { controls } = options

  return {
    container,
    controls: controlsContainer,
    buttons: createControlButtons(controlsContainer, controls, player),
    progress: {
      ...createTimeBar(progressContainer, options, player),
      bufferBar: createBufferBar(progressContainer, options),
      currentTime: controls.startTime
        ? createTimeDisplay(
            controlsContainer,
            CSSClass.CurrentTime,
            "Current time",
          )
        : null,
      totalTime:
        !options.livestream && controls.endTime
          ? createTimeDisplay(
              controlsContainer,
              CSSClass.TotalTime,
              "Total time",
            )
          : null,
    },
    livestream: options.livestream
      ? createElement(
          "div",
          { container: controlsContainer, text: "Live" },
          { class: CSSClass.Livestream },
        )
      : null,
    playlist: createPlaylist(container, options.tracks, player),
    soundBar: controls.soundBar
      ? createSoundBar(controlsContainer, options, player)
      : null,
    ...createMetadata(container, options),
  }
}

function createControlButtons(
  controlsContainer: HTMLElement,
  controls: any,
  player: any,
) {
  return {
    play: controls.playButton
      ? createButton(controlsContainer, "Play", CSSClass.PlayButton, () =>
          player.togglePlay(),
        )
      : null,
    mute: controls.muteButton
      ? createButton(controlsContainer, "Mute", CSSClass.MuteButton, () =>
          player.toggleMute(),
        )
      : null,
    previous: controls.previousButton
      ? createButton(
          controlsContainer,
          "Previous track",
          CSSClass.PreviousButton,
          () =>
            player.currentTime > 5
              ? (player.currentTime = 0)
              : player.previousTrack(),
        )
      : null,
    next: controls.nextButton
      ? createButton(controlsContainer, "Next track", CSSClass.NextButton, () =>
          player.nextTrack(),
        )
      : null,
    backward: controls.backwardButton
      ? createButton(
          controlsContainer,
          "Backward",
          CSSClass.BackwardButton,
          () => player.backward(),
        )
      : null,
    forward: controls.forwardButton
      ? createButton(controlsContainer, "Forward", CSSClass.ForwardButton, () =>
          player.forward(),
        )
      : null,
    repeat: controls.repeatButton
      ? createButton(controlsContainer, "Repeat", CSSClass.RepeatButton, () =>
          player.toggleRepeat(),
        )
      : null,
    random: controls.randomButton
      ? createButton(controlsContainer, "Random", CSSClass.RandomButton, () =>
          player.toggleRandom(),
        )
      : null,
    download: controls.downloadButton
      ? (createElement(
          "a",
          { container: controlsContainer },
          {
            class: [CSSClass.ControlButton, CSSClass.DownloadButton],
            href: "",
            download: "",
          },
        ) as HTMLAnchorElement)
      : null,
    playbackSpeed: controls.playbackSpeedButton
      ? createMenu(
          controlsContainer,
          "Speed",
          ["0.25", "0.5", "0.75", "1", "1.25", "1.5", "1.75", "2"],
          "1",
          CSSClass.PlaybackSpeedButton,
          (value: string) => {
            player.playbackRate = parseFloat(value)
          },
        )
      : null,
  }
}

function createTimeBar(
  container: HTMLElement,
  options: PlayerConfiguration,
  player: any,
) {
  if (!options.controls.timeBar) return { timeBar: null }

  if (options.displayOptions.circularTimeBar) {
    return {
      timeBar: new CircularRange({
        container,
        label: "Seek time",
        handler: (value: number) => {
          player.currentTime = Number(value * player.duration) / 100
        },
        min: 0,
        max: 100,
        step: 0.01,
        value: player.volume,
        cssClass: [CSSClass.TimeBar],
        radius: options.displayOptions.circularTimeBar.radius,
        startAngle: options.displayOptions.circularTimeBar.startAngle,
        endAngle: options.displayOptions.circularTimeBar.endAngle,
        clockwise: options.displayOptions.circularTimeBar.clockwise,
      }),
    }
  } else {
    return {
      timeBar: new Range({
        container,
        cssClass: [CSSClass.TimeBar],
        label: "Seek time",
        min: 0,
        max: 100,
        step: 0.01,
        handler: (value: number) => {
          player.currentTime = Number(value * player.duration) / 100
        },
        value: 0,
      }),
    }
  }
}

function createBufferBar(container: HTMLElement, options: PlayerConfiguration) {
  if (!options.controls.bufferBar) return null

  if (options.displayOptions.circularTimeBar) {
    return new CircularProgress({
      container,
      cssClass: [CSSClass.BufferBar],
      radius: options.displayOptions.circularTimeBar.radius,
      startAngle: options.displayOptions.circularTimeBar.startAngle,
      endAngle: options.displayOptions.circularTimeBar.endAngle,
      clockwise: options.displayOptions.circularTimeBar.clockwise,
    })
  }
  return new Progress({
    container,
    cssClass: [CSSClass.BufferBar],
  })
}
