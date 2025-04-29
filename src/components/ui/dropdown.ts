import { CSSClass } from "../../enums"
import { createElement } from "../../utils/dom/elements"

export function createMenu(container: HTMLElement) {
  return createElement("div", { container }, { class: CSSClass.Controls })
}

export interface MenuItem {
  text: string
  subItems?: MenuItem[]
  action?: () => void
}

export class DropdownMenu {
  private button: HTMLButtonElement
  private menu: HTMLElement
  private container: HTMLElement
  private isOpen: boolean = false
  private menuStack: MenuItem[][] = []
  private currentMenuItems: MenuItem[] = []

  constructor(buttonText: string, menuItems: MenuItem[]) {
    this.container = document.createElement("div")
    this.container.classList.add("dropdown-container")
    this.container.style.position = "relative"

    this.button = document.createElement("button")
    //this.button.textContent = buttonText
    this.button.classList.add("dropdown-button")

    this.button.classList.add(CSSClass.ControlButton)
    this.button.classList.add(CSSClass.SettingsButton)

    this.menu = document.createElement("div")
    this.menu.classList.add("dropdown-menu")
    this.menu.style.display = "none"

    this.currentMenuItems = menuItems

    this.renderMenuItems(menuItems)

    this.button.addEventListener("click", (e) => {
      e.stopPropagation()
      this.toggleMenu()
    })

    document.addEventListener("click", (e) => {
      if (
        this.isOpen &&
        e.target !== this.button &&
        !this.menu.contains(e.target as Node)
      ) {
        this.closeMenu()
      }
    })

    window.addEventListener("resize", () => {
      if (this.isOpen) {
        this.positionMenu()
      }
    })

    window.addEventListener(
      "scroll",
      () => {
        if (this.isOpen) {
          this.positionMenu()
        }
      },
      true,
    )
  }

  private renderMenuItems(
    items: MenuItem[],
    addBackButton: boolean = false,
  ): void {
    this.menu.innerHTML = ""

    if (addBackButton) {
      const backButton = document.createElement("div")
      backButton.textContent = "← Back"
      backButton.classList.add("dropdown-item", "dropdown-back")
      this.menu.appendChild(backButton)

      backButton.addEventListener("click", (e) => {
        e.stopPropagation()
        this.navigateBack()
      })
    }

    items.forEach((item) => {
      const itemElement = document.createElement("div")
      itemElement.textContent = item.text
      itemElement.classList.add("dropdown-item")

      if (item.subItems && item.subItems.length > 0) {
        itemElement.classList.add("has-submenu")
        itemElement.innerHTML = `${item.text} <span class="submenu-arrow">›</span>`

        itemElement.addEventListener("click", (e) => {
          e.stopPropagation()
          this.navigateToSubmenu(item)
        })
      } else {
        itemElement.addEventListener("click", (e) => {
          e.stopPropagation()
          if (item.action) {
            item.action()
          }
          this.closeMenu()
        })
      }

      this.menu.appendChild(itemElement)
    })
  }

  private navigateToSubmenu(item: MenuItem): void {
    if (item.subItems && item.subItems.length > 0) {
      this.menuStack.push(this.currentMenuItems)
      this.currentMenuItems = item.subItems
      this.renderMenuItems(item.subItems, true)
    }
  }

  private navigateBack(): void {
    if (this.menuStack.length > 0) {
      const previousMenu = this.menuStack.pop()
      if (previousMenu) {
        this.currentMenuItems = previousMenu

        this.renderMenuItems(previousMenu, this.menuStack.length > 0)
      }
    }
  }

  private navigateToRoot(): void {
    while (this.menuStack.length > 0) this.navigateBack()
  }

  private positionMenu(): void {
    this.resetMenuPosition()

    const buttonRect = this.button.getBoundingClientRect()
    const menuRect = this.menu.getBoundingClientRect()

    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    const spaceBelow = viewportHeight - buttonRect.bottom
    const spaceAbove = buttonRect.top
    const spaceRight = viewportWidth - buttonRect.right
    const spaceLeft = buttonRect.left

    let verticalPosition: "top" | "bottom"
    if (spaceAbove >= menuRect.height || spaceAbove >= spaceBelow) {
      verticalPosition = "top"
    } else {
      verticalPosition = "bottom"
    }

    let horizontalPosition: "left" | "right" | "center"

    if (spaceRight >= menuRect.width) horizontalPosition = "left"
    else if (spaceLeft >= menuRect.width) horizontalPosition = "right"
    else horizontalPosition = "center"

    this.applyPosition(verticalPosition, horizontalPosition)
    this.adjustForOverflow()
  }

  private resetMenuPosition(): void {
    this.menu.style.top = ""
    this.menu.style.bottom = ""
    this.menu.style.left = ""
    this.menu.style.right = ""
    this.menu.style.transformOrigin = ""

    this.menu.classList.remove(
      "position-top",
      "position-bottom",
      "position-left",
      "position-right",
    )
  }

  private applyPosition(
    vertical: "top" | "bottom",
    horizontal: "left" | "right" | "center",
  ): void {
    this.menu.classList.add(`position-${vertical}`)

    if (vertical === "bottom") {
      this.menu.style.top = "100%"
    } else {
      this.menu.style.bottom = "100%"
    }

    if (horizontal === "left") {
      this.menu.style.left = "0"
    } else if (horizontal === "right") {
      this.menu.style.right = "0"
    } else {
      const buttonWidth = this.button.offsetWidth
      const menuWidth = this.menu.offsetWidth
      this.menu.style.left = `${(buttonWidth - menuWidth) / 2}px`
    }

    let origin = ""
    if (vertical === "top") origin += "bottom "
    else origin += "top "

    if (horizontal === "left") origin += "left"
    else if (horizontal === "right") origin += "right"
    else origin += "center"

    this.menu.style.transformOrigin = origin
  }

  private adjustForOverflow(): void {
    const menuRect = this.menu.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    if (menuRect.right > viewportWidth) {
      const overflow = menuRect.right - viewportWidth
      this.menu.style.left = `${parseInt(this.menu.style.left || "0") - overflow - 10}px`
    }
    if (menuRect.left < 0) this.menu.style.left = "10px"

    if (menuRect.bottom > viewportHeight) {
      const overflow = menuRect.bottom - viewportHeight
      if (this.menu.style.top) {
        this.menu.style.top = `${parseInt(this.menu.style.top) - overflow - 10}px`
      }
    }
    if (menuRect.top < 0) this.menu.style.top = "10px"
  }

  private toggleMenu(): void {
    if (this.isOpen) {
      this.closeMenu()
    } else {
      this.openMenu()
    }
  }

  private openMenu(): void {
    this.navigateToRoot()
    this.menu.style.display = "block"
    this.isOpen = true
    this.button.classList.add("active")

    this.positionMenu()

    while (this.menuStack.length > 0) {
      this.menuStack.pop()
    }
    this.renderMenuItems(this.currentMenuItems)
  }

  private closeMenu(): void {
    this.menu.style.display = "none"
    this.isOpen = false
    this.button.classList.remove("active")
  }

  public mount(parent: HTMLElement): void {
    this.container.appendChild(this.button)
    this.container.appendChild(this.menu)
    parent.appendChild(this.container)
    //parent.prepend(this.container)
  }

  public render() {
    return this.button
  }
}
