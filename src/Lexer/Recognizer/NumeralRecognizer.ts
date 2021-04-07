import { Digits, Dot, NonZeroDigits, Separator, ZeroDigit } from "../symbols";
import { Recognizer } from "./Recognizer";
import { State } from "./State";

const beginNumber = new State(0, false);
const zero = new State(1, true);
const integer = new State(2, true);
const beginIntegerSeparator = new State(3, false);
const beginFractionalPart = new State(4, false);
const numberWithFractionalPart = new State(5, true);
const beginFractionalPartSeparator = new State(6, false);
const invalid = new State(10, false);

beginNumber.on(ZeroDigit).switchTo(zero);
beginNumber.on(...NonZeroDigits).switchTo(integer);
beginNumber.on(Dot).switchTo(beginFractionalPart);
zero.on(Dot).switchTo(beginFractionalPart);
integer.on(...Digits).switchTo(integer);
integer.on(Dot).switchTo(beginFractionalPart);
integer.on(Separator).switchTo(beginIntegerSeparator);
beginIntegerSeparator.on(...Digits).switchTo(integer);
beginFractionalPart.on(...Digits).switchTo(numberWithFractionalPart);
numberWithFractionalPart.on(...Digits).switchTo(numberWithFractionalPart);
numberWithFractionalPart.on(Separator).switchTo(beginFractionalPartSeparator);
beginFractionalPartSeparator.on(...Digits).switchTo(numberWithFractionalPart);
zero.on(...Digits).switchTo(invalid);
numberWithFractionalPart.on(Dot).switchTo(invalid);

export class NumeralRecognizer extends Recognizer {
  constructor() {
    super(beginNumber);
  }
}
