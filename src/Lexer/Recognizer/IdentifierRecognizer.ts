import { Recognizer } from "./Recognizer";
import { Case } from "./state/Case";
import { Digits, Letters } from "../symbols";

const beginIdentifier = new Case(0, false);
const identifier = new Case(1, true);

beginIdentifier.on(...Letters).switchTo(identifier);
identifier.on(...Letters).switchTo(identifier);
identifier.on(...Digits).switchTo(identifier);

export class IdentifierRecognizer extends Recognizer {
  constructor() {
    super(beginIdentifier);
  }
}
