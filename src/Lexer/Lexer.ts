import { IllegalSymbolError } from "./errors";
import {
  CommentRecognizer,
  IdentifierRecognizer,
  NumeralRecognizer,
  Recognizer,
} from "./Recognizer";
import {
  isBeginningOfComment,
  isBeginningOfIdentifier,
  isBeginningOfNumber,
  isWhitespace,
} from "./symbols";
import {
  Delimiter,
  Keyword,
  Literal,
  Location,
  Operator,
  Token,
  TokenType,
} from "./Token";

export class Lexer {
  private line = 0;
  private column = -1;
  private position = -1;

  constructor(private readonly input: string) {}

  *tokenize(): Generator<Token> {
    while (true) {
      const nextToken = this.nextToken();

      yield nextToken;

      if (nextToken.type === Delimiter.End) {
        break;
      }
    }
  }

  nextToken(): Token {
    this.advance();

    this.skipWhitespaces();

    if (isBeginningOfComment(this.currentSymbol)) {
      this.skipComment();
    }

    if (this.currentSymbol === undefined) {
      return this.createToken(Delimiter.End);
    }

    switch (this.currentSymbol) {
      // Delimiters

      case "(":
        return this.createToken(Delimiter.LeftBracket);
      case ")":
        return this.createToken(Delimiter.RightBracket);
      case "{":
        return this.createToken(Delimiter.LeftBrace);
      case "}":
        return this.createToken(Delimiter.RightBrace);
      case ",":
        return this.createToken(Delimiter.Comma);

      case "\n":
      case ";":
        return this.createToken(Delimiter.NewLine);

      // Operators

      case "+":
        return this.createToken(Operator.Plus);
      case "-":
        return this.createToken(Operator.Minus);
      case "*": {
        if (this.nextSymbol === "*") {
          const token = this.createToken(Operator.Power);
          this.advance();

          return token;
        }

        return this.createToken(Operator.Multiply);
      }
      case "/":
        return this.createToken(Operator.Divide);
      case "=":
        return this.createToken(Operator.Assigment);

      // Literals

      default: {
        if (isBeginningOfIdentifier(this.currentSymbol)) {
          return this.recognizeKeywordOrIdentifier();
        }

        if (isBeginningOfNumber(this.currentSymbol)) {
          return this.recognizeNumber();
        }

        throw new IllegalSymbolError(this.currentSymbol, this.position);
      }
    }
  }

  private advance() {
    if (this.currentSymbol === "\n") {
      this.column = 0;
      this.line += 1;
    } else {
      this.column += 1;
    }

    this.position += 1;
  }

  private get currentSymbol(): string {
    return this.input[this.position];
  }

  private get nextSymbol(): string | undefined {
    return this.input[this.position + 1];
  }

  private skipWhitespaces(): void {
    while (isWhitespace(this.currentSymbol)) {
      this.advance();
    }
  }

  private skipComment(): void {
    this.recognizeWith(new CommentRecognizer());
    this.advance();
  }

  private recognizeNumber(): Token {
    const startPosition = this.getLocation();
    const value = this.recognizeWith(new NumeralRecognizer());

    return this.createToken(Literal.Number, startPosition, value);
  }

  private recognizeKeywordOrIdentifier(): Token {
    const startPosition = this.getLocation();
    const value = this.recognizeWith(new IdentifierRecognizer());
    const tokenType = Keyword.fromString(value) || Literal.Identifier;

    return this.createToken(
      tokenType,
      startPosition,
      tokenType === Literal.Identifier ? value : undefined
    );
  }

  private recognizeWith(recognizer: Recognizer): string {
    recognizer.next(this.currentSymbol);

    while (recognizer.next(this.nextSymbol)) {
      this.advance();
    }

    const { recognized, value } = recognizer.result;

    if (!recognized) {
      throw new IllegalSymbolError(this.currentSymbol, this.position);
    }

    return value;
  }

  private getLocation(): Location {
    return {
      position: this.position,
      line: this.line,
      column: this.column,
    };
  }

  private createToken(
    type: TokenType,
    startLocation?: Location,
    value?: string
  ): Token {
    const location = startLocation ? startLocation : this.getLocation();
    return new Token(type, location, value);
  }
}
