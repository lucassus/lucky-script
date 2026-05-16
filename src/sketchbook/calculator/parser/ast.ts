export type ArithmeticOp = "+" | "-" | "*" | "/";
export type CompareOp = "==" | "!=" | ">=" | "<=" | ">" | "<";
export type LogicalOp = "and" | "or";
export type UnaryOp = "-" | "not";

/** Half-open character range `[start, end)` in the original source. */
export interface Span {
  readonly start: number;
  readonly end: number;
}

interface Node<K extends string> {
  readonly kind: K;
  readonly span: Span;
}

export interface Literal extends Node<"Literal"> {
  readonly value: number;
}

export interface Identifier extends Node<"Identifier"> {
  readonly name: string;
}

export interface Assign extends Node<"Assign"> {
  readonly name: string;
  readonly value: Expr;
}

export interface Unary extends Node<"Unary"> {
  readonly op: UnaryOp;
  readonly expr: Expr;
}

interface Binary<K extends string, Op> extends Node<K> {
  readonly op: Op;
  readonly left: Expr;
  readonly right: Expr;
}

export type Arithmetic = Binary<"Arithmetic", ArithmeticOp>;
export type Compare = Binary<"Compare", CompareOp>;
export type Logical = Binary<"Logical", LogicalOp>;

export interface Call extends Node<"Call"> {
  readonly name: string;
  readonly args: readonly Expr[];
}

export type Expr =
  | Literal
  | Identifier
  | Assign
  | Unary
  | Arithmetic
  | Compare
  | Logical
  | Call;

export interface ExprStmt extends Node<"ExprStmt"> {
  readonly expr: Expr;
}

export interface IfStmt extends Node<"IfStmt"> {
  readonly condition: Expr;
  readonly consequence: readonly Stmt[];
  readonly alternative?: readonly Stmt[];
}

export interface WhileStmt extends Node<"WhileStmt"> {
  readonly condition: Expr;
  readonly body: readonly Stmt[];
}

export type BreakStmt = Node<"BreakStmt">;

export type ContinueStmt = Node<"ContinueStmt">;

export interface FunDef extends Node<"FunDef"> {
  readonly name: string;
  readonly params: readonly string[];
  readonly body: readonly Stmt[];
}

export interface ReturnStmt extends Node<"ReturnStmt"> {
  readonly value?: Expr;
}

export type Stmt =
  | ExprStmt
  | IfStmt
  | WhileStmt
  | BreakStmt
  | ContinueStmt
  | FunDef
  | ReturnStmt;

export type Program = readonly Stmt[];
