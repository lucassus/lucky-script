import { State } from "./State";

export abstract class Recognizer {
  protected constructor(private currentState: State) {}

  recognize(input: string): { recognized: boolean; value: string } {
    let value = "";

    for (const symbol of input) {
      const nextState = this.currentState.next(symbol);

      if (!nextState) {
        break;
      }

      value += symbol;
      this.currentState = nextState;
    }

    if (!this.currentState.isFinal) {
      return { recognized: false, value };
    }

    return { recognized: true, value };
  }
}
