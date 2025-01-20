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
