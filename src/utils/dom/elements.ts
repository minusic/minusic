import { Button } from "../../components/buttons/button"
import { CSSClass } from "../../enums"

type ElementProperties = {
  text?: string
  value?: string
  html?: string
  container?: HTMLElement
}

type ElementEvents = {
  [K in keyof HTMLElementEventMap]?: (event: HTMLElementEventMap[K]) => void
}

type ElementAttributes = {
  [key: string]: string | string[]
}

type StyleProperties = {
  [key: string]: string
}

export function createElement(
  type: string,
  properties: ElementProperties = {},
  attributes: ElementAttributes = {},
  events: ElementEvents = {},
): HTMLElement {
  const element = document.createElement(type)

  if (properties.text) element.innerText = properties.text
  if (properties.container) properties.container.appendChild(element)
  if (properties.html) element.innerHTML = properties.html

  setAttributes(element, attributes)

  Object.entries(events).forEach(([type, handler]) => {
    element.addEventListener(type, handler as EventListener)
  })

  return element
}

export function createSVGElement(
  type: string,
  attributes: ElementAttributes = {},
): SVGElement {
  const element = document.createElementNS("http://www.w3.org/2000/svg", type)
  setAttributes(element, attributes)
  return element
}

export function createButton(
  container: HTMLElement,
  label: string,
  cssClass: CSSClass,
  onClick: () => void,
): HTMLButtonElement {
  const button = new Button({
    label,
    container,
    cssClass,
    callback: onClick,
  })

  return button.render()
}

export function createMenu(
  container: HTMLElement,
  label: string,
  options: string[],
  defaultValue: string,
  cssClass: CSSClass,
  onChange: (value: string) => void,
): { menu: HTMLElement; update: (value: string) => void } {
  const menu = createElement(
    "div",
    { container },
    {
      class: [CSSClass.Menu, cssClass],
      "aria-label": label,
      "aria-haspopup": "true",
    },
    {
      click: (e) => {
        if (e.target instanceof HTMLElement) {
          e.target.dataset.menuOpen = "true"
        }
      },
    },
  )

  const menuValue = createElement(
    "button",
    { container: menu, text: defaultValue },
    { class: [CSSClass.MenuValue] },
    { mousedown: toggleFocus, touchstart: toggleFocus },
  )

  const menuContent = createElement(
    "div",
    { container: menu },
    { class: [CSSClass.MenuContent], role: "menuitem" },
  )

  createElement(
    "div",
    { container: menuContent, text: label },
    { class: CSSClass.MenuTitle },
  )

  const update = (value: string) => {
    const previous = menu.querySelector(
      `.${CSSClass.MenuItemSelected}`,
    ) as HTMLElement

    if (previous) {
      previous.className = CSSClass.MenuItem
      previous.setAttribute("aria-selected", "false")
    }

    const current = menu.querySelector(`[data-value="${value}"]`) as HTMLElement
    if (current) {
      current.className = [CSSClass.MenuItem, CSSClass.MenuItemSelected].join(
        " ",
      )
      current.setAttribute("aria-selected", "true")
      menuValue.innerText = value
      onChange(value)
    }
  }

  options.forEach((option) => {
    createElement(
      "button",
      { container: menuContent, text: option },
      {
        class:
          option === defaultValue
            ? [CSSClass.MenuItem, CSSClass.MenuItemSelected]
            : [CSSClass.MenuItem],
        "aria-selected": option === defaultValue ? "true" : "false",
        role: "menuitem",
        "data-value": option,
      },
      {
        click: (e) => {
          e.preventDefault()
          update(option)

          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur()
          }
        },
      },
    )
  })

  return { menu, update }
}

export function wrapElement(container: HTMLElement, target: HTMLElement): void {
  if (!target.parentNode) return
  target.parentNode.insertBefore(container, target)
  container.appendChild(target)
}

export function unwrapElement(
  container: HTMLElement,
  target: HTMLElement,
): void {
  if (!container.parentNode) return
  container.parentNode.insertBefore(target, container)
  remove(container)
}

export function remove(element: HTMLElement): void {
  if (element.parentNode) {
    element.parentNode.removeChild(element)
  }
}

export function applyStyles(
  element: HTMLElement,
  styles: StyleProperties,
): void {
  Object.entries(styles).forEach(([property, value]) => {
    element.style.setProperty(property, value)
  })
}

export function toggleFocus(e: MouseEvent | TouchEvent): void {
  if (!e.target) return

  const target = e.target as HTMLElement
  e.preventDefault()

  if (document.activeElement === target) {
    target.blur()
  } else {
    target.focus()
  }
}

function setAttributes(element: Element, attributes: ElementAttributes) {
  Object.entries(attributes).forEach(([attribute, value]) =>
    element.setAttribute(
      attribute,
      Array.isArray(value) ? value.join(" ") : value,
    ),
  )
}
