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

      for (const [matcher, rule] of this.rules) {
        if (typeof matcher === "string") {
          const text = matcher;
          if (rest.startsWith(text)) {
            if (rule) {
              tokens.push(rule(text));
            }

            this.position += text.length;
            break;
          }
        } else {
          const result = rest.match(matcher);
          if (result) {
            const text = result[0];
            if (rule) {
              tokens.push(rule(text));
            }

            this.position += text.length;
            break;
          }
        }
      }

      // throw new Error(`Unrecognized character ${rest}!`);
    }

    tokens.push(new Token(this.position, "eof"));

    return tokens;
  }

  private addRule(matcher: string | RegExp, rule?: Rule): void {
    this.rules.push([matcher, rule]);
  }

  private createToken(type: TokenType, value?: string | number): Token {
    return new Token(this.position, type, value);
  }

  private isEnd(): boolean {
    return this.position >= this.expression.length;
  }
}
