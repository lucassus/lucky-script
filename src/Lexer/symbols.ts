import { charRange } from "./charRange";
import { TokenType } from "./Token";

export const Whitespaces = [" ", "\t"];
export const Newlines = [";", "\n"];

export const ZeroDigit = "0";
export const NonZeroDigits = charRange("1", "9");
export const Digits = [ZeroDigit, ...NonZeroDigits];
export const Separator = "_";
export const Dot = ".";

export const Plus = "+";
export const Minus = "-";
export const Multiply = "*";
export const Divide = "/";
export const Power = "**";
export const Operations = [Plus, Minus, Multiply, Divide, Power];

export const LeftBracket = "(";
export const RightBracket = ")";
export const Brackets = [LeftBracket, RightBracket];

export const LeftBrace = "{";
export const RightBrace = "}";
export const Braces = [LeftBrace, RightBrace];

export const Assigment = "=";

const SmallLetters = charRange("a", "z");
const CapitalLetters = charRange("A", "Z");
export const Letters = [...SmallLetters, ...CapitalLetters];

export const symbolToTokenType: ReadonlyMap<string, TokenType> = new Map([
  [Plus, TokenType.Plus],
  [Minus, TokenType.Minus],
  [Multiply, TokenType.Multiply],
  [Divide, TokenType.Divide],
  [Power, TokenType.Power],
  [LeftBracket, TokenType.LeftBracket],
  [RightBracket, TokenType.RightBracket],
]);
