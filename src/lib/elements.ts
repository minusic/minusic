import { CSSClass } from "../enums"

export function createElement(
  type: string,
  properties: {
    text?: string
    value?: string
    html?: string
    container?: HTMLElement
  } = {},
  attributes: { [key: string]: string | string[] } = {},
  events: { [key: string]: (event: any) => void } = {},
) {
  const element = document.createElement(type)
  if (properties.text) element.innerText = properties.text
  if (properties.container) properties.container.appendChild(element)

  Object.entries(attributes).forEach(([key, value]) =>
    element.setAttribute(key, Array.isArray(value) ? value.join(" ") : value),
  )
  Object.entries(events).forEach(([type, handler]) =>
    element.addEventListener(type, (event) => handler(event)),
  )
  return element
}

export function createSVGElement(
  type: string,
  attributes: { [key: string]: string } = {},
) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", type)
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value)
  }
  return element
}

export function createButton(
  container: HTMLElement,
  label: string,
  cssClass: CSSClass,
  onClick: () => void,
) {
  return createElement(
    "button",
    { container },
    {
      class: [CSSClass.ControlButton, cssClass],
      "aria-label": label,
    },
    { click: onClick },
  )
}

export function createMenu(
  container: HTMLElement,
  label: string,
  options: string[],
  defaultValue: string,
  cssClass: CSSClass,
  onChange: (value: string) => void,
) {
  const menu = createElement(
    "div",
    { container },
    {
      class: [CSSClass.Menu, cssClass],
      "aria-label": label,
      "aria-haspopup": "true",
    },
    {
      click: (e) => (e.target.dataset.menuOpen = true),
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
  options.forEach((option) => {
    createElement(
      "button",
      { container: menuContent, text: option },
      {
        class:
          option === defaultValue
            ? [CSSClass.MenuItem, CSSClass.MenuItemSelected]
            : [CSSClass.MenuItem],
        role: "menuitem",
      },
      {
        click: (e) => {
          e.preventDefault()
          const previous = menu.querySelector(
            `.${CSSClass.MenuItemSelected}`,
          ) as HTMLElement
          previous.className = CSSClass.MenuItem

          const current = e.target as HTMLElement
          current.className = [
            CSSClass.MenuItem,
            CSSClass.MenuItemSelected,
          ].join(" ")

          menuValue.innerText = option
          onChange(option)
          document.activeElement instanceof HTMLElement &&
            document.activeElement.blur()
        },
      },
    )
  })
  return menu
}

export function wrapElement(container: HTMLElement, target: HTMLElement) {
  if (!target.parentNode) return
  target.parentNode.insertBefore(container, target)
  container.appendChild(target)
}

export function unwrapElement(container: HTMLElement, target: HTMLElement) {
  if (!container.parentNode) return
  container.parentNode.insertBefore(target, container)
  remove(container)
}

export function remove(element: HTMLElement) {
  if (element.parentNode !== null) element.parentNode.removeChild(element)
}

export function applyStyles(
  element: HTMLElement,
  styles: { [key: string]: string },
) {
  Object.entries(styles).forEach(([property, value]) =>
    element.style.setProperty(property, value),
  )
}

export function toggleFocus(e: MouseEvent | TouchEvent) {
  if (!e.target) return
  const target = e.target as HTMLElement
  e.preventDefault()
  if (document.activeElement === target) target.blur()
  else target.focus()
}
