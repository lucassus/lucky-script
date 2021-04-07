import { Digits, Letters } from "../symbols";
import { Recognizer } from "./Recognizer";
import { State } from "./State";

const beginIdentifier = new State(0, false);
const identifier = new State(1, true);

beginIdentifier.on(...Letters).switchTo(identifier);
identifier.on(...Letters).switchTo(identifier);
identifier.on(...Digits).switchTo(identifier);

export class IdentifierRecognizer extends Recognizer {
  constructor() {
    super(beginIdentifier);
  }
}
