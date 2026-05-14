export type ArithmeticOp = "+" | "-" | "*" | "/";
export type CompareOp = "==" | "!=" | ">=" | "<=" | ">" | "<";
export type LogicalOp = "and" | "or";
export type UnaryOp = "+" | "-" | "not";

export type Expr =
  | { kind: "Literal"; value: number }
  | { kind: "Variable"; name: string }
  | { kind: "Assign"; name: string; value: Expr }
  | { kind: "Unary"; op: UnaryOp; expr: Expr }
  | { kind: "Arithmetic"; op: ArithmeticOp; left: Expr; right: Expr }
  | { kind: "Compare"; op: CompareOp; left: Expr; right: Expr }
  | { kind: "Logical"; op: LogicalOp; left: Expr; right: Expr };

export type Stmt = { kind: "ExprStmt"; expr: Expr };

export type Program = Stmt[];
