import { Token, TokenType } from "./Token";

const isDigit = (symbol: string): boolean => {
  return /^[0-9]$/.test(symbol);
};

const isCharacter = (symbol: string): boolean => {
  return /^[a-z]$/.test(symbol);
};

export class Tokenizer {
  private position = -1;

  constructor(private expression: string) {}

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (true) {
      const token = this.nextToken();

      tokens.push(token);

      if (token.type === "eof") {
        break;
      }
    }

    return tokens;
  }

  private nextToken(): Token {
    this.advance();
    this.skipWhitespaces();

    switch (this.currentSymbol) {
      case "+":
        return this.createToken("+");
      case "-":
        return this.createToken("-");
      case "*": {
        if (this.nextSymbol === "*") {
          const token = this.createToken("**");
          this.advance();

          return token;
        }

        return this.createToken("*");
      }
      case "/":
        return this.createToken("/");
      case "(":
        return this.createToken("(");
      case ")":
        return this.createToken(")");
      default: {
        if (this.currentSymbol === undefined) {
          return this.createToken("eof");
        }

        if (isDigit(this.currentSymbol)) {
          return this.tokenizeNumber();
        }

        if (isCharacter(this.currentSymbol)) {
          return this.tokenizeIdentifier();
        }

        throw Error(
          `Unrecognized character ${this.currentSymbol} at ${this.position}`
        );
      }
    }
  }

  private advance() {
    this.position += 1;
  }

  private skipWhitespaces(): void {
    while (this.currentSymbol === " ") {
      this.advance();
    }
  }

  private get currentSymbol(): undefined | string {
    return this.expression[this.position];
  }

  private get nextSymbol(): undefined | string {
    return this.expression[this.position + 1];
  }

  private tokenizeNumber(): Token {
    const position = this.position;
    let text = this.currentSymbol!;

    while (this.nextSymbol !== undefined && isDigit(this.nextSymbol)) {
      this.advance();
      text += this.currentSymbol!;
    }

    return new Token(position, "number", parseFloat(text));
  }

  private tokenizeIdentifier(): Token {
    const position = this.position;
    let text = this.currentSymbol!;

    while (this.nextSymbol !== undefined && isCharacter(this.nextSymbol)) {
      this.advance();
      text += this.currentSymbol!;
    }

    return new Token(position, "identifier", text);
  }

  private createToken(type: TokenType, value?: string | number): Token {
    return new Token(this.position, type, value);
  }
}
