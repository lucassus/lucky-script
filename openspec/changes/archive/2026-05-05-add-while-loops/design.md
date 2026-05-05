## Context

Lucky Script is a tree-walking interpreted language with three pipeline stages: Lexer → Parser → Interpreter. The reference grammar lives in `lark-sandbox/lucky_script.lark` and drives the TypeScript implementation.

`if` already exists as the only branching construct (`if (expr) { block } [else ...]`) and serves as the structural template for `while`. The recently shipped `variable-scoping` capability established the rule that **function calls are the only scope-creating construct** — `if`/`else` execute in the enclosing scope. This rule must extend cleanly to `while`.

Two earlier-merged conventions also constrain the design:
- The `Return` control-flow signal is implemented by throwing a sentinel exception caught at the function call boundary in `visitFunctionCall`. Anything that propagates upward (return, future break/continue, runtime errors) reuses this pattern.
- All runtime values are `LuckyObject` subclasses with a `toBoolean()` method used by `if` for truthiness; `while` should use the same coercion to keep conditional semantics uniform.

## Goals / Non-Goals

**Goals:**
- Add a `while` statement whose syntax mirrors `if` (parens around condition, brace-delimited body).
- Reuse existing scope, truthiness, and control-flow conventions without inventing new mechanisms.
- Produce a spec, AST node, and visitor that future loop constructs (`for-each`) can extend without rework.
- Land a runnable integration test that exercises the canonical mutating-condition pattern.

**Non-Goals:**
- `break` and `continue` — separable feature, tracked in `TODOs.md` for a follow-up change.
- Infinite-loop detection or step limits.
- Loops as expressions — `while` is a statement that evaluates to `nothing`, not the value of the last iteration.
- Alternative loop forms (`do…while`, `loop {}`, generator-style).

## Decisions

### D1. Syntax: `while "(" expression ")" block` — mirror `if`

**Decision:** parens-delimited condition, brace-delimited body, identical structurally to `if (expr) { block }`.

**Why:** Lucky Script's existing branching construct uses parens; matching it keeps the family coherent and reuses `block()` and `expression()` parser entry points unchanged. Drop-in symmetry also simplifies grammar review.

**Alternatives considered:** parens-free (`while cond { body }` à la Rust/Go) would force a parallel decision for `if` and a wider conversation about expression-statement boundaries. Not worth bundling.

### D2. Body executes in the enclosing scope (no child scope)

**Decision:** the visitor evaluates body statements directly in the current `SymbolTable` — no `createChild` call.

**Why:** This is required by the `variable-scoping` capability (function calls are the only scope-creating construct). It's also what enables the canonical iteration pattern `i = 0; while (i < n) { i = i + 1 }` to mutate `i` in the enclosing function or top-level scope without `outer`/special-casing. `local x = …` inside a body still writes to the current scope (the enclosing function or top level), unchanged from outside-loop behavior.

**Alternatives considered:** giving `while` a private scope would require `outer` (or a similar escape hatch) for trivial counter loops, which directly contradicts the recent scoping decision.

### D3. Condition truthiness uses `toBoolean()` — same as `if`

**Decision:** the visitor invokes `condition.visit().toBoolean() === LuckyBoolean.True` each iteration, identical to `visitIfStatement`.

**Why:** uniform conditional semantics. A user reading `if (x)` and `while (x)` should never need to learn separate truthiness rules.

### D4. `while` evaluates to `LuckyNothing`

**Decision:** the visitor returns `LuckyNothing.Instance`.

**Why:** consistent with `visitIfStatement`, which also returns `LuckyNothing`. Returning a "last body value" would be a Ruby-ism that commits the language to value-producing loops with no current motivation.

### D5. `return` inside `while` works without explicit support

**Decision:** no special handling. `return` already throws a `Return` exception caught at the function call boundary; that exception propagates through the JS-level `while` in the visitor unchanged.

**Why:** the existing control-flow mechanism already covers this case for free. Confirming this in the spec and a test is enough.

### D6. AST node: `WhileStatement(condition: Expression, body: Statement[])`

**Decision:** add a new `WhileStatement` class to `src/Parser/AstNode.ts` mirroring `IfStatement`'s shape (drop `elseBranch`).

**Why:** symmetric with `IfStatement` and the visitor dispatch (`if (node instanceof WhileStatement) return this.visitWhileStatement(node)`). Future `break`/`continue` will add control-flow exceptions, not change this node's shape.

### D7. Newline between `)` and `{` is rejected — same as `if`

**Decision:** do not relax the parser; `while (cond)\n{ body }` raises a syntax error.

**Why:** the existing parser calls `block()` immediately after `consume(RightBracket)` for `if` and shares the same constraint. Inheriting it keeps the two constructs consistent and avoids a parser change unrelated to the feature.

### D8. Empty body is allowed

**Decision:** `while (cond) {}` parses and evaluates `cond` until it becomes false, returning `nothing`.

**Why:** falls out of the existing `block()` handling of `{}`. No extra work, and rejecting it would be a surprising special case.

### D9. No infinite-loop guard

**Decision:** `while (true) {}` runs until the process is killed or the host environment interrupts it.

**Why:** Lucky Script is a learning/experimental language; iteration limits would be arbitrary and not match the behavior of the languages it draws from. Acceptable for v1; a future change can add a configurable limit if needed.

### D10. Implementation strategy

**Decision:** the Lark grammar is updated first with smoke tests, then the TypeScript pipeline layer-by-layer (Lexer → Parser → Interpreter) following the project's documented TDD lifecycle. The visitor uses a JS-level `while` loop that re-evaluates `node.condition` each iteration.

**Why:** matches the development lifecycle in `CLAUDE.md`. The TS implementation is a few lines per layer; starting from a green Lark grammar gives confidence that the syntax design is sound before committing to AST shapes.

## Risks / Trade-offs

- **[Risk] Future `break`/`continue` will require a control-flow exception type and a `try/catch` around the JS-level `while`.** → Acceptable. The `Return` precedent shows the pattern is small. The follow-up change will edit `visitWhileStatement` rather than reshape it.
- **[Risk] Users may write infinite loops with no escape (no break, no condition mutation).** → Mitigated by D2: body shares the enclosing scope, so the canonical mutate-condition pattern works. No infinite-loop guard by D9.
- **[Risk] Spec drift between `if` and `while` truthiness if `if`'s coercion changes later.** → Both call `toBoolean()` directly; any change to `LuckyObject.toBoolean()` updates both atomically. No drift surface.
- **[Trade-off] No loop value vs. expression-orientation.** → D4 closes the door on `while` as an expression. Reversible later if a use case appears, but committing now would constrain the design with no current need.
