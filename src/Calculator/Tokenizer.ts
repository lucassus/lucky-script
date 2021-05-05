export type TokenType =
  | "+"
  | "-"
  | "*"
  | "/"
  | "**"
  | "("
  | ")"
  | "number"
  | "eof";

export class Token {
  constructor(
    public position: number,
    public type: TokenType,
    public value?: number
  ) {}
}

const isDigit = (symbol: string): boolean => {
  return /^\d$/.test(symbol);
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
    let raw = this.currentSymbol!;

    while (this.nextSymbol !== undefined && isDigit(this.nextSymbol)) {
      this.advance();
      raw += this.currentSymbol!;
    }

    return new Token(position, "number", parseFloat(raw));
  }

  private createToken(type: TokenType, value?: number): Token {
    return new Token(this.position, type, value);
  }
}
