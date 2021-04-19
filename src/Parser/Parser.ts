import { Token } from "../Lexer";
import { TokenType } from "../Lexer/Token";
import {
  AstNode,
  BinaryOperation,
  FunctionCall,
  FunctionDeclaration,
  Numeral,
  Program,
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

  parse(): AstNode {
    return this.program();
  }

  private program(): Program {
    if (this.currentToken.type === TokenType.End) {
      return new Program([]);
    }

    const statements = this.statements(TokenType.End);
    this.match(TokenType.End);
    return new Program(statements);
  }

  private statements(end: TokenType): AstNode[] {
    const statements: AstNode[] = [this.statement()];

    while (this.currentToken.type !== end) {
      // TODO: A workaround for comments
      // TODO: Drop comments in Lexer?
      if (this.currentToken.type === TokenType.Comment) {
        this.match(TokenType.Comment);
        continue;
      }

      this.match(TokenType.NewLine);
      if (this.currentToken.type === end) {
        break;
      }

      statements.push(this.statement());
    }

    return statements;
  }

  private statement(): AstNode {
    if (this.currentToken.type === TokenType.NewLine) {
      this.match(TokenType.NewLine);
      return this.statement();
    }

    // if (this.currentToken.type === TokenType.Comment) {
    //   return this.comment();
    // }

    if (this.currentToken.type === TokenType.Function) {
      return this.functionDeclaration();
    }

    if (this.currentToken.type === TokenType.LeftBrace) {
      return this.block();
    }

    return this.expression();
  }

  private emptyStatement(): undefined {
    this.match(TokenType.NewLine);
    return undefined;
  }

  // private expressionStatement(): AstNode {
  //   const expression = this.expression();
  //
  //   if (this.currentToken.type === TokenType.NewLine) {
  //     this.match(TokenType.NewLine);
  //   }
  //
  //   return expression;
  // }

  private comment(): undefined {
    this.match(TokenType.Comment);
    return undefined;
  }

  private expression(): AstNode {
    if (
      this.currentToken.type === TokenType.Identifier &&
      this.nextToken.type === TokenType.Assigment
    ) {
      return this.assigment();
    }

    return this.binaryOperation(this.term, [TokenType.Plus, TokenType.Minus]);
  }

  private functionDeclaration(): AstNode {
    this.match(TokenType.Function);

    const name = this.currentToken.value;
    this.match(TokenType.Identifier);

    this.match(TokenType.LeftBracket);
    this.match(TokenType.RightBracket);

    return new FunctionDeclaration(name, this.block());
  }

  // TODO: Write a test for a function with empty body
  private block(): AstNode[] {
    this.match(TokenType.LeftBrace);
    const statements = this.statements(TokenType.RightBrace);
    this.match(TokenType.RightBrace);

    return statements;
  }

  private functionCall(): AstNode {
    const name = this.currentToken.value;
    this.match(TokenType.Identifier);

    this.match(TokenType.LeftBracket);
    this.match(TokenType.RightBracket);

    return new FunctionCall(name);
  }

  private assigment(): AstNode {
    const variableName = this.currentToken.value;

    this.match(TokenType.Identifier);
    this.match(TokenType.Assigment);

    return new VariableAssigment(variableName, this.expression());
  }

  private term(): AstNode {
    return this.binaryOperation(this.factor, [
      TokenType.Multiply,
      TokenType.Divide,
    ]);
  }

  private factor(): AstNode {
    const { currentToken } = this;

    if ([TokenType.Plus, TokenType.Minus].includes(currentToken.type)) {
      this.match(currentToken.type);
      return new UnaryOperation(currentToken.value, this.factor());
    }

    return this.power();
  }

  private power(): AstNode {
    return this.binaryOperation(this.atom, [TokenType.Power], this.factor);
  }

  private atom(): AstNode {
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

  private group(): AstNode {
    this.match(TokenType.LeftBracket);
    const expression = this.expression();
    this.match(TokenType.RightBracket);

    return expression;
  }

  private binaryOperation(
    leftBranch: () => AstNode,
    operations: TokenType[],
    rightBranch?: () => AstNode
  ): AstNode {
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
