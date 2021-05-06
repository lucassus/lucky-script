import { Token, TokenType } from "./Token";

type Rule = (value: string) => Token;

export class Tokenizer {
  private position = -1;

  private rules: [string | RegExp, undefined | Rule][] = [];

  constructor(private expression: string) {
    this.addRule(/^\s+/);
    this.addRule("(", () => this.createToken("("));
    this.addRule(")", () => this.createToken(")"));
    this.addRule("+", () => this.createToken("+"));
    this.addRule("-", () => this.createToken("-"));
    this.addRule("**", () => this.createToken("**"));
    this.addRule("*", () => this.createToken("*"));
    this.addRule("/", () => this.createToken("/"));
    this.addRule(/^\d+/, (value) =>
      this.createToken("number", parseFloat(value))
    );
    this.addRule(/^\w+/, (value) => this.createToken("identifier", value));
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    this.position = 0;
    while (!this.isEnd()) {
      const rest = this.expression.slice(this.position);

      for (const [pattern, rule] of this.rules) {
        let matchedText: undefined | string;

        if (typeof pattern === "string") {
          if (rest.startsWith(pattern)) {
            matchedText = pattern;
          }
        } else {
          const result = rest.match(pattern);
          if (result) {
            matchedText = result[0];
          }
        }

        if (matchedText) {
          if (rule) {
            tokens.push(rule(matchedText));
          }

          this.position += matchedText.length;
          break;
        }
      }

      // throw new Error(`Unrecognized character ${rest}!`);
    }

    tokens.push(new Token(this.position, "eof"));

    return tokens;
  }

  private addRule(pattern: string | RegExp, rule?: Rule): void {
    this.rules.push([pattern, rule]);
  }

  private createToken(type: TokenType, value?: string | number): Token {
    return new Token(this.position, type, value);
  }

  private isEnd(): boolean {
    return this.position >= this.expression.length;
  }
}
