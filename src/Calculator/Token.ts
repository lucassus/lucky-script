import { TokenType } from "./TokenType";

export class Token {
  constructor(
    public position: number,
    public type: TokenType,
    public value?: string | number
  ) {}
}
