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

export function wrapElement(container: HTMLElement, target: HTMLElement) {
  if (!target.parentNode) return
  target.parentNode.insertBefore(container, target)
  container.appendChild(target)
}

export function unwrapElement(container: HTMLElement, target: HTMLElement) {
  if (!container.parentNode) return
  container.parentNode.insertBefore(target, container)
  container.parentNode.removeChild(container)
}

export function applyStyles(
  element: HTMLElement,
  styles: { [key: string]: string },
) {
  Object.entries(styles).forEach(([property, value]) =>
    element.style.setProperty(property, value),
  )
}
