import { charRange } from "./charRange";

export const Whitespaces = [" ", "\t"];
export const BeginComment = "#";

export const ZeroDigit = "0";
export const NonZeroDigits = charRange("1", "9");
export const Digits = [ZeroDigit, ...NonZeroDigits];
export const Separator = "_";
export const Dot = ".";

const SmallLetters = charRange("a", "z");
const CapitalLetters = charRange("A", "Z");
export const Letters = [...SmallLetters, ...CapitalLetters];
