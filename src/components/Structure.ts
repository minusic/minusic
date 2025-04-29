import { CSSClass } from "../enums"
import { PlayerConfiguration } from "../types"

export function buildPlayerStructure() {
  const container = document.createElement("div")
  container.className = CSSClass.Container

  const controls = document.createElement("div")
  controls.className = CSSClass.Controls

  container.appendChild(controls)

  return { container, controls }
}
