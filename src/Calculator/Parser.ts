import { AstNode, BinaryOperation, NumberLiteral, UnaryOperation } from "./Ast";
import { Token, TokenType } from "./Token";

export class Parser {
  private position = 0;

  constructor(private tokens: Token[]) {}

  parse(): AstNode {
    return this.expression();
  }

  // term ((PLUS | MINUS) term)*
  private expression(): AstNode {
    let left = this.term();

    while (this.currentToken.type === "+" || this.currentToken.type === "-") {
      const operator = this.currentToken.type;
      this.consume(operator);

      left = new BinaryOperation(left, operator, this.term());
    }

    return left;
  }

  // factor ((MULTIPLY | DIVIDE) factor)*
  private term(): AstNode {
    let left = this.factor();

    while (this.currentToken.type === "*" || this.currentToken.type === "/") {
      const operator = this.currentToken.type;
      this.consume(operator);

      left = new BinaryOperation(left, operator, this.factor());
    }

    return left;
  }

  // : (PLUS | MINUS) factor
  // | power
  private factor(): AstNode {
    if (this.currentToken.type === "+" || this.currentToken.type === "-") {
      const operator = this.currentToken.type;
      this.consume(operator);

      return new UnaryOperation(operator, this.factor());
    }

    return this.power();
  }

  // primary (POWER factor)*
  private power(): AstNode {
    let left = this.primary();

    while (this.currentToken.type === "**") {
      this.consume("**");
      left = new BinaryOperation(left, "**", this.factor());
    }

    return left;
  }

  // : NUMBER
  // | group
  private primary(): AstNode {
    if (this.currentToken.type === "number") {
      const value = this.currentToken.value as number;
      this.consume("number");

      return new NumberLiteral(value);
    }

    if (this.currentToken.type === "(") {
      return this.group();
    }

    throw new Error(
      `Unexpected token ${this.currentToken.type} at position ${this.currentToken.position}.`
    );
  }

  // "(" expression ")"
  private group(): AstNode {
    this.consume("(");
    const expression = this.expression();
    this.consume(")");

    return expression;
  }

  private get currentToken(): Token {
    return this.tokens[this.position];
  }

  private consume(tokenType: TokenType): void {
    if (this.currentToken.type !== tokenType) {
      throw new Error(
        `Expected ${tokenType} but got ${this.currentToken.type} at position ${this.currentToken.position}.`
      );
    }

    this.advance();
  }

  private advance() {
    this.position += 1;
  }
}
