import { IllegalSymbolError } from "./errors";
import {
  CommentRecognizer,
  IdentifierRecognizer,
  NumeralRecognizer,
  Recognizer,
} from "./Recognizer";
import {
  Assigment,
  BeginComment,
  Brackets,
  Comma,
  Digits,
  Dot,
  keywordToTokenType,
  LeftBrace,
  Letters,
  Multiply,
  Newlines,
  Operators,
  Power,
  RightBrace,
  symbolToTokenType,
  Whitespaces,
} from "./symbols";
import { Token, TokenType } from "./Token";

export class Lexer {
  private position = -1;

  constructor(private readonly input: string) {}

  *tokenize(): Generator<Token> {
    while (true) {
      const nextToken = this.nextToken();

      yield nextToken;

      if (nextToken.type === TokenType.End) {
        break;
      }
    }
  }

  nextToken(): Token {
    this.advance();

    this.skipWhitespaces();

    if (this.currentSymbol === BeginComment) {
      this.skipComment();
    }

    if (this.currentSymbol === undefined) {
      return this.createToken(TokenType.End, "");
    }

    if (Newlines.includes(this.currentSymbol)) {
      return this.createToken(TokenType.NewLine, this.currentSymbol);
    }

    if (this.currentSymbol === Comma) {
      return this.createToken(TokenType.Comma, this.currentSymbol);
    }

    if (this.currentSymbol === LeftBrace) {
      return this.createToken(TokenType.LeftBrace, this.currentSymbol);
    }

    if (this.currentSymbol === RightBrace) {
      return this.createToken(TokenType.RightBrace, this.currentSymbol);
    }

    if (Letters.includes(this.currentSymbol)) {
      return this.recognizeKeywordOrIdentifier();
    }

    if ([...Digits, Dot].includes(this.currentSymbol)) {
      return this.recognizeNumber();
    }

    if (this.currentSymbol === Assigment) {
      return this.recognizeAssigment();
    }

    if (Operators.includes(this.currentSymbol)) {
      return this.recognizeOperator();
    }

    if (Brackets.includes(this.currentSymbol)) {
      return this.recognizeBrackets();
    }

    throw new IllegalSymbolError(this.currentSymbol, this.position);
  }

  private advance() {
    this.position += 1;
  }

  private get currentSymbol(): string {
    return this.input[this.position];
  }

  private get nextSymbol(): string | undefined {
    return this.input[this.position + 1];
  }

  private skipWhitespaces(): void {
    while (Whitespaces.includes(this.currentSymbol)) {
      this.advance();
    }
  }

  private skipComment(): void {
    this.recognizeWith(new CommentRecognizer());
    this.advance();
  }

  private recognizeNumber(): Token {
    const startPosition = this.position;
    const value = this.recognizeWith(new NumeralRecognizer());

    return this.createToken(TokenType.NumberLiteral, value, startPosition);
  }

  private recognizeKeywordOrIdentifier(): Token {
    const startPosition = this.position;
    const value = this.recognizeWith(new IdentifierRecognizer());
    const tokenType = keywordToTokenType.get(value) || TokenType.Identifier;

    return this.createToken(tokenType, value, startPosition);
  }

  private recognizeAssigment(): Token {
    return this.createToken(TokenType.Assigment, this.currentSymbol);
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

  private recognizeOperator(): Token {
    if (this.currentSymbol === Multiply && this.nextSymbol === Multiply) {
      const { position } = this;
      this.advance();

      return this.createToken(TokenType.Power, Power, position);
    }

    const tokenType = symbolToTokenType.get(this.currentSymbol);

    if (!tokenType) {
      throw new IllegalSymbolError(this.currentSymbol, this.position);
    }

    return this.createToken(tokenType, this.currentSymbol);
  }

  private recognizeBrackets(): Token {
    const tokenType = symbolToTokenType.get(this.currentSymbol);

    if (!tokenType) {
      throw new IllegalSymbolError(this.currentSymbol, this.position);
    }

    return this.createToken(tokenType, this.currentSymbol);
  }

  private createToken(
    type: TokenType,
    value: string,
    startPosition?: undefined | number
  ): Token {
    return new Token(type, value, startPosition ?? this.position);
  }
}
