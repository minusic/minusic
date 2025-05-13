import { CSSClass, RangeShape } from "../../enums"
import { PlayerConfiguration } from "../../types"
import { createTimeDisplay } from "../timeDisplay"
import CircularProgress from "../ui/circularProgress"
import Progress from "../ui/progress"
import CircularRange from "../ui/circularRange"
import Range from "../ui/range"
import Minusic from "../../core/minusic"

export function createProgressElements(
  controlsContainer: HTMLElement,
  progressContainer: HTMLElement | null,
  options: PlayerConfiguration,
  player: Minusic,
) {
  return {
    seekBar: createSeekBar(progressContainer, options, player)?.seekBar || null,
    bufferBar: createBufferBar(progressContainer, options),
    currentTime: options.controls.currentTime
      ? createTimeDisplay(
          controlsContainer,
          CSSClass.CurrentTime,
          "Current time",
        )
      : null,
    totalTime:
      !options.media.isLivestream && options.controls.duration
        ? createTimeDisplay(controlsContainer, CSSClass.TotalTime, "Total time")
        : null,
  }
}

function createSeekBar(
  container: HTMLElement | null,
  options: PlayerConfiguration,
  player: Minusic,
) {
  if (!container || !options.controls.seekBar) return null

  const { displayOptions } = options

  if (displayOptions.seekBar?.shape === RangeShape.Circle) {
    return {
      seekBar: new CircularRange({
        container,
        label: "Seek time",
        handler: (value: number) => {
          player.currentTime = (value * player.duration) / 100
        },
        min: 0,
        max: 100,
        step: 0.01,
        value: 0,
        cssClass: [CSSClass.SeekBar],
        radius: displayOptions.seekBar.radius,
        startAngle: displayOptions.seekBar.startAngle,
        endAngle: displayOptions.seekBar.endAngle,
        clockwise: displayOptions.seekBar.clockwise,
      }),
    }
  }

  const seekBar = new Range({
    container,
    cssClass: [CSSClass.SeekBar],
    label: "Seek time",
    min: 0,
    max: 100,
    step: 0.01,
    handler: (value: number) => {
      player.currentTime = (value * player.duration) / 100
    },
    value: 0,
  })
  if (options.media.currentTrack?.metadata.waveform) {
    seekBar.background = options.media.currentTrack?.metadata.waveform
  }
  return { seekBar }
}

function createBufferBar(
  container: HTMLElement | null,
  options: PlayerConfiguration,
) {
  if (!container || !options.controls.bufferBar) return null

  const { displayOptions } = options

  if (displayOptions.seekBar?.shape === RangeShape.Circle) {
    return new CircularProgress({
      container,
      cssClass: [CSSClass.BufferBar],
      radius: displayOptions.seekBar.radius,
      startAngle: displayOptions.seekBar.startAngle,
      endAngle: displayOptions.seekBar.endAngle,
      clockwise: displayOptions.seekBar.clockwise,
    })
  }

  return new Progress({
    container,
    cssClass: [CSSClass.BufferBar],
  })
}
