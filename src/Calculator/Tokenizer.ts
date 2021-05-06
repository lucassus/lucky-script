import { Token, TokenType } from "./Token";

type Pattern = string | RegExp;
type Rule = (match: string) => undefined | Token;

export class Tokenizer {
  private position = -1;

  private rules: [Pattern, Rule][] = [];

  constructor(private expression: string) {
    this.rule(/^\s+/, () => this.skip());
    this.rule("(", () => this.accept("("));
    this.rule(")", () => this.accept(")"));
    this.rule("+", () => this.accept("+"));
    this.rule("-", () => this.accept("-"));
    this.rule("**", () => this.accept("**"));
    this.rule("*", () => this.accept("*"));
    this.rule("/", () => this.accept("/"));
    this.rule(/^\d+/, (match) => this.accept("number", parseFloat(match)));
    this.rule(/^\w+/, (match) => this.accept("identifier", match));
  }

  tokenize(): Token[] {
    this.position = 0;

    const tokens: Token[] = [];

    while (!this.isEnd()) {
      const rest = this.expression.slice(this.position);

      let noMatchFound = true;

      for (const [pattern, rule] of this.rules) {
        const matchedText = this.test(pattern, rest);

        if (matchedText) {
          noMatchFound = false;

          const token = rule && rule(matchedText);
          if (token) {
            tokens.push(token);
          }

          this.position += matchedText.length;
          break;
        }
      }

      if (noMatchFound) {
        throw new Error(
          `Unrecognized character ${this.expression[this.position]}`
        );
      }
    }

    tokens.push(new Token(this.position, "eof"));

    return tokens;
  }

  private test(pattern: Pattern, text: string): string | undefined {
    if (typeof pattern === "string") {
      if (text.startsWith(pattern)) {
        return pattern;
      }
    } else {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return undefined;
  }

  private isEnd(): boolean {
    return this.position >= this.expression.length;
  }

  private rule(pattern: Pattern, rule: Rule): void {
    this.rules.push([pattern, rule]);
  }

  private accept(type: TokenType, value?: string | number): Token {
    return new Token(this.position, type, value);
  }

  private skip() {
    return undefined;
  }
}
