import type { IterationNode, Node, NonterminalNode } from "ohm-js";

import type {
  ArithmeticOp,
  CompareOp,
  Expr,
  IfStmt,
  LogicalOp,
  Program,
  Span,
  Stmt,
} from "./ast";
import grammar from "./grammar.ohm-bundle";

/* ohm-js operation callbacks use dynamically-typed `.toAst()`; keep unsafe rules off for this file. */
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */

const semantics = grammar.createSemantics();

function spanOf(node: { source: { startIdx: number; endIdx: number } }): Span {
  return { start: node.source.startIdx, end: node.source.endIdx };
}

type BinarySpec =
  | { kind: "Arithmetic"; op: ArithmeticOp }
  | { kind: "Compare"; op: CompareOp }
  | { kind: "Logical"; op: LogicalOp };

function bin(spec: BinarySpec) {
  return function (
    this: NonterminalNode,
    left: NonterminalNode,
    _op: Node,
    right: NonterminalNode,
  ): Expr {
    return {
      ...spec,
      span: spanOf(this),
      left: left.toAst() as Expr,
      right: right.toAst() as Expr,
    };
  };
}

semantics.addOperation<Program | Stmt | Stmt[] | Expr | string | unknown[]>(
  "toAst",
  {
    _iter(...children) {
      return children.map((c) => c.toAst());
    },
    Block(
      this: NonterminalNode,
      _leadNl: Node,
      optStmtList: IterationNode,
      _trailNl: Node,
    ) {
      if (optStmtList.children.length === 0) {
        return [];
      }
      return optStmtList.children[0]!.toAst() as Stmt[];
    },
    StmtList(
      this: NonterminalNode,
      head: Node,
      _nlChunks: IterationNode,
      restStmts: IterationNode,
    ) {
      const stmts: Stmt[] = [head.toAst() as Stmt];
      for (const s of restStmts.children) {
        stmts.push(s.toAst() as Stmt);
      }
      return stmts;
    },
    Stmt_expr(this: NonterminalNode, exp: Node) {
      return {
        kind: "ExprStmt" as const,
        span: spanOf(this),
        expr: exp.toAst() as Expr,
      };
    },
    IfStmt(
      this: NonterminalNode,
      _ifKw: Node,
      cond: Node,
      _nl: Node,
      block: Node,
      elseifKwNodes: IterationNode,
      elseifCondNodes: IterationNode,
      _elseifNlNodes: IterationNode,
      elseifBlockNodes: IterationNode,
      elseKwNodes: IterationNode,
      _elseNlNodes: IterationNode,
      elseBlockNodes: IterationNode,
      _endKw: Node,
    ) {
      const body = block.toAst() as Stmt[];

      let elseBody: Stmt[] | undefined;

      if (elseKwNodes.children.length > 0) {
        elseBody = elseBlockNodes.children[0]!.toAst() as Stmt[];
      }

      // Walk elseif clauses right-to-left, wrapping into elseBody as nested IfStmts
      const elseifCount = elseifKwNodes.children.length;
      for (let i = elseifCount - 1; i >= 0; i--) {
        const condNode = elseifCondNodes.children[i]!;
        const bodyNode = elseifBlockNodes.children[i]!;

        const nested: IfStmt = {
          kind: "IfStmt",
          span: {
            start: elseifKwNodes.children[i]!.source.startIdx,
            end: bodyNode.source.endIdx,
          },
          condition: condNode.toAst() as Expr,
          consequence: bodyNode.toAst() as Stmt[],
          alternative: elseBody ?? undefined,
        };

        elseBody = [nested];
      }

      return {
        kind: "IfStmt" as const,
        span: spanOf(this),
        condition: cond.toAst() as Expr,
        consequence: body,
        alternative: elseBody ?? undefined,
      };
    },
    WhileStmt(
      this: NonterminalNode,
      _whileKw: Node,
      cond: Node,
      _nl: Node,
      block: Node,
      _endKw: Node,
    ) {
      return {
        kind: "WhileStmt" as const,
        span: spanOf(this),
        condition: cond.toAst() as Expr,
        body: block.toAst() as Stmt[],
      };
    },
    BreakStmt(this: NonterminalNode, _breakKw: Node) {
      return {
        kind: "BreakStmt" as const,
        span: spanOf(this),
      };
    },
    ContinueStmt(this: NonterminalNode, _continueKw: Node) {
      return {
        kind: "ContinueStmt" as const,
        span: spanOf(this),
      };
    },
    Params_single(this: NonterminalNode, identNode: Node): string[] {
      return [identNode.toAst() as string];
    },
    Params_cons(
      this: NonterminalNode,
      identNode: Node,
      _comma: Node,
      rest: Node,
    ): string[] {
      return [identNode.toAst() as string, ...(rest.toAst() as string[])];
    },
    Args_single(this: NonterminalNode, exp: Node): Expr[] {
      return [exp.toAst() as Expr];
    },
    Args_cons(
      this: NonterminalNode,
      exp: Node,
      _comma: Node,
      rest: Node,
    ): Expr[] {
      return [exp.toAst() as Expr, ...(rest.toAst() as Expr[])];
    },
    FunDef(
      this: NonterminalNode,
      _defKw: Node,
      identNode: Node,
      _lp: Node,
      paramsOpt: IterationNode,
      _rp: Node,
      _nl: Node,
      block: Node,
      _endKw: Node,
    ): Stmt {
      let params: readonly string[] = [];
      if (paramsOpt.children.length > 0) {
        params = paramsOpt.children[0]!.toAst() as string[];
      }
      return {
        kind: "FunDef" as const,
        span: spanOf(this),
        name: identNode.toAst() as string,
        params,
        body: block.toAst() as Stmt[],
      };
    },
    ReturnStmt(
      this: NonterminalNode,
      _returnKw: Node,
      valueOpt: IterationNode,
    ): Stmt {
      if (valueOpt.children.length === 0) {
        return {
          kind: "ReturnStmt" as const,
          span: spanOf(this),
        };
      }
      return {
        kind: "ReturnStmt" as const,
        span: spanOf(this),
        value: valueOpt.children[0]!.toAst() as Expr,
      };
    },
    AssignExp_assign(
      this: NonterminalNode,
      identNode: Node,
      _eq: Node,
      exprNode: Node,
    ) {
      return {
        kind: "Assign" as const,
        span: spanOf(this),
        name: identNode.toAst() as string,
        value: exprNode.toAst() as Expr,
      };
    },
    OrExp_or: bin({ kind: "Logical", op: "or" }),
    AndExp_and: bin({ kind: "Logical", op: "and" }),
    NotExp_not(this: NonterminalNode, _kw: Node, operand: Node) {
      return {
        kind: "Unary" as const,
        span: spanOf(this),
        op: "not",
        expr: operand.toAst() as Expr,
      };
    },
    CmpExp_gte: bin({ kind: "Compare", op: ">=" }),
    CmpExp_lte: bin({ kind: "Compare", op: "<=" }),
    CmpExp_eq: bin({ kind: "Compare", op: "==" }),
    CmpExp_neq: bin({ kind: "Compare", op: "!=" }),
    CmpExp_gt: bin({ kind: "Compare", op: ">" }),
    CmpExp_lt: bin({ kind: "Compare", op: "<" }),
    AddExp_plus: bin({ kind: "Arithmetic", op: "+" }),
    AddExp_minus: bin({ kind: "Arithmetic", op: "-" }),
    MulExp_times: bin({ kind: "Arithmetic", op: "*" }),
    MulExp_divide: bin({ kind: "Arithmetic", op: "/" }),
    UnaryExp_pos(this: NonterminalNode, _plus: Node, unary: Node) {
      // `+x` is a no-op semantically, but the span should still cover the `+`.
      const inner = unary.toAst() as Expr;
      return { ...inner, span: spanOf(this) };
    },
    UnaryExp_neg(this: NonterminalNode, _minus: Node, unary: Node) {
      return {
        kind: "Unary" as const,
        span: spanOf(this),
        op: "-",
        expr: unary.toAst() as Expr,
      };
    },
    PriExp_paren(this: NonterminalNode, _lp: Node, exp: Node, _rp: Node) {
      // Parens widen the inner expression's span to include the brackets.
      const inner = exp.toAst() as Expr;
      return { ...inner, span: spanOf(this) };
    },
    PriExp_call(
      this: NonterminalNode,
      identNode: Node,
      _lp: Node,
      argsOpt: IterationNode,
      _rp: Node,
    ): Expr {
      let args: readonly Expr[] = [];
      if (argsOpt.children.length > 0) {
        args = argsOpt.children[0]!.toAst() as Expr[];
      }
      return {
        kind: "Call" as const,
        span: spanOf(this),
        name: identNode.toAst() as string,
        args,
      };
    },
    PriExp_var(this: NonterminalNode, identNode: Node) {
      return {
        kind: "Identifier" as const,
        span: spanOf(this),
        name: identNode.toAst() as string,
      };
    },
    // Ohm expands `digit+ ("." digit+)?` into three child nodes for this action dict.
    number(
      this: NonterminalNode,
      _digits: Node,
      _dotDigitsOpt1: Node,
      _dotDigitsOpt2: Node,
    ) {
      return {
        kind: "Literal" as const,
        span: spanOf(this),
        value: Number(this.sourceString),
      };
    },
    ident(this: NonterminalNode, _first: Node, _rest: Node) {
      return this.sourceString;
    },
  },
);

export function parse(code: string): Program {
  const matchResult = grammar.match(code);

  if (matchResult.failed()) {
    throw new Error(matchResult.message);
  }

  return semantics(matchResult).toAst();
}
