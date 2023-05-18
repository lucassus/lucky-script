import { Recognizer } from "./Recognizer";
import { Case } from "./state/Case";
import { Digits, Dot, NonZeroDigits, Separator, ZeroDigit } from "../symbols";

const beginNumber = new Case(0, false);
const zero = new Case(1, true);
const integer = new Case(2, true);
const beginIntegerSeparator = new Case(3, false);
const beginFractionalPart = new Case(4, false);
const numberWithFractionalPart = new Case(5, true);
const beginFractionalPartSeparator = new Case(6, false);
const invalid = new Case(10, false);

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
