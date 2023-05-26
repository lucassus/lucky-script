import { TokenType } from "./TokenType";

export class Token {
  constructor(
    public type: TokenType,
    public position: number,
    public value?: string | number
  ) {}
}
