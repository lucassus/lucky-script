import { IllegalSymbolError } from "./errors";
import {
  CommentRecognizer,
  IdentifierRecognizer,
  NumeralRecognizer,
  Recognizer,
} from "./Recognizer";
import { BeginComment, Digits, Dot, Letters, Whitespaces } from "./symbols";
import { Keywords, Token, TokenType } from "./Token";

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
      return this.createToken(TokenType.End);
    }

    switch (this.currentSymbol) {
      case "(":
        return this.createToken(TokenType.LeftBracket);
      case ")":
        return this.createToken(TokenType.RightBracket);
      case "{":
        return this.createToken(TokenType.LeftBrace);
      case "}":
        return this.createToken(TokenType.RightBrace);
      case ",":
        return this.createToken(TokenType.Comma);

      case "+":
        return this.createToken(TokenType.Plus);
      case "-":
        return this.createToken(TokenType.Minus);
      case "*": {
        if (this.nextSymbol === "*") {
          const token = this.createToken(TokenType.Power);
          this.advance();

          return token;
        }

        return this.createToken(TokenType.Multiply);
      }
      case "/":
        return this.createToken(TokenType.Divide);

      case "=":
        return this.createToken(TokenType.Assigment);

      case "\n":
      case ";":
        return this.createToken(TokenType.NewLine);

      default: {
        if (Letters.includes(this.currentSymbol)) {
          return this.recognizeKeywordOrIdentifier();
        }

        if ([...Digits, Dot].includes(this.currentSymbol)) {
          return this.recognizeNumber();
        }

        throw new IllegalSymbolError(this.currentSymbol, this.position);
      }
    }
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

    return this.createToken(TokenType.NumberLiteral, startPosition, value);
  }

  private recognizeKeywordOrIdentifier(): Token {
    const startPosition = this.position;
    const value = this.recognizeWith(new IdentifierRecognizer());
    const tokenType = Keywords.get(value) || TokenType.Identifier;

    return this.createToken(
      tokenType,
      startPosition,
      tokenType === TokenType.Identifier ? value : undefined
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

  private createToken(
    type: TokenType,
    startPosition?: number | undefined,
    value?: string
  ): Token {
    return new Token(type, startPosition ?? this.position, value);
  }
}
