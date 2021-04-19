import { SyntaxError } from "./errors";
import {
  CommentRecognizer,
  IdentifierRecognizer,
  NumeralRecognizer,
  Recognizer,
} from "./Recognizer";
import {
  Assigment,
  Brackets,
  Digits,
  Dot,
  LeftBrace,
  Letters,
  Multiply,
  Newlines,
  Operators,
  Power,
  RightBrace,
  Whitespaces,
  symbolToTokenType,
  keywordToTokenType,
  BeginComment,
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

    if (this.position > this.input.length - 1) {
      return new Token(TokenType.End, "", this.position);
    }

    if (Newlines.includes(this.currentSymbol)) {
      return new Token(TokenType.NewLine, this.currentSymbol, this.position);
    }

    // TODO: Dry it, see `this.recognizeBrackets` or something similar
    if (this.currentSymbol === LeftBrace) {
      return new Token(TokenType.LeftBrace, this.currentSymbol, this.position);
    }

    if (this.currentSymbol === RightBrace) {
      return new Token(TokenType.RightBrace, this.currentSymbol, this.position);
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

    throw new SyntaxError(this.currentSymbol, this.position);
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

    return new Token(TokenType.NumberLiteral, value, startPosition);
  }

  private recognizeKeywordOrIdentifier(): Token {
    const startPosition = this.position;
    const value = this.recognizeWith(new IdentifierRecognizer());
    const tokenType = keywordToTokenType.get(value) || TokenType.Identifier;

    return new Token(tokenType, value, startPosition);
  }

  private recognizeAssigment(): Token {
    return new Token(TokenType.Assigment, this.currentSymbol, this.position);
  }

  private recognizeWith(recognizer: Recognizer): string {
    recognizer.next(this.currentSymbol);

    while (recognizer.next(this.nextSymbol)) {
      this.advance();
    }

    const { recognized, value } = recognizer.result;

    if (!recognized) {
      throw new SyntaxError(this.currentSymbol, this.position);
    }

    return value;
  }

  private recognizeOperator(): Token {
    if (this.currentSymbol === Multiply && this.nextSymbol === Multiply) {
      const { position } = this;
      this.advance();

      return new Token(TokenType.Power, Power, position);
    }

    const tokenType = symbolToTokenType.get(this.currentSymbol);

    if (!tokenType) {
      throw new SyntaxError(this.currentSymbol, this.position);
    }

    return new Token(tokenType, this.currentSymbol, this.position);
  }

  private recognizeBrackets(): Token {
    const tokenType = symbolToTokenType.get(this.currentSymbol);

    if (!tokenType) {
      throw new SyntaxError(this.currentSymbol, this.position);
    }

    return new Token(tokenType, this.currentSymbol, this.position);
  }
}
