export function createElement(
  type: string,
  properties: {
    text?: string
    value?: string
    html?: string
    container?: HTMLElement
  } = {},
  attributes: { [key: string]: string | string[] } = {},
  events: { [key: string]: (event: Event) => {} | void } = {},
) {
  const element = document.createElement(type)
  properties.text && (element.innerText = properties.text)
  properties.container && properties.container.appendChild(element)
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, Array.isArray(value) ? value.join(" ") : value)
  })
  Object.entries(events).forEach(
    ([eventType, callback]: [string, (e: Event) => {} | void]) => {
      element.addEventListener(eventType, (event: Event) => callback(event))
    },
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

export function setStyle(
  element: HTMLElement,
  styles: { [key: string]: string },
) {
  for (const property in styles) {
    element.style.setProperty(property, styles[property])
  }
}
