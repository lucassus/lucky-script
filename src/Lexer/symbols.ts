import { charRange } from "./charRange";

const Whitespaces = [" ", "\t"];
const BeginComment = "#";

export const ZeroDigit = "0";
export const NonZeroDigits = charRange("1", "9");
export const Digits = [ZeroDigit, ...NonZeroDigits];
export const Separator = "_";
export const Dot = ".";

const SmallLetters = charRange("a", "z");
const CapitalLetters = charRange("A", "Z");
export const Letters = [...SmallLetters, ...CapitalLetters];

export const isWhitespace = (symbol: string): boolean =>
  Whitespaces.includes(symbol);

export const isBeginningOfComment = (symbol: string): boolean =>
  symbol === BeginComment;

export const isBeginningOfIdentifier = (symbol: string): boolean =>
  Letters.includes(symbol);

export const isBeginningOfNumber = (symbol: string): boolean =>
  [...Digits, Dot].includes(symbol);
