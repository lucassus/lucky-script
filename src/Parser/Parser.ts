import {
  Token,
  TokenType,
  Delimiter,
  Keyword,
  Literal,
  Operator,
} from "../Lexer";
import {
  BinaryOperation,
  BinaryOperator,
  Expression,
  FunctionCall,
  FunctionDeclaration,
  Numeral,
  Program,
  ReturnStatement,
  Statement,
  UnaryOperation,
  UnaryOperator,
  VariableAccess,
  VariableAssigment,
} from "./AstNode";
import { SyntaxError } from "./errors";
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
    return new Program(this.statements(Delimiter.End));
  }

  // _NEWLINE* statement? (_NEWLINE+ statement?)*
  private statements(end: TokenType): Statement[] {
    this.discardNewLines();

    const statements: Statement[] = [];

    if (this.currentToken.type !== end) {
      statements.push(this.statement());

      while (this.currentToken.type != end) {
        this.match(Delimiter.NewLine);
        this.discardNewLines();

        if (this.currentToken.type !== end) {
          statements.push(this.statement());
        }
      }
    }

    return statements;
  }

  private discardNewLines(): void {
    while (this.currentToken.type === Delimiter.NewLine) {
      this.match(Delimiter.NewLine);
    }
  }

  private statement(): Statement {
    if (this.currentToken.type === Keyword.Function) {
      return this.functionDeclaration();
    }

    if (this.currentToken.type === Keyword.Return) {
      return this.returnStatement();
    }

    if (this.currentToken.type === Delimiter.LeftBrace) {
      return this.block();
    }

    return this.expression();
  }

  private expression(): Expression {
    if (
      this.currentToken.type === Literal.Identifier &&
      this.nextToken.type === Operator.Assigment
    ) {
      return this.variableAssigment();
    }

    if (this.currentToken.type === Keyword.Function) {
      return this.anonymousFunctionDeclaration();
    }

    return this.binaryOperation(this.term, [Operator.Plus, Operator.Minus]);
  }

  // "function" IDENTIFIER "(" func_args ")" block
  private functionDeclaration(): FunctionDeclaration {
    this.match(Keyword.Function);

    const name = this.currentToken.value;
    this.match(Literal.Identifier);

    this.match(Delimiter.LeftBracket);
    const parameters = this.functionParameters();
    this.match(Delimiter.RightBracket);

    return new FunctionDeclaration(name, parameters, this.block());
  }

  // "function" "(" func_parameters ")" block
  private anonymousFunctionDeclaration(): Expression {
    this.match(Keyword.Function);

    this.match(Delimiter.LeftBracket);
    const parameters = this.functionParameters();
    this.match(Delimiter.RightBracket);

    return new FunctionDeclaration(undefined, parameters, this.block());
  }

  // (IDENTIFIER ("," IDENTIFIER)*)?
  private functionParameters(): string[] {
    if (this.currentToken.type === Delimiter.RightBracket) {
      return [];
    }

    const args: string[] = [this.currentToken.value!];
    this.match(Literal.Identifier);

    while (this.currentToken.type === Delimiter.Comma) {
      this.match(Delimiter.Comma);

      args.push(this.currentToken.value!);
      this.match(Literal.Identifier);
    }

    return args;
  }

  private returnStatement(): ReturnStatement {
    this.match(Keyword.Return);
    return new ReturnStatement(this.expression());
  }

  private block(): Statement[] {
    if (this.nextToken.type === Delimiter.RightBrace) {
      this.match(Delimiter.LeftBrace);
      this.match(Delimiter.RightBrace);

      return [];
    }

    this.match(Delimiter.LeftBrace);
    const statements = this.statements(Delimiter.RightBrace);
    this.match(Delimiter.RightBrace);

    return statements;
  }

  // IDENTIFIER "(" func_call_args ")"
  private functionCall(): Expression {
    const name = this.currentToken.value!;
    this.match(Literal.Identifier);

    this.match(Delimiter.LeftBracket);
    const args = this.functionCallArguments();
    this.match(Delimiter.RightBracket);

    return new FunctionCall(name, args);
  }

  // (expression ("," expression)*)?
  private functionCallArguments(): Expression[] {
    if (this.currentToken.type === Delimiter.RightBracket) {
      return [];
    }

    const args = [this.expression()];

    while (this.currentToken.type === Delimiter.Comma) {
      this.match(Delimiter.Comma);
      args.push(this.expression());
    }

    return args;
  }

  private variableAssigment(): Expression {
    const variableName = this.currentToken.value!;

    this.match(Literal.Identifier);
    this.match(Operator.Assigment);

    return new VariableAssigment(variableName, this.expression());
  }

  private term(): Expression {
    return this.binaryOperation(this.factor, [
      Operator.Multiply,
      Operator.Divide,
    ]);
  }

  private factor(): Expression {
    const token = this.currentToken;

    if ([Operator.Plus, Operator.Minus].includes(token.type)) {
      this.match(token.type);
      return new UnaryOperation(token.value as UnaryOperator, this.factor());
    }

    return this.power();
  }

  private power(): Expression {
    return this.binaryOperation(this.atom, [Operator.Power], this.factor);
  }

  private atom(): Expression {
    const { currentToken } = this;

    if (currentToken.type === Literal.Number) {
      this.match(Literal.Number);
      return new Numeral(currentToken.value!);
    }

    if (
      this.currentToken.type === Literal.Identifier &&
      this.nextToken.type === Delimiter.LeftBracket
    ) {
      return this.functionCall();
    }

    if (currentToken.type === Literal.Identifier) {
      this.match(Literal.Identifier);
      return new VariableAccess(currentToken.value!);
    }

    if (currentToken.type === Delimiter.LeftBracket) {
      return this.group();
    }

    throw new SyntaxError(`Unexpected token ${currentToken.type.name}`);
  }

  private group(): Expression {
    this.match(Delimiter.LeftBracket);
    const expression = this.expression();
    this.match(Delimiter.RightBracket);

    return expression;
  }

  private binaryOperation(
    leftBranch: () => Expression,
    operations: Operator[],
    rightBranch?: () => Expression
  ): Expression {
    let left = leftBranch.apply(this);

    while (operations.includes(this.currentToken.type)) {
      const token = this.currentToken;
      this.match(token.type);

      const right = (rightBranch || leftBranch).apply(this);
      left = new BinaryOperation(left, token.value as BinaryOperator, right);
    }

    return left;
  }

  private match(tokenType: TokenType): void {
    if (this.currentToken.type !== tokenType) {
      throw new SyntaxError(
        `Expecting ${tokenType.name} but got ${this.currentToken.type.name}`
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
