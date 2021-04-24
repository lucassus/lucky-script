import { Token } from "../Lexer";
import { TokenType } from "../Lexer/Token";
import {
  BinaryOperation,
  Expression,
  FunctionCall,
  FunctionDeclaration,
  Numeral,
  Program,
  ReturnStatement,
  Statement,
  UnaryOperation,
  VariableAccess,
  VariableAssigment,
} from "./AstNode";
import { Lookahead } from "./Lookahead";

export class Parser {
  private lexer: Lookahead<Token>;

  constructor(iterator: Iterator<Token>) {
    this.lexer = new Lookahead<Token>(iterator);
  }

  parse(): Program {
    return this.program();
  }

  private program(): Program {
    return new Program(this.statements(TokenType.End));
  }

  private statements(end: TokenType): Statement[] {
    this.discardNewLines();

    const statements: Statement[] = [];

    if (this.currentToken.type !== end) {
      statements.push(this.statement());

      while (this.currentToken.type != end) {
        this.match(TokenType.NewLine);
        this.discardNewLines();

        if (this.currentToken.type !== end) {
          statements.push(this.statement());
        }
      }
    }

    return statements;
  }

  private discardNewLines(): void {
    while (this.currentToken.type === TokenType.NewLine) {
      this.match(TokenType.NewLine);
    }
  }

  private statement(): Statement {
    if (this.currentToken.type === TokenType.Function) {
      return this.functionDeclaration();
    }

    if (this.currentToken.type === TokenType.Return) {
      return this.returnStatement();
    }

    if (this.currentToken.type === TokenType.LeftBrace) {
      return this.block();
    }

    return this.expression();
  }

  private expression(): Expression {
    if (
      this.currentToken.type === TokenType.Identifier &&
      this.nextToken.type === TokenType.Assigment
    ) {
      return this.variableAssigment();
    }

    if (this.currentToken.type === TokenType.Function) {
      return this.anonymousFunctionDeclaration();
    }

    return this.binaryOperation(this.term, [TokenType.Plus, TokenType.Minus]);
  }

  private functionDeclaration(): FunctionDeclaration {
    this.match(TokenType.Function);

    const name = this.currentToken.value;
    this.match(TokenType.Identifier);

    this.match(TokenType.LeftBracket);
    this.match(TokenType.RightBracket);

    return new FunctionDeclaration(name, this.block());
  }

  private anonymousFunctionDeclaration(): Expression {
    this.match(TokenType.Function);

    this.match(TokenType.LeftBracket);
    this.match(TokenType.RightBracket);

    return new FunctionDeclaration(undefined, this.block());
  }

  private returnStatement(): ReturnStatement {
    this.match(TokenType.Return);
    return new ReturnStatement(this.expression());
  }

  private block(): Statement[] {
    if (this.nextToken.type === TokenType.RightBrace) {
      this.match(TokenType.LeftBrace);
      this.match(TokenType.RightBrace);

      return [];
    }

    this.match(TokenType.LeftBrace);
    const statements = this.statements(TokenType.RightBrace);
    this.match(TokenType.RightBrace);

    return statements;
  }

  private functionCall(): Expression {
    const name = this.currentToken.value;
    this.match(TokenType.Identifier);

    this.match(TokenType.LeftBracket);
    this.match(TokenType.RightBracket);

    return new FunctionCall(name);
  }

  private variableAssigment(): Expression {
    const variableName = this.currentToken.value;

    this.match(TokenType.Identifier);
    this.match(TokenType.Assigment);

    return new VariableAssigment(variableName, this.expression());
  }

  private term(): Expression {
    return this.binaryOperation(this.factor, [
      TokenType.Multiply,
      TokenType.Divide,
    ]);
  }

  private factor(): Expression {
    const { currentToken } = this;

    if ([TokenType.Plus, TokenType.Minus].includes(currentToken.type)) {
      this.match(currentToken.type);
      return new UnaryOperation(currentToken.value, this.factor());
    }

    return this.power();
  }

  private power(): Expression {
    return this.binaryOperation(this.atom, [TokenType.Power], this.factor);
  }

  private atom(): Expression {
    const { currentToken } = this;

    if (currentToken.type === TokenType.NumberLiteral) {
      this.match(TokenType.NumberLiteral);
      return new Numeral(currentToken.value);
    }

    if (
      this.currentToken.type === TokenType.Identifier &&
      this.nextToken.type === TokenType.LeftBracket
    ) {
      return this.functionCall();
    }

    if (currentToken.type === TokenType.Identifier) {
      this.match(TokenType.Identifier);
      return new VariableAccess(currentToken.value);
    }

    if (currentToken.type === TokenType.LeftBracket) {
      return this.group();
    }

    throw new Error(`Unexpected token ${currentToken.type}`);
  }

  private group(): Expression {
    this.match(TokenType.LeftBracket);
    const expression = this.expression();
    this.match(TokenType.RightBracket);

    return expression;
  }

  private binaryOperation(
    leftBranch: () => Expression,
    operations: TokenType[],
    rightBranch?: () => Expression
  ): Expression {
    let left = leftBranch.apply(this);

    while (operations.includes(this.currentToken.type)) {
      const operationToken = this.currentToken;
      this.match(operationToken.type);

      const right = (rightBranch || leftBranch).apply(this);
      left = new BinaryOperation(left, operationToken.value, right);
    }

    return left;
  }

  private match(tokenType: TokenType): void {
    if (this.currentToken.type !== tokenType) {
      throw new SyntaxError(
        `Expecting ${tokenType} but got ${this.currentToken.type}`
      );
    }

    this.lexer.advance();
  }

  private get currentToken(): Token {
    return this.lexer.current;
  }

  private get nextToken(): Token {
    return this.lexer.next;
  }
}
