import type * as ohm from "ohm-js";

import { grammar } from "./grammar";

/* ohm-js operation callbacks use dynamically-typed `.toAst()`; keep unsafe rules off for this file. */
/* eslint-disable @typescript-eslint/no-unsafe-call */

export type Program = { kind: "Program"; body: Stmt[] };

export type Stmt =
  | FunDef
  | IfStmt
  | ReturnStmt
  | LetStmt
  | AssignStmt
  | ExprStmt;

export type FunDef = {
  kind: "FunDef";
  name: string;
  params: string[];
  body: Stmt[];
};

export type IfStmt = {
  kind: "If";
  test: Exp;
  then: Stmt[];
  elseif: ElseIfBranch[];
  else?: Stmt[];
};

export type ElseIfBranch = { test: Exp; body: Stmt[] };

export type ReturnStmt = { kind: "Return"; value: Exp };
export type LetStmt = { kind: "Let"; name: string; init: Exp };
export type AssignStmt = { kind: "Assign"; name: string; value: Exp };
export type ExprStmt = { kind: "ExprStmt"; expr: Exp };

export type Exp = BinaryExp | UnaryExp | CallExp | VarExp | LiteralExp;

export type BinaryOp =
  | "or"
  | "and"
  | "=="
  | "!="
  | "<="
  | ">="
  | "<"
  | ">"
  | "+"
  | "-"
  | "*"
  | "/"
  | "%"
  | "^";

export type UnaryOp = "not" | "+" | "-";

export type BinaryExp = {
  kind: "Binary";
  op: BinaryOp;
  left: Exp;
  right: Exp;
};

export type UnaryExp = { kind: "Unary"; op: UnaryOp; operand: Exp };

export type CallExp = { kind: "Call"; callee: string; args: Exp[] };

export type VarExp = { kind: "Var"; name: string };

export type LiteralExp = {
  kind: "Literal";
  value: number | boolean | null;
};

function blockStmts(node: ohm.Node): Stmt[] {
  return node.children.map((child) => child.toAst() as Stmt);
}

function expList(node: ohm.Node): Exp[] {
  return node.asIteration().children.map((child) => child.toAst() as Exp);
}

function identList(node: ohm.Node): string[] {
  return node.asIteration().children.map((child) => child.sourceString);
}

const semantics = grammar.createSemantics();

