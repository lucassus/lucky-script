import { State } from "./state/State";

export abstract class Recognizer {
  protected value = "";

  protected constructor(protected currentState: State) {}

  next(symbol: undefined | string): boolean {
    const nextState = symbol && this.currentState.next(symbol);

    if (!nextState) {
      return false;
    }

    this.currentState = nextState;
    this.value += symbol;

    return true;
  }

  get result() {
    return {
      recognized: this.currentState.isFinal,
      value: this.value,
    };
  }
}
