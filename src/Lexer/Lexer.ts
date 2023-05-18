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
  private position = -1;
  private line = 0;
  private column = -1;
  private startLocation: Location;

  constructor(private readonly input: string) {
    this.startLocation = this.getCurrentLocation();
  }

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

    this.startLocation = this.getCurrentLocation();

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
      case "*":
        return this.createToken(
          this.nextSymbolMatches("*") ? Operator.Power : Operator.Multiply
        );
      case "/":
        return this.createToken(Operator.Divide);
      case "<":
        return this.createToken(
          this.nextSymbolMatches("=") ? Operator.Lte : Operator.Lt
        );
      case "=":
        return this.createToken(
          this.nextSymbolMatches("=") ? Operator.Eq : Operator.Assigment
        );
      case ">":
        return this.createToken(
          this.nextSymbolMatches("=") ? Operator.Gte : Operator.Gt
        );

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

  private nextSymbolMatches(symbol: string): boolean {
    if (this.nextSymbol === symbol) {
      this.advance();
      return true;
    }

    return false;
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
    const value = this.recognizeWith(new NumeralRecognizer());
    return this.createToken(Literal.Number, value);
  }

  private recognizeKeywordOrIdentifier(): Token {
    const value = this.recognizeWith(new IdentifierRecognizer());
    const tokenType = Keyword.fromString(value) || Literal.Identifier;

    return this.createToken(
      tokenType,
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

  private getCurrentLocation(): Location {
    return {
      position: this.position,
      line: this.line,
      column: this.column,
    };
  }

  private createToken(type: TokenType, value?: string): Token {
    return new Token(type, this.startLocation, value);
  }
}
