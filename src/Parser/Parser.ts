import type { Token, TokenType } from "../Lexer";
import { Delimiter, Keyword, Literal, Operator } from "../Lexer";
import type {
  BinaryOperator,
  Expression,
  Statement,
  UnaryOperator,
} from "./AstNode";
import {
  BinaryOperation,
  BooleanLiteral,
  BreakStatement,
  ContinueStatement,
  FunctionCall,
  FunctionDeclaration,
  IfStatement,
  NothingLiteral,
  Numeral,
  Program,
  ReturnStatement,
  StringLiteral,
  UnaryOperation,
  VariableAccess,
  VariableAssigment,
  WhileStatement,
} from "./AstNode";
import { SyntaxError } from "./errors";
import { Lookahead } from "./Lookahead";

export class Parser {
  private lexer: Lookahead<Token>;
  private loopDepth = 0;

  constructor(iterator: Iterator<Token>) {
    this.lexer = new Lookahead<Token>(iterator);
  }

  parse(): Program {
    return this.program();
  }

  private program(): Program {
    return new Program(this.statements(Delimiter.Eof));
  }

  private statements(endTokens: TokenType | TokenType[]): Statement[] {
    const ends = Array.isArray(endTokens) ? endTokens : [endTokens];
    this.discardNewLines();

    const statements: Statement[] = [];

    if (!ends.includes(this.currentToken.type)) {
      statements.push(this.statement());

      while (!ends.includes(this.currentToken.type)) {
        this.consume(Delimiter.NewLine);
        this.discardNewLines();

        if (!ends.includes(this.currentToken.type)) {
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
    if (
      this.currentToken.type === Keyword.Fun &&
      this.nextToken.type === Literal.Identifier
    ) {
      return this.functionDeclaration();
    }

    if (this.currentToken.type === Keyword.If) {
      return this.ifStatement();
    }

    if (this.currentToken.type === Keyword.While) {
      return this.whileStatement();
    }

    if (this.currentToken.type === Keyword.Break) {
      return this.breakStatement();
    }

    if (this.currentToken.type === Keyword.Continue) {
      return this.continueStatement();
    }

    if (this.currentToken.type === Keyword.Return) {
      return this.returnStatement();
    }

    if (this.currentToken.type === Keyword.Let) {
      return this.letAssignment();
    }

    return this.expression();
  }

  private letAssignment(): VariableAssigment {
    this.consume(Keyword.Let);
    const name = this.consume(Literal.Identifier).value!;

    const operator = this.currentToken.type;
    const binaryOp = this.toBinaryOp(operator);

    if (binaryOp) {
      this.consume(operator);
      const expr = this.expression();
      return new VariableAssigment(
        name,
        new BinaryOperation(new VariableAccess(name), binaryOp, expr),
        "declaration",
      );
    }

    this.consume(Operator.Assigment);
    return new VariableAssigment(name, this.expression(), "declaration");
  }

  private expression(): Expression {
    if (
      this.currentToken.type === Literal.Identifier &&
      (this.nextToken.type === Operator.Assigment ||
        this.nextToken.type === Operator.PlusAssign ||
        this.nextToken.type === Operator.MinusAssign ||
        this.nextToken.type === Operator.MultiplyAssign ||
        this.nextToken.type === Operator.DivideAssign)
    ) {
      return this.assigment();
    }

    if (
      this.currentToken.type === Keyword.Fun &&
      this.nextToken.type === Delimiter.LeftBracket
    ) {
      return this.anonymousFunction();
    }

    return this.orExpression();
  }

  private comparison(): Expression {
    return this.binaryOperation(
      () => this.arithmeticExpression(),
      [
        Operator.Lte,
        Operator.Lt,
        Operator.Eq,
        Operator.Neq,
        Operator.Gt,
        Operator.Gte,
      ],
    );
  }

  private notExpression(): Expression {
    if (this.currentToken.type === Keyword.Not) {
      this.consume(Keyword.Not);
      return new UnaryOperation("not", this.notExpression());
    }
    return this.comparison();
  }

  private orExpression(): Expression {
    return this.binaryOperation(() => this.andExpression(), [Keyword.Or]);
  }

  private andExpression(): Expression {
    return this.binaryOperation(() => this.notExpression(), [Keyword.And]);
  }

  private arithmeticExpression(): Expression {
    return this.binaryOperation(
      () => this.term(),
      [Operator.Plus, Operator.Minus],
    );
  }

  private functionDeclaration(): FunctionDeclaration {
    this.consume(Keyword.Fun);
    const name = this.consume(Literal.Identifier).value;

    this.consume(Delimiter.LeftBracket);
    const parameters = this.functionParameters();
    this.consume(Delimiter.RightBracket);

    this.discardNewLines();

    const savedDepth = this.loopDepth;
    this.loopDepth = 0;
    try {
      return new FunctionDeclaration(name, parameters, this.block());
    } finally {
      this.loopDepth = savedDepth;
    }
  }

  private anonymousFunction(): Expression {
    this.consume(Keyword.Fun);

    this.consume(Delimiter.LeftBracket);
    const parameters = this.functionParameters();
    this.consume(Delimiter.RightBracket);

    if (
      this.currentToken.type === Delimiter.NewLine ||
      this.currentToken.type === Keyword.End
    ) {
      const savedDepth = this.loopDepth;
      this.loopDepth = 0;
      try {
        return new FunctionDeclaration(undefined, parameters, this.block());
      } finally {
        this.loopDepth = savedDepth;
      }
    }

    const expr = this.expression();

    if (this.currentToken.type === Keyword.End) {
      throw new SyntaxError(
        "Short-form function must not be followed by 'end'. Use full form instead.",
      );
    }

    return new FunctionDeclaration(undefined, parameters, [
      new ReturnStatement(expr),
    ]);
  }

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

  private ifStatement(): IfStatement {
    this.consume(Keyword.If);

    const condition = this.expression();
    this.consumeConditionEnd();

    const thenBranch = this.statements([
      Keyword.ElseIf,
      Keyword.Else,
      Keyword.End,
    ]);
    this.discardNewLines();

    const elseBranch = this.tryParseElseBranch();

    this.consume(Keyword.End);
    return new IfStatement(condition, thenBranch, elseBranch);
  }

  private tryParseElseBranch(): Statement[] | undefined {
    this.discardNewLines();

    if (this.currentToken.type === Keyword.ElseIf) {
      return this.elseifBranch();
    }

    if (this.currentToken.type === Keyword.Else) {
      return this.parseElseBranch();
    }

    return undefined;
  }

  private elseifBranch(): Statement[] {
    this.consume(Keyword.ElseIf);

    const condition = this.expression();
    this.consumeConditionEnd();

    const body = this.statements([Keyword.ElseIf, Keyword.Else, Keyword.End]);
    this.discardNewLines();

    const elseBranch = this.tryParseElseBranch();
    return [new IfStatement(condition, body, elseBranch)];
  }

  private parseElseBranch(): Statement[] {
    this.consume(Keyword.Else);
    this.discardNewLines();

    if (this.currentToken.type === Keyword.If) {
      throw new SyntaxError("Expected 'elseif' instead of 'else if'.");
    }

    return this.statements(Keyword.End);
  }

  private breakStatement(): BreakStatement {
    this.consume(Keyword.Break);
    if (this.loopDepth === 0) {
      throw new SyntaxError("'break' used outside a loop");
    }
    return new BreakStatement();
  }

  private continueStatement(): ContinueStatement {
    this.consume(Keyword.Continue);
    if (this.loopDepth === 0) {
      throw new SyntaxError("'continue' used outside a loop");
    }
    return new ContinueStatement();
  }

  private returnStatement(): ReturnStatement {
    this.consume(Keyword.Return);
    return new ReturnStatement(this.expression());
  }

  private whileStatement(): WhileStatement {
    this.consume(Keyword.While);

    const condition = this.expression();
    this.consumeConditionEnd();

    this.loopDepth++;
    try {
      return new WhileStatement(condition, this.block());
    } finally {
      this.loopDepth--;
    }
  }

  private block(): Statement[] {
    const stmts = this.statements(Keyword.End);
    this.consume(Keyword.End);
    return stmts;
  }

  private consumeConditionEnd(): void {
    if (this.currentToken.type === Keyword.Then) {
      this.consume(Keyword.Then);
      this.discardNewLines();
    } else if (this.currentToken.type === Delimiter.NewLine) {
      this.consume(Delimiter.NewLine);
      this.discardNewLines();
    } else {
      throw new SyntaxError("Expected 'then' or newline after condition.");
    }
  }

  private functionCall(): Expression {
    const name = this.consume(Literal.Identifier).value!;

    this.consume(Delimiter.LeftBracket);
    const args = this.functionCallArguments();
    this.consume(Delimiter.RightBracket);

    return new FunctionCall(name, args);
  }

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

  private assigment(): Expression {
    const name = this.consume(Literal.Identifier).value!;

    const operator = this.currentToken.type;
    const binaryOp = this.toBinaryOp(operator);

    if (binaryOp) {
      this.consume(operator);
      const expr = this.expression();
      return new VariableAssigment(
        name,
        new BinaryOperation(new VariableAccess(name), binaryOp, expr),
      );
    }

    this.consume(Operator.Assigment);
    return new VariableAssigment(name, this.expression());
  }

  private term(): Expression {
    return this.binaryOperation(
      () => this.factor(),
      [Operator.Multiply, Operator.Divide],
    );
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
    return this.binaryOperation(
      () => this.atom(),
      [Operator.Power],
      () => this.factor(),
    );
  }

  private atom(): Expression {
    const { currentToken } = this;

    if (currentToken.type === Literal.Number) {
      this.consume(Literal.Number);
      return new Numeral(currentToken.value!);
    }

    if (currentToken.type === Literal.String) {
      this.consume(Literal.String);
      return new StringLiteral(currentToken.value!);
    }

    if (currentToken.type === Keyword.Nothing) {
      this.consume(Keyword.Nothing);
      return new NothingLiteral();
    }

    if (currentToken.type === Keyword.True) {
      this.consume(Keyword.True);
      return new BooleanLiteral(true);
    }

    if (currentToken.type === Keyword.False) {
      this.consume(Keyword.False);
      return new BooleanLiteral(false);
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

    throw new SyntaxError(`Unexpected ${currentToken.type.toString()}.`);
  }

  private group(): Expression {
    this.consume(Delimiter.LeftBracket);
    const expression = this.expression();
    this.consume(Delimiter.RightBracket);

    return expression;
  }

  private binaryOperation(
    leftBranch: () => Expression,
    operators: TokenType[],
    rightBranch?: () => Expression,
  ): Expression {
    let left = leftBranch();

    while (operators.includes(this.currentToken.type)) {
      const tokenType = this.currentToken.type;
      this.consume(tokenType);

      const right = (rightBranch ?? leftBranch)();
      left = new BinaryOperation(left, tokenType.name as BinaryOperator, right);
    }

    return left;
  }

  private consume(tokenType: TokenType): Token {
    if (this.currentToken.type !== tokenType) {
      throw new SyntaxError(
        `Expected ${tokenType.toString()} but got ${this.currentToken.type.toString()}.`,
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

  private toBinaryOp(operator: TokenType): BinaryOperator | null {
    if (operator === Operator.PlusAssign) return "+";
    if (operator === Operator.MinusAssign) return "-";
    if (operator === Operator.MultiplyAssign) return "*";
    if (operator === Operator.DivideAssign) return "/";
    return null;
  }
}
