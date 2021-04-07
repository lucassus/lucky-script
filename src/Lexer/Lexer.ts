import { SyntaxError } from "./errors";
import { NumeralRecognizer } from "./Recognizer";
import { IdentifierRecognizer } from "./Recognizer/IdentifierRecognizer";
import { Recognizer } from "./Recognizer/Recognizer";
import {
  Assigment,
  Brackets,
  Digits,
  Dot,
  LeftBrace,
  Letters,
  Multiply,
  Newlines,
  Operations,
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

    if (this.position > this.input.length - 1) {
      return new Token(TokenType.End, "", this.position);
    }

    if (Newlines.includes(this.currentSymbol)) {
      return new Token(TokenType.NewLine, this.currentSymbol, this.position);
    }

    // TODO: Is it a good idea?
    const keywordFunction = "function";
    if (this.remainingInput.startsWith(keywordFunction)) {
      const { position } = this;
      this.position += keywordFunction.length;

      return new Token(TokenType.Function, keywordFunction, position);
    }

    // TODO: Dry it, see `this.recognizeBrackets` or something similar
    if (this.currentSymbol === LeftBrace) {
      return new Token(TokenType.LeftBrace, this.currentSymbol, this.position);
    }

    if (this.currentSymbol === RightBrace) {
      return new Token(TokenType.RightBrace, this.currentSymbol, this.position);
    }

    if (Letters.includes(this.currentSymbol)) {
      return this.recognizeIdentifier();
    }

    if ([...Digits, Dot].includes(this.currentSymbol)) {
      return this.recognizeNumber();
    }

    if (this.currentSymbol === Assigment) {
      return this.recognizeAssigment();
    }

    if (Operations.includes(this.currentSymbol)) {
      return this.recognizeOperation();
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

  private get nextSymbol(): string {
    return this.input[this.position + 1];
  }

  private get remainingInput(): string {
    return this.input.substr(this.position);
  }

  private skipWhitespaces() {
    while (Whitespaces.includes(this.currentSymbol)) {
      this.advance();
    }
  }

  private recognizeNumber(): Token {
    return this.recognizeWith(new NumeralRecognizer(), TokenType.NumberLiteral);
  }

  private recognizeIdentifier(): Token {
    return this.recognizeWith(new IdentifierRecognizer(), TokenType.Identifier);
  }

  private recognizeAssigment(): Token {
    return new Token(TokenType.Assigment, this.currentSymbol, this.position);
  }

  private recognizeWith(recognizer: Recognizer, tokenType: TokenType): Token {
    const { position: startPosition } = this;

    // TODO: Do not use `remainingInput` here ;)
    const { recognized, value } = recognizer.recognize(this.remainingInput);

    const offset = value.length - 1;
    this.position += offset;

    if (!recognized) {
      throw new SyntaxError(this.currentSymbol, this.position);
    }

    return new Token(tokenType, value, startPosition);
  }

  private recognizeOperation(): Token {
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
