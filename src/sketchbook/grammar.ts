import fs from "node:fs";
import path from "node:path";

import * as ohm from "ohm-js";

/* ohm-js operation callbacks use dynamically-typed `.eval()`; keep unsafe rules off for this file. */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */

export const grammar = ohm.grammar(
  fs.readFileSync(path.join(__dirname, "grammar.ohm"), "utf-8"),
);

type FnDef = { params: string[]; body: ohm.Node };

class ReturnException extends Error {
  constructor(public value: number) {
    super();
  }
}

function evalStmts(stmts: ohm.Node): number {
  let result = 0;
  for (const stmt of stmts.children) {
    result = stmt.eval();
  }
  return result;
}

function addEvalOperation(
  semantics: ohm.Semantics,
  variables: Map<string, number>,
  functions: Map<string, FnDef>,
): void {
  semantics.addOperation<number>("eval", {
    Program(items) {
      let result = 0;
      for (const item of items.children) {
        result = item.eval();
      }
      return result;
    },
    FunDef(_fun, name, _lparen, params, _rparen, _do, body, _end) {
      const paramNames = params
        .asIteration()
        .children.map((c) => c.sourceString);

      const funName = name.children[0]!.sourceString;
      functions.set(funName, {
        params: paramNames,
        body,
      });

      return 0;
    },
    Block(stmts) {
      return evalStmts(stmts);
    },
    Stmt_if(_if, exp, _then, thenBlock, elseifChain, elseBranch, _end) {
      if (exp.eval()) {
        return thenBlock.eval();
      }

      const elseifBranches = elseifChain.children[0]!.asIteration().children;
      for (const branch of elseifBranches) {
        const branchExp = branch.children[1]!;
        const branchBlock = branch.children[3]!;
        if (branchExp.eval()) {
          return branchBlock.eval();
        }
      }

      if (elseBranch.numChildren > 0) {
        return elseBranch.children[0]!.children[1]!.eval();
      }

      return 0;
    },
    Stmt_return(_return, exp) {
      throw new ReturnException(exp.eval());
    },
    Stmt_varDecl(_let, ident, _eq, exp) {
      const value = exp.eval();
      variables.set(ident.sourceString, value);
      return value;
    },
    Stmt_assign(ident, _eq, exp) {
      const name = ident.sourceString;
      if (!variables.has(name)) {
        throw new Error(`Undefined variable: ${name}`);
      }
      const value = exp.eval();
      variables.set(name, value);
      return value;
    },
    Stmt_exprStmt(exp) {
      return exp.eval();
    },
    LogicOr_or(a, _, b) {
      return a.eval() !== 0 || b.eval() !== 0 ? 1 : 0;
    },
    LogicAnd_and(a, _, b) {
      return a.eval() !== 0 && b.eval() !== 0 ? 1 : 0;
    },
    NotExp_not(_, e) {
      return e.eval() === 0 ? 1 : 0;
    },
    CompExp_eq(a, _, b) {
      return a.eval() === b.eval() ? 1 : 0;
    },
    CompExp_neq(a, _, b) {
      return a.eval() !== b.eval() ? 1 : 0;
    },
    CompExp_lte(a, _, b) {
      return a.eval() <= b.eval() ? 1 : 0;
    },
    CompExp_gte(a, _, b) {
      return a.eval() >= b.eval() ? 1 : 0;
    },
    CompExp_lt(a, _, b) {
      return a.eval() < b.eval() ? 1 : 0;
    },
    CompExp_gt(a, _, b) {
      return a.eval() > b.eval() ? 1 : 0;
    },
    AddExp_plus(a, _, b) {
      return a.eval() + b.eval();
    },
    AddExp_minus(a, _, b) {
      return a.eval() - b.eval();
    },
    MulExp_times(a, _, b) {
      return a.eval() * b.eval();
    },
    MulExp_divide(a, _, b) {
      return a.eval() / b.eval();
    },
    MulExp_mod(a, _, b) {
      return a.eval() % b.eval();
    },
    PowExp_pow(a, _, b) {
      return a.eval() ** b.eval();
    },
    UnaryExp_pos(_, e) {
      return e.eval();
    },
    UnaryExp_neg(_, e) {
      return -e.eval();
    },
    PriExp_funCall(name, _lparen, args, _rparen) {
      const funName = name.children[0]!.sourceString;

      if (!functions.has(funName)) {
        throw new Error(`Undefined function: ${funName}`);
      }
      const fn = functions.get(funName)!;
      const argValues = args.asIteration().children.map((c) => c.eval());

      // Simplistic scope implementation
      const previousValues = new Map<string, number>();
      fn.params.forEach((param, i) => {
        if (variables.has(param)) {
          previousValues.set(param, variables.get(param)!);
        }
        variables.set(param, argValues[i] ?? 0);
      });

      let result = 0;
      try {
        result = fn.body.eval();
      } catch (e) {
        if (e instanceof ReturnException) {
          result = e.value;
        } else {
          throw e;
        }
      } finally {
        // Restore outer scope variables
        fn.params.forEach((param) => {
          if (previousValues.has(param)) {
            variables.set(param, previousValues.get(param)!);
          } else {
            variables.delete(param);
          }
        });
      }
      return result;
    },
    PriExp_paren(_l, e, _r) {
      return e.eval();
    },
    PriExp_varAccess(ident) {
      const name = ident.sourceString;
      if (!variables.has(name)) {
        throw new Error(`Undefined variable: ${name}`);
      }
      return variables.get(name)!;
    },
    PriExp_lit(lit) {
      return lit.eval();
    },
    literal_true(_) {
      return 1;
    },
    literal_false(_) {
      return 0;
    },
    literal_null(_) {
      return 0;
    },
    number_sci(_mantissa, _e, _sign, _exp) {
      return parseFloat(this.sourceString);
    },
    number_plain(_mantissa) {
      return parseFloat(this.sourceString);
    },
  });
}

export type GrammarRuntime = {
  evaluate: (expr: string) => number;
  variables: Map<string, number>;
  functions: Map<string, FnDef>;
};

/** Fresh variable/function maps and semantics — use this when tests or tooling need isolation. */
export function createGrammarRuntime(): GrammarRuntime {
  const variables = new Map<string, number>();
  const functions = new Map<string, FnDef>();
  const semantics = grammar.createSemantics();
  addEvalOperation(semantics, variables, functions);

  function evaluate(expr: string): number {
    const matchResult = grammar.match(expr);
    if (!matchResult.succeeded()) {
      throw new Error(`Parse failed for: ${expr}`);
    }

    return semantics(matchResult).eval();
  }

  return { evaluate, variables, functions };
}
