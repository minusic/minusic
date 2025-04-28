import { Button } from "./button"

interface ToggleOption {
  label: string
  value: string | number
}

interface ToggleButtonParams {
  options: ToggleOption[]
  container?: HTMLElement
  callback?: (value: any) => void
  defaultValue?: string | number
  cssClass?: string
}

export class ToggleButton {
  private options: ToggleOption[]
  private currentIndex: number = 0
  private button: Button
  private callback?: (value: any) => void

  constructor(params: ToggleButtonParams) {
    const { options, container, callback, defaultValue, cssClass } = params

    if (options.length < 2) {
      throw new Error(
        "ToggleButton requires at least two options to toggle between.",
      )
    }

    this.options = options
    this.button = new Button({
      container,
      callback: this.handleClick.bind(this),
      cssClass,
    })

    if (defaultValue !== undefined) {
      const index = this.options.findIndex(
        (option) => option.value === defaultValue,
      )
      this.currentIndex = index !== -1 ? index : 0
    }

    if (callback) {
      this.callback = callback
    }

    this.updateButton()
  }

  private handleClick(): void {
    this.currentIndex = (this.currentIndex + 1) % this.options.length
    this.emitChange()
    this.updateButton()
  }

  private emitChange(): void {
    const currentValue = this.options[this.currentIndex].value
    if (this.callback) {
      this.callback(currentValue)
    }
  }

  private updateButton(): void {
    const currentOption = this.options[this.currentIndex]
    this.button.text = currentOption.label
  }

  public render(): HTMLButtonElement {
    return this.button.render()
  }

  public setValue(value: string | number): void {
    const index = this.options.findIndex((option) => option.value === value)
    if (index !== -1) {
      this.currentIndex = index
      this.emitChange()
      this.updateButton()
    }
  }

  public getValue(): string | number {
    return this.options[this.currentIndex].value
  }
}
