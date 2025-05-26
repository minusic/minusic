import { StateHandler } from "../../src/core/state"

export class MockStateHandler extends StateHandler {
  public stateChanges: any[] = []

  setState(changes: any) {
    this.stateChanges.push(changes)
    super.setState(changes)
  }

  clearStateChanges() {
    this.stateChanges = []
  }
}
