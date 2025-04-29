import { CSSClass, RangeShape } from "../enums"
import { createButton, createElement } from "../utils/dom/elements"
import { createProgressContainer } from "./ProgressBar"
import { createSoundBar } from "./SoundBar"
import { createTimeDisplay } from "./TimeDisplay"
import { createMetadata } from "./Metadata"
import { createPlaylist } from "./Playlist"
import CircularProgress from "./ui/circularProgress"
import Progress from "./ui/progress"
import CircularRange from "./ui/circularRange"
import Range from "./ui/range"
import { Controls, Elements, PlayerConfiguration } from "../types"
import Minusic from "../core/minusic"
import { DropdownMenu, MenuItem } from "./Menu"
import { PlayBackSpeedButton } from "./buttons/playback-speed"

export function createPlayerElements(
  container: HTMLElement,
  controlsContainer: HTMLElement,
  options: PlayerConfiguration,
  player: Minusic,
): Elements {
  const progressContainer =
    options.controls.timeBar || options.controls.bufferBar
      ? createProgressContainer(controlsContainer)
      : null
  const { controls } = options

  return {
    container,
    controls: controlsContainer,
    buttons: createControlButtons(controlsContainer, controls, options, player),
    progress: {
      ...createTimeBar(progressContainer, options, player),
      bufferBar: createBufferBar(progressContainer, options),
      currentTime: controls.currentTime
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
    playlist: createPlaylist(container, options, player),
    soundBar: controls.soundBar
      ? createSoundBar(controlsContainer, options, player)
      : null,
    ...createMetadata(container, options),
  }
}

function createControlButtons(
  controlsContainer: HTMLElement,
  controls: PlayerConfiguration["controls"],
  options: PlayerConfiguration,
  player: Minusic,
): Elements["buttons"] {
  const menuItems: MenuItem[] = [
    { text: "Download", action: () => console.log("Exit application") },
    {
      text: "Playback speed",
      subItems: [
        { text: "0.25x", action: () => console.log("Copy") },
        { text: "0.5x", action: () => console.log("Copy") },
        { text: "0.75x", action: () => console.log("Paste") },
        { text: "1x", action: () => console.log("Paste") },
        { text: "1.25x", action: () => console.log("Paste") },
        { text: "1.5x", action: () => console.log("Paste") },
        { text: "1.75x", action: () => console.log("Paste") },
        { text: "2x", action: () => console.log("Paste") },
      ],
    },
  ]
  const menu = new DropdownMenu("Menu", menuItems)
  menu.mount(controlsContainer)

  // prettier-ignore
  const buttonConfigs = [
    { key: "play", controlKey: "playButton", label: "Play", cssClass: CSSClass.PlayButton, handler: player.togglePlay },
    { key: "mute", controlKey: "muteButton", label: "Mute", cssClass: CSSClass.MuteButton, handler: player.toggleMute },
    { key: "previous", controlKey: "previousButton", label: "Previous track", cssClass: CSSClass.PreviousButton, handler: player.previousOrRestartTrack },
    { key: "next", controlKey: "nextButton", label: "Next track", cssClass: CSSClass.NextButton, handler: player.nextTrack },
    { key: "backward", controlKey: "backwardButton", label: "Backward", cssClass: CSSClass.BackwardButton, handler: player.backward },
    { key: "forward", controlKey: "forwardButton", label: "Forward", cssClass: CSSClass.ForwardButton, handler: player.forward },
    { key: "repeat", controlKey: "repeatButton", label: "Repeat", cssClass: CSSClass.RepeatButton, handler: player.toggleRepeat },
    { key: "random", controlKey: "randomButton", label: "Random", cssClass: CSSClass.RandomButton, handler: player.toggleRandom, },
  ]

  const standardButtons = buttonConfigs.reduce(
    (acc, config) => {
      const { key, controlKey, label, cssClass, handler } = config
      acc[key] = controls[controlKey as keyof Controls]
        ? createButton(controlsContainer, label, cssClass, handler.bind(player))
        : null
      return acc
    },
    {} as Record<string, HTMLElement | null>,
  )

  const specialButtons = {
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
    playbackSpeed:
      controls.playbackSpeedButton && options.playbackSpeed
        ? new PlayBackSpeedButton(
            options.playbackSpeed,
            player,
            controlsContainer,
          )
        : null,
    settings: menu,
  }

  return { ...standardButtons, ...specialButtons }
}

function createTimeBar(
  container: HTMLElement | null,
  options: PlayerConfiguration,
  player: Minusic,
) {
  if (!container || !options.controls.timeBar) return { timeBar: null }

  if (options.displayOptions.timeBar?.shape === RangeShape.Circle) {
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
        radius: options.displayOptions.timeBar.radius,
        startAngle: options.displayOptions.timeBar.startAngle,
        endAngle: options.displayOptions.timeBar.endAngle,
        clockwise: options.displayOptions.timeBar.clockwise,
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

function createBufferBar(
  container: HTMLElement | null,
  options: PlayerConfiguration,
) {
  if (!container || !options.controls.bufferBar) return null

  if (options.displayOptions.timeBar?.shape === RangeShape.Circle) {
    return new CircularProgress({
      container,
      cssClass: [CSSClass.BufferBar],
      radius: options.displayOptions.timeBar.radius,
      startAngle: options.displayOptions.timeBar.startAngle,
      endAngle: options.displayOptions.timeBar.endAngle,
      clockwise: options.displayOptions.timeBar.clockwise,
    })
  }
  return new Progress({
    container,
    cssClass: [CSSClass.BufferBar],
  })
}
