import { State } from "./State";

export abstract class Recognizer {
  private value = "";

  protected constructor(private currentState: State) {}

  next(symbol: string): boolean {
    const nextState = this.currentState.next(symbol);

    if (!nextState) {
      return false;
    }

    this.currentState = nextState;
    this.value += symbol;

    return true;
  }

  get result() {
    return { recognized: this.currentState.isFinal, value: this.value };
  }
}
