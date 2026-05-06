# Phase 0 Research / Decisions

The feature spec went through two clarification rounds (2026-05-06) and the codebase already exposes the patterns we need (`Return` control flow, `Lookahead` parser, `SymbolTable`). Research therefore reduces to locking design decisions before code is written.

## Decision 1 — Parse-time loop nesting check uses a `loopDepth` counter on the parser

**Decision**: Add a private `loopDepth: number` field to `Parser`. Increment it before parsing a `while` body and decrement it after. When parsing `break` / `continue`, throw `SyntaxError` if `loopDepth === 0`.

**Rationale**: The parser already runs to completion before the interpreter sees the AST, so a counter is sufficient — no separate static-analysis pass is needed. A counter (vs. a boolean) costs nothing extra and trivially supports nesting.

**Alternatives considered**:
- *Stack of loop labels* — overkill; we have no labelled-break feature.
- *Post-parse AST walk* — adds a second pass for behaviour the parser already has the information for.
- *Defer to runtime* — rejected by FR-007 ("rejected at parse time", "MUST NOT begin execution").

## Decision 2 — Function literals reset `loopDepth`

**Decision**: In both `functionDeclaration()` and `anonymousFunction()`, save the current `loopDepth`, set it to `0` for the duration of the body parse, and restore it afterwards (try/finally to be safe even on parse error).

**Rationale**: FR-011 mandates this; the spec's clarification round explicitly aligned with Python/JS semantics. A function body is a fresh control-flow context — a `break` placed inside a closure that is *defined* inside a loop must still be a parse error because the closure can be called from anywhere.

**Alternatives considered**:
- *Allow it and check at runtime* — rejected by FR-011 ("rejected at parse time").
- *Track separately per function frame* — equivalent to save/restore but with extra bookkeeping.

## Decision 3 — Runtime semantics: throw-and-catch `ControlFlow` signals

**Decision**: Add `Break extends ControlFlow` and `Continue extends ControlFlow` in `src/Interpreter/ControlFlow.ts`. Neither carries a payload. `visitWhileStatement` becomes:

```ts
while (this.visit(node.condition).toBoolean() === LuckyBoolean.True) {
  try {
    for (const statement of node.body) {
      this.visit(statement);
    }
  } catch (error) {
    if (error instanceof Break) break;
    if (error instanceof Continue) continue;
    throw error;
  }
}
```

`visit` for `BreakStatement` throws `new Break()`; `visit` for `ContinueStatement` throws `new Continue()`.

**Rationale**: Mirrors the existing `Return` mechanism (`Return extends ControlFlow`, thrown from `ReturnStatement`, caught in `visitFunctionCall`). Keeps the interpreter style uniform and makes the catch site obvious. Using two distinct subclasses keeps the dispatch trivial.

**Alternatives considered**:
- *Sentinel return values from `visit`* — would force every `visit` caller (including expressions and assignments) to thread state, polluting otherwise simple code paths.
- *Mutable interpreter flag* — invites bugs where nested constructs forget to clear it.
- *Single `Loop` signal with a kind field* — saves one class but loses `instanceof` clarity.

## Decision 4 — No defensive runtime fallback

**Decision**: Do **not** add catch clauses in `visitProgram` or `visitFunctionCall` for `Break` / `Continue`. The parser guarantees they only appear inside a loop body, so an uncaught `Break` / `Continue` at runtime would indicate a parser bug and should surface as one.

**Rationale**: The spec's Assumptions explicitly say: "signal handling never has to fall back to a 'no enclosing loop' runtime error because the parser has already excluded that case." A defensive runtime guard would mask parser regressions and add code to maintain.

**Alternatives considered**:
- *Catch + RuntimeError fallback* — rejected per spec; would also conflict with the existing `Return` handling, which symmetrically does **not** add a defensive guard inside loops.

## Decision 5 — Lexer: reuse `Keyword.fromString` (no recognizer changes)

**Decision**: Add `Keyword.Break = new Keyword("break")` and `Keyword.Continue = new Keyword("continue")` to `src/Lexer/Token.ts`. `Keyword.fromString` automatically picks them up because it scans `Keyword.values`.

**Rationale**: The existing identifier recognizer asks `Keyword.fromString` whether the recognized identifier is actually a keyword; adding the two static fields is sufficient. No state-machine change is required.

**Alternatives considered**: none viable — any other approach duplicates the existing keyword machinery.

## Decision 6 — AST shape: nullary statement nodes

**Decision**: `BreakStatement` and `ContinueStatement` extend `Statement` and carry no fields. They are not expressions (do not produce a value) and never appear in expression position.

**Rationale**: They have no operand. Following the existing pattern (`NothingLiteral` is a fieldless expression class), there is no benefit to packing them into an enum.

**Alternatives considered**:
- *Single `LoopControlStatement` with a `kind: 'break' | 'continue'`* — saves one class but obscures dispatch.
- *Treat as expressions returning `nothing`* — invites surprising programs like `x = break`. Better to forbid syntactically.

## Decision 7 — Existing-code audit (FR-010)

**Finding**: `grep -rn -E '\b(break|continue)\b' src/examples/ lark-sandbox/lucky_script_test.py` returns no hits. There are no existing Lucky Script programs in the repository that use `break` or `continue` as identifiers, so reserving them is non-breaking for the test corpus.

**Migration note**: If any external program in the wild uses `break` / `continue` as identifiers, it will fail to parse after this change with the existing tokenizer error. This is the intended behaviour per FR-010.

## Decision 8 — Lark grammar mirrors the TS parser

**Decision**: Update `lark-sandbox/lucky_script.lark` to add two new alternatives to the `statement` rule:

```lark
statement : ...
          | break_statement
          | continue_statement

break_statement    : "break"
continue_statement : "continue"
```

Update `lark-sandbox/lucky_script_test.py` with **valid** cases (e.g. `while (true) { break }`, `while (true) { if (x) { continue } }`, nested while loops) and document in `contracts/grammar.md` that the lark grammar **does not** model the "inside a loop" check; that is enforced only by the TypeScript parser. The lark sandbox covers surface syntax only.

**Rationale**: The lark grammar is context-free; modelling the loop-nesting state would force ad-hoc post-parse checks that diverge from how Lark is used elsewhere in this project. The TS parser is the source of truth for semantic-syntax errors like FR-007/FR-011.

**Alternatives considered**:
- *Encode loop nesting in lark via separate non-terminals for "in-loop block" vs "out-of-loop block"* — doubles the grammar surface (every block-bearing construct would need both variants) and still wouldn't handle function-literal reset cleanly.

## Open questions

None. All `NEEDS CLARIFICATION` items from the spec template have been resolved by the spec's clarification rounds and the decisions above.
