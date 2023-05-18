import {
  BinaryOperation,
  BinaryOperator,
  Expression,
  FunctionCall,
  FunctionDeclaration,
  IfStatement,
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
import {
  Delimiter,
  Keyword,
  Literal,
  Operator,
  Token,
  TokenType,
} from "../Lexer";

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
        this.consume(Delimiter.NewLine);
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
      this.consume(Delimiter.NewLine);
    }
  }

  private statement(): Statement {
    if (this.currentToken.type === Keyword.Function) {
      return this.functionDeclaration();
    }

    if (this.currentToken.type === Keyword.If) {
      return this.ifStatement();
    }

    if (this.currentToken.type === Keyword.Return) {
      return this.returnStatement();
    }

    if (this.currentToken.type === Delimiter.LeftBrace) {
      return this.block();
    }

    return this.expression();
  }

  // : assigment
  // | anonymous_func
  // | comparison
  private expression(): Expression {
    if (
      this.currentToken.type === Literal.Identifier &&
      this.nextToken.type === Operator.Assigment
    ) {
      return this.assigment();
    }

    if (this.currentToken.type === Keyword.Function) {
      return this.anonymousFunction();
    }

    return this.comparison();
  }

  // arith_expression (("<=" | "<" | "==" | ">" | ">=") arith_expression)*
  private comparison(): Expression {
    return this.binaryOperation(
      this.arithmeticExpression,
      [Operator.Lte, Operator.Lt, Operator.Eq, Operator.Gt, Operator.Gte],
      this.arithmeticExpression
    );
  }

  private arithmeticExpression(): Expression {
    return this.binaryOperation(this.term, [Operator.Plus, Operator.Minus]);
  }

  // "function" IDENTIFIER "(" func_args ")" block
  private functionDeclaration(): FunctionDeclaration {
    this.consume(Keyword.Function);
    const name = this.consume(Literal.Identifier).value;

    this.consume(Delimiter.LeftBracket);
    const parameters = this.functionParameters();
    this.consume(Delimiter.RightBracket);

    return new FunctionDeclaration(name, parameters, this.block());
  }

  // "function" "(" func_parameters ")" block
  private anonymousFunction(): Expression {
    this.consume(Keyword.Function);

    this.consume(Delimiter.LeftBracket);
    const parameters = this.functionParameters();
    this.consume(Delimiter.RightBracket);

    return new FunctionDeclaration(undefined, parameters, this.block());
  }

  // (IDENTIFIER ("," IDENTIFIER)*)?
  private functionParameters(): string[] {
    if (this.currentToken.type === Delimiter.RightBracket) {
      return [];
    }

    const args: string[] = [this.consume(Literal.Identifier).value!];

    while (this.currentToken.type === Delimiter.Comma) {
      this.consume(Delimiter.Comma);
      args.push(this.consume(Literal.Identifier).value!);
    }

    return args;
  }

  // "if" "(" expression ")" block
  private ifStatement(): IfStatement {
    this.consume(Keyword.If);

    this.consume(Delimiter.LeftBracket);
    const condition = this.expression();
    this.consume(Delimiter.RightBracket);

    return new IfStatement(condition, this.block());
  }

  private returnStatement(): ReturnStatement {
    this.consume(Keyword.Return);
    return new ReturnStatement(this.expression());
  }

  private block(): Statement[] {
    if (this.nextToken.type === Delimiter.RightBrace) {
      this.consume(Delimiter.LeftBrace);
      this.consume(Delimiter.RightBrace);

      return [];
    }

    this.consume(Delimiter.LeftBrace);
    const statements = this.statements(Delimiter.RightBrace);
    this.consume(Delimiter.RightBrace);

    return statements;
  }

  // IDENTIFIER "(" func_call_args ")"
  private functionCall(): Expression {
    const name = this.consume(Literal.Identifier).value!;

    this.consume(Delimiter.LeftBracket);
    const args = this.functionCallArguments();
    this.consume(Delimiter.RightBracket);

    return new FunctionCall(name, args);
  }

  // (expression ("," expression)*)?
  private functionCallArguments(): Expression[] {
    if (this.currentToken.type === Delimiter.RightBracket) {
      return [];
    }

    const args = [this.expression()];

    while (this.currentToken.type === Delimiter.Comma) {
      this.consume(Delimiter.Comma);
      args.push(this.expression());
    }

    return args;
  }

  // IDENTIFIER "=" expression
  private assigment(): Expression {
    const name = this.consume(Literal.Identifier).value!;
    this.consume(Operator.Assigment);

    return new VariableAssigment(name, this.expression());
  }

  private term(): Expression {
    return this.binaryOperation(this.factor, [
      Operator.Multiply,
      Operator.Divide,
    ]);
  }

  private factor(): Expression {
    const tokenType = this.currentToken.type;

    if ([Operator.Plus, Operator.Minus].includes(tokenType)) {
      this.consume(tokenType);
      return new UnaryOperation(tokenType.name as UnaryOperator, this.factor());
    }

    return this.power();
  }

  private power(): Expression {
    return this.binaryOperation(this.atom, [Operator.Power], this.factor);
  }

  private atom(): Expression {
    const { currentToken } = this;

    if (currentToken.type === Literal.Number) {
      this.consume(Literal.Number);
      return new Numeral(currentToken.value!);
    }

    if (
      this.currentToken.type === Literal.Identifier &&
      this.nextToken.type === Delimiter.LeftBracket
    ) {
      return this.functionCall();
    }

    if (currentToken.type === Literal.Identifier) {
      const name = this.consume(Literal.Identifier).value!;
      return new VariableAccess(name);
    }

    if (currentToken.type === Delimiter.LeftBracket) {
      return this.group();
    }

    throw new SyntaxError(`Unexpected ${currentToken.type}.`);
  }

  private group(): Expression {
    this.consume(Delimiter.LeftBracket);
    const expression = this.expression();
    this.consume(Delimiter.RightBracket);

    return expression;
  }

  private binaryOperation(
    leftBranch: () => Expression,
    operators: Operator[],
    rightBranch?: () => Expression
  ): Expression {
    let left = leftBranch.apply(this);

    while (operators.includes(this.currentToken.type)) {
      const tokenType = this.currentToken.type;
      this.consume(tokenType);

      const right = (rightBranch || leftBranch).apply(this);
      left = new BinaryOperation(left, tokenType.name as BinaryOperator, right);
    }

    return left;
  }

  private consume(tokenType: TokenType): Token {
    if (this.currentToken.type !== tokenType) {
      throw new SyntaxError(
        `Expected ${tokenType} but got ${this.currentToken.type}.`
      );
    }

    const token = this.currentToken;
    this.lexer.advance();

    return token;
  }

  private get currentToken(): Token {
    return this.lexer.current;
  }

  private get nextToken(): Token {
    return this.lexer.next;
  }
}
