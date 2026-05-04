import { Recognizer } from "./Recognizer";
import { Case } from "./state/Case";
import { State } from "./state/State";

const beginString = new Case(0, false);

const endString: State = {
  name: 3,
  isFinal: true,
  next: (): undefined => undefined,
};

// escape references inString by closure — inString is declared below and will
// be fully initialized before escape.next() is ever called.
const escape: State = {
  name: 2,
  isFinal: false,
  next: (symbol: string): State | undefined => {
    if (symbol === '"' || symbol === "\\" || symbol === "n") return inString;
    return undefined;
  },
};

const inString: State = {
  name: 1,
  isFinal: false,
  next(symbol: string): State | undefined {
    if (symbol === '"') return endString;
    if (symbol === "\\") return escape;
    return this;
  },
};

beginString.on('"').switchTo(inString);

export class StringRecognizer extends Recognizer {
  constructor() {
    super(beginString);
  }
}