semantics.addOperation<Program | Stmt | Stmt[] | Exp | ElseIfBranch[]>(
  "toAst",
  {
    Program(stmts) {
      return {
        kind: "Program",
        body: stmts.children.map((stmt) => stmt.toAst() as Stmt),
      };
    },
    FunDef(_fun, name, _lparen, params, _rparen, _do, body, _end) {
      return {
        kind: "FunDef",
        name: name.children[0]!.sourceString,
        params: identList(params),
        body: body.toAst() as Stmt[],
      };
    },
    Block(stmts) {
      return blockStmts(stmts);
    },
    Stmt_if(_if, test, _then, thenBlock, elseifChain, elseBranch, _end) {
      const elseif = elseifChain.children[0]!.asIteration().children.map(
        (branch) => ({
          test: branch.children[1]!.toAst() as Exp,
          body: branch.children[3]!.toAst() as Stmt[],
        }),
      );

      return {
        kind: "If",
        test: test.toAst() as Exp,
        then: thenBlock.toAst() as Stmt[],
        elseif,
        else:
          elseBranch.numChildren > 0
            ? (elseBranch.children[0]!.children[1]!.toAst() as Stmt[])
            : undefined,
      };
    },
    Stmt_return(_return, value) {
      return { kind: "Return", value: value.toAst() as Exp };
    },
    Stmt_varDecl(_let, ident, _eq, init) {
      return {
        kind: "Let",
        name: ident.sourceString,
        init: init.toAst() as Exp,
      };
    },
    Stmt_assign(ident, _eq, value) {
      return {
        kind: "Assign",
        name: ident.sourceString,
        value: value.toAst() as Exp,
      };
    },
    Stmt_exprStmt(expr) {
      return { kind: "ExprStmt", expr: expr.toAst() as Exp };
    },
    Exp(expr) {
      return expr.toAst() as Exp;
    },
    LogicOr_or(left, _op, right) {
      return {
        kind: "Binary",
        op: "or",
        left: left.toAst() as Exp,
        right: right.toAst() as Exp,
      };
    },
    LogicOr(and) {
      return and.toAst() as Exp;
    },
    LogicAnd_and(left, _op, right) {
      return {
        kind: "Binary",
        op: "and",
        left: left.toAst() as Exp,
        right: right.toAst() as Exp,
      };
    },
    LogicAnd(notExp) {
      return notExp.toAst() as Exp;
    },
    NotExp_not(_op, operand) {
      return { kind: "Unary", op: "not", operand: operand.toAst() as Exp };
    },
    NotExp(compExp) {
      return compExp.toAst() as Exp;
    },
    CompExp_eq(left, _op, right) {
      return {
        kind: "Binary",
        op: "==",
        left: left.toAst() as Exp,
        right: right.toAst() as Exp,
      };
    },
    CompExp_neq(left, _op, right) {
      return {
        kind: "Binary",
        op: "!=",
        left: left.toAst() as Exp,
        right: right.toAst() as Exp,
      };
    },
    CompExp_lte(left, _op, right) {
      return {
        kind: "Binary",
        op: "<=",
        left: left.toAst() as Exp,
        right: right.toAst() as Exp,
      };
    },
    CompExp_gte(left, _op, right) {
      return {
        kind: "Binary",
        op: ">=",
        left: left.toAst() as Exp,
        right: right.toAst() as Exp,
      };
    },
    CompExp_lt(left, _op, right) {
      return {
        kind: "Binary",
        op: "<",
        left: left.toAst() as Exp,
        right: right.toAst() as Exp,
      };
    },
    CompExp_gt(left, _op, right) {
      return {
        kind: "Binary",
        op: ">",
        left: left.toAst() as Exp,
        right: right.toAst() as Exp,
      };
    },
    CompExp(addExp) {
      return addExp.toAst() as Exp;
    },
    AddExp_plus(left, _op, right) {
      return {
        kind: "Binary",
        op: "+",
        left: left.toAst() as Exp,
        right: right.toAst() as Exp,
      };
    },
    AddExp_minus(left, _op, right) {
      return {
        kind: "Binary",
        op: "-",
        left: left.toAst() as Exp,
        right: right.toAst() as Exp,
      };
    },
    AddExp(mulExp) {
      return mulExp.toAst() as Exp;
    },
    MulExp_times(left, _op, right) {
      return {
        kind: "Binary",
        op: "*",
        left: left.toAst() as Exp,
        right: right.toAst() as Exp,
      };
    },
    MulExp_divide(left, _op, right) {
      return {
        kind: "Binary",
        op: "/",
        left: left.toAst() as Exp,
        right: right.toAst() as Exp,
      };
    },
    MulExp_mod(left, _op, right) {
      return {
        kind: "Binary",
        op: "%",
        left: left.toAst() as Exp,
        right: right.toAst() as Exp,
      };
    },
    MulExp(unaryExp) {
      return unaryExp.toAst() as Exp;
    },
    PowExp_pow(left, _op, right) {
      return {
        kind: "Binary",
        op: "^",
        left: left.toAst() as Exp,
        right: right.toAst() as Exp,
      };
    },
    PowExp(priExp) {
      return priExp.toAst() as Exp;
    },
    UnaryExp_pos(_op, operand) {
      return { kind: "Unary", op: "+", operand: operand.toAst() as Exp };
    },
    UnaryExp_neg(_op, operand) {
      return { kind: "Unary", op: "-", operand: operand.toAst() as Exp };
    },
    UnaryExp(powExp) {
      return powExp.toAst() as Exp;
    },
    PriExp_funCall(name, _lparen, args, _rparen) {
      return {
        kind: "Call",
        callee: name.children[0]!.sourceString,
        args: expList(args),
      };
    },
    PriExp_paren(_lparen, expr, _rparen) {
      return expr.toAst() as Exp;
    },
    PriExp_varAccess(ident) {
      return { kind: "Var", name: ident.sourceString };
    },
    PriExp_lit(literal) {
      return literal.toAst() as Exp;
    },
    literal_true(_true) {
      return { kind: "Literal", value: true };
    },
    literal_false(_false) {
      return { kind: "Literal", value: false };
    },
    literal_null(_null) {
      return { kind: "Literal", value: null };
    },
    number_sci(_mantissa, _e, _sign, _exp) {
      return { kind: "Literal", value: parseFloat(this.sourceString) };
    },
    number_plain(_mantissa) {
      return { kind: "Literal", value: parseFloat(this.sourceString) };
    },
  },
);

export function parse(source: string): Program {
  const matchResult = grammar.match(source);
  if (matchResult.failed()) {
    throw new Error(matchResult.message);
  }

  return semantics(matchResult).toAst() as Program;
}
