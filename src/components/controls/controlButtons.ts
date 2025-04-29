import {
  Controls,
  Elements,
  PlayerConfiguration,
  PlaybackSpeedConfiguration,
} from "../../types"
import { CSSClass } from "../../enums"
import { createButton, createElement } from "../../utils/dom/elements"
import { DropdownMenu } from "../ui/dropdown"
import { PlayBackSpeedButton } from "../buttons/playbackSpeed"
import MinusicCore from "../../core/minusicCore"

interface ButtonConfig {
  key: string
  controlKey: keyof Controls
  label: string
  cssClass: CSSClass
  handler: (...args: any[]) => any
}

export function createControlButtons(
  controlsContainer: HTMLElement,
  controls: PlayerConfiguration["controls"],
  options: PlayerConfiguration,
  player: MinusicCore,
): Elements["buttons"] {
  return {
    ...createStandardButtons(controlsContainer, controls, player),
    ...createSpecialButtons(controlsContainer, controls, options, player),
  }
}

function createStandardButtons(
  container: HTMLElement,
  controls: PlayerConfiguration["controls"],
  player: MinusicCore,
): Partial<Elements["buttons"]> {
  // prettier-ignore
  const buttonConfigs: ButtonConfig[] = [
    { key: "play", controlKey: "playButton", label: "Play", cssClass: CSSClass.PlayButton, handler: player.togglePlay },
    { key: "mute", controlKey: "muteButton", label: "Mute", cssClass: CSSClass.MuteButton, handler: player.toggleMute },
    { key: "previous", controlKey: "previousButton", label: "Previous track", cssClass: CSSClass.PreviousButton, handler: player.previousOrRestartTrack },
    { key: "next", controlKey: "nextButton", label: "Next track", cssClass: CSSClass.NextButton, handler: player.nextTrack },
    { key: "backward", controlKey: "backwardButton", label: "Backward", cssClass: CSSClass.BackwardButton, handler: player.backward },
    { key: "forward", controlKey: "forwardButton", label: "Forward", cssClass: CSSClass.ForwardButton, handler: player.forward },
    { key: "repeat", controlKey: "repeatButton", label: "Repeat", cssClass: CSSClass.RepeatButton, handler: player.toggleRepeat },
    { key: "random", controlKey: "randomButton", label: "Random", cssClass: CSSClass.RandomButton, handler: player.toggleRandom },
  ]

  return buttonConfigs.reduce(
    (acc, config) => {
      const { key, controlKey, label, cssClass, handler } = config
      acc[key] = controls[controlKey]
        ? createButton(container, label, cssClass, handler.bind(player))
        : null
      return acc
    },
    {} as Record<string, HTMLElement | null>,
  )
}

function createSpecialButtons(
  container: HTMLElement,
  controls: PlayerConfiguration["controls"],
  options: PlayerConfiguration,
  player: MinusicCore,
): Partial<Elements["buttons"]> {
  const specialButtons: Partial<Elements["buttons"]> = {
    download: createDownloadButton(container, controls),
    settings: createSettingsMenu(container),
  }

  if (controls.playbackSpeedButton && options.playbackSpeed) {
    specialButtons.playbackSpeed = createPlaybackSpeedButton(
      container,
      options.playbackSpeed,
      player,
    )
  }

  return specialButtons
}

function createDownloadButton(
  container: HTMLElement,
  controls: PlayerConfiguration["controls"],
): HTMLAnchorElement | null {
  if (!controls.downloadButton) return null

  return createElement(
    "a",
    { container },
    {
      class: [CSSClass.ControlButton, CSSClass.DownloadButton],
      href: "",
      download: "",
    },
  ) as HTMLAnchorElement
}

function createPlaybackSpeedButton(
  container: HTMLElement,
  config: PlaybackSpeedConfiguration,
  player: MinusicCore,
) {
  return new PlayBackSpeedButton(config, player, container)
}

function createSettingsMenu(container: HTMLElement) {
  const menuItems = createSettingsMenuItems()
  const menu = new DropdownMenu("Menu", menuItems)
  menu.mount(container)
  return menu
}

function createSettingsMenuItems() {
  return [
    {
      text: "Download",
      action: () => {
        const downloadLink = document.querySelector(
          `.${CSSClass.DownloadButton}`,
        ) as HTMLAnchorElement
        if (downloadLink) downloadLink.click()
      },
    },
    {
      text: "Playback speed",
      subItems: [
        { text: "0.25x", action: () => setPlaybackSpeed(0.25) },
        { text: "0.5x", action: () => setPlaybackSpeed(0.5) },
        { text: "0.75x", action: () => setPlaybackSpeed(0.75) },
        { text: "1x", action: () => setPlaybackSpeed(1) },
        { text: "1.25x", action: () => setPlaybackSpeed(1.25) },
        { text: "1.5x", action: () => setPlaybackSpeed(1.5) },
        { text: "1.75x", action: () => setPlaybackSpeed(1.75) },
        { text: "2x", action: () => setPlaybackSpeed(2) },
      ],
    },
  ]
}

function setPlaybackSpeed(speed: number) {
  //
}
