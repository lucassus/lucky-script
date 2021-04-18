import { State } from "./State";

export class Case implements State {
  private readonly transitions = new Map<string, State>();

  constructor(public readonly name: number, public readonly isFinal: boolean) {}

  on(...symbols: string[]) {
    return {
      switchTo: (to: State) => {
        for (const symbol of symbols) {
          this.transitions.set(symbol, to);
        }
      },
    };
  }

  next(symbol: string): undefined | State {
    return this.transitions.get(symbol);
  }
}
