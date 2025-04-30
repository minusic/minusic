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
  const { controls, livestream } = options

  return {
    timeBar: createTimeBar(progressContainer, options, player)?.timeBar || null,
    bufferBar: createBufferBar(progressContainer, options),
    currentTime: controls.currentTime
      ? createTimeDisplay(
          controlsContainer,
          CSSClass.CurrentTime,
          "Current time",
        )
      : null,
    totalTime:
      !livestream && controls.endTime
        ? createTimeDisplay(controlsContainer, CSSClass.TotalTime, "Total time")
        : null,
  }
}

function createTimeBar(
  container: HTMLElement | null,
  options: PlayerConfiguration,
  player: Minusic,
) {
  if (!container || !options.controls.timeBar) return null

  const { displayOptions } = options

  if (displayOptions.timeBar?.shape === RangeShape.Circle) {
    return {
      timeBar: new CircularRange({
        container,
        label: "Seek time",
        handler: (value: number) => {
          player.currentTime = (value * player.duration) / 100
        },
        min: 0,
        max: 100,
        step: 0.01,
        value: 0,
        cssClass: [CSSClass.TimeBar],
        radius: displayOptions.timeBar.radius,
        startAngle: displayOptions.timeBar.startAngle,
        endAngle: displayOptions.timeBar.endAngle,
        clockwise: displayOptions.timeBar.clockwise,
      }),
    }
  }

  return {
    timeBar: new Range({
      container,
      cssClass: [CSSClass.TimeBar],
      label: "Seek time",
      min: 0,
      max: 100,
      step: 0.01,
      handler: (value: number) => {
        player.currentTime = (value * player.duration) / 100
      },
      value: 0,
    }),
  }
}

function createBufferBar(
  container: HTMLElement | null,
  options: PlayerConfiguration,
) {
  if (!container || !options.controls.bufferBar) return null

  const { displayOptions } = options

  if (displayOptions.timeBar?.shape === RangeShape.Circle) {
    return new CircularProgress({
      container,
      cssClass: [CSSClass.BufferBar],
      radius: displayOptions.timeBar.radius,
      startAngle: displayOptions.timeBar.startAngle,
      endAngle: displayOptions.timeBar.endAngle,
      clockwise: displayOptions.timeBar.clockwise,
    })
  }

  return new Progress({
    container,
    cssClass: [CSSClass.BufferBar],
  })
}
