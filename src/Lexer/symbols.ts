import { TokenType } from "./Token";

export const ZeroDigit = "0";
export const NonZeroDigits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
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

export const Letters = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

export const symbolToTokenType: ReadonlyMap<string, TokenType> = new Map([
  [Plus, TokenType.Plus],
  [Minus, TokenType.Minus],
  [Multiply, TokenType.Multiply],
  [Divide, TokenType.Divide],
  [Power, TokenType.Power],
  [LeftBracket, TokenType.LeftBracket],
  [RightBracket, TokenType.RightBracket],
]);
