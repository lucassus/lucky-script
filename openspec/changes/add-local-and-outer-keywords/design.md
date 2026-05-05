## Context

Lucky Script today has only one form of variable assignment, `x = e`. The interpreter's `SymbolTable.set()` walks up the scope chain on every write, falling back to the current scope only when no enclosing binding exists. Combined with the fact that `if`/`else` already create child scopes (see `Interpreter.ts:307,314`), this produces a surprising mix:

- Functions can silently mutate any same-named variable in any enclosing scope.
- There is no way to introduce a fresh local that shadows an outer name (e.g. shadowing the `print` builtin inside a function safely).
- The doc `docs/plan-improvements.md` already promises a `local` keyword and lexical scoping, but the implementation has never matched.
- Closures already capture their declaration scope (`LuckyFunction.scope`), so reads are lexical; only writes are inconsistent.

We want write semantics that match the Python/Ruby feel the rest of the language is targeting, plus an explicit `outer` escape hatch and a clean `local` shadow form. We do **not** want to introduce a static resolver pass yet; everything must be decidable at runtime against the live scope chain.

## Goals / Non-Goals

**Goals:**
- Bare `x = e` inside a function is local to that function (Python semantics).
- `local x = e` always binds in the current scope, shadowing anything visible from an outer scope (including builtins).
- `outer x = e` writes to the nearest enclosing scope past the current function boundary; raises a runtime error when no such binding exists.
- Reads stay lexical and unchanged.
- Function calls are the only construct that introduces a new scope (paving the way for classes/methods later). `if` / `else` / `while` / `for` execute in the enclosing scope.
- Loop variables follow Python: `for item in xs` rebinds `item` in the enclosing scope, and `item` survives the loop. Closures over `item` see the final value.
- Builtins live in a frozen layer that can never be mutated, only shadowed.

**Non-Goals:**
- A static resolver / name-binding analysis pass. Reads before a later same-name `local` will read the outer binding (no `UnboundLocalError` style behavior).
- Fixing the loop closure trap. Adopting the Python footgun is an explicit, documented choice; per-iteration scoping can be revisited later.
- Introducing `nonlocal` chains beyond a single hop. `outer` walks until it finds a binding; there is no per-level qualifier.
- Read-time variants of `outer`. `outer` annotates writes only; reads always walk the chain.
- Module/import scoping. The top-level scope remains a single shared scope.

## Decisions

### Decision: Function boundaries are the only scope-creating construct

**Choice:** Only `fn` calls create a new `SymbolTable`. `if` / `else` / `while` / `for` execute in the surrounding scope.

**Why:** The user wants a Python/Ruby feel. Python and Ruby do not introduce block scopes for control flow. Removing the `withScope(scope.createChild(), …)` calls in `visitIfStatement` simplifies both the interpreter and the mental model: "scopes are functions." It also makes `outer` easy to reason about — there is exactly one boundary to skip per function.

**Alternatives considered:**
- *JS-with-`let` block scoping (every block is a scope).* More precise, but inconsistent with Python feel and means `local x` inside an `if` evaporates after `end` — surprising in a scripty language.
- *Hybrid (per-iteration scope for `for` only).* Avoids the loop closure trap but introduces an asymmetry that is hard to teach. The user accepted the Python footgun explicitly.

### Decision: Bare `x = e` inside a function is local

**Choice:** Inside any function, `x = e` is equivalent to `local x = e` — it always binds in the current function scope. At the top level, `x = e` keeps "create-or-reassign in top scope".

**Why:** This is the Python/Ruby default and what the user asked for. It also removes the worst current footgun: today, a stray `x = 0` inside a function quietly clobbers an outer `x`.

**Alternatives considered:**
- *Walk-up-then-fallback (current behavior).* Rejected: silently mutates outer state.
- *JS strict-mode (require `local` for any new binding, `x = e` must hit an existing binding or error).* Rejected as too ceremonious for a scripty language; bare `x = e` should "just work" inside fresh functions.

### Decision: `outer x = e` errors when no enclosing `x` exists

**Choice:** `outer` walks the scope chain past the current function boundary; if it does not find an existing `x`, it raises a runtime error. It never creates a new binding.

**Why:** `outer` is the explicit "I know this exists and I want to mutate it" tool. Allowing it to create a binding silently re-introduces the global-creation footgun this whole change is meant to remove. Mirrors Python's `nonlocal` (which is a `SyntaxError` if no enclosing binding exists).

**Alternatives considered:**
- *Create at top scope when missing (Python `global`).* Rejected: `outer` is meant to be the strict counterpart to `local`. Creating at top scope is a different operation; if we ever want it, it deserves a separate keyword.
- *Create at the immediate parent function scope.* Rejected: hard to defend semantically — why would forgetting an outer var create one one level up?

### Decision: Detect runtime errors at the moment of execution, not via a resolver

**Choice:** All scope errors (`outer x = …` with no enclosing binding, reads of unbound names) surface at runtime when the offending statement is evaluated. No upfront name-binding analysis.

**Why:** Keeps the implementation tree-walking and minimal. A resolver pass is a significant addition to the pipeline (similar in shape to Crafting Interpreters' Lox resolver) and the user has explicitly asked to keep it simple for now. Trade-off accepted: typos in dead branches survive until that branch executes.

**Alternatives considered:**
- *Resolver pass between Parser and Interpreter.* Catches `outer` typos and "read before write" issues at parse time. Deferred — can be layered in later without changing the runtime contract.

### Decision: Loop variables follow Python (function-scoped, leak after loop, single binding)

**Choice:** `for item in xs` is implemented as repeated assignment into `item` in the enclosing function/top scope. `item` is visible after the loop, and a closure over `item` captures the variable, not the value.

**Why:** Stays consistent with "function boundaries are the only scope-creating construct". Avoids the implementation cost and pedagogical cost of explaining a special block-scope rule that only applies to `for`.

**Alternatives considered:**
- *Per-iteration fresh binding (JS `let`).* Fixes the closure trap but breaks the "scopes = functions" rule. Documented and rejected for now.

### Decision: Function-boundary marker on `SymbolTable`

**Choice:** Add an `isFunctionBoundary: boolean` flag to `SymbolTable` (or a subclass / factory tag). Set to `true` on the scope created at the start of `visitFunctionCall`. Used by:
- bare `x = e` inside a function: walk up only as far as the nearest function boundary; if `x` is not found there, `setLocal` on the boundary scope itself.
- `outer x = e`: walk up past the nearest function boundary and search from its parent upward.

**Why:** Once `if`/`while` no longer create scopes, the function-boundary check is what distinguishes "this scope" from "the outside." Encoding it on the scope object is cleaner than threading interpreter-side state and survives nested functions naturally. Ties closure capture and `outer` resolution to the same single concept.

**Alternatives considered:**
- *Track "are we inside a function" on the interpreter.* Works for the bare-`x` case but does not generalise to `outer` resolution across closures.

### Decision: Builtins live in a frozen root scope

**Choice:** Replace the current "set builtins as locals on the root scope" approach (`Interpreter.ts:33-38`) with a dedicated frozen scope that:
- is the parent of the user-visible top-level scope,
- rejects `setLocal` and `set` (raises a runtime error if anything tries to write to it),
- is included in lookups so reads still find builtins.

`local print = "x"` then shadows the builtin inside any function body, and bare `print = "x"` at the top level shadows it in the top scope (because the top scope is a child of builtins, not the same scope). The builtin itself is unreachable for mutation.

**Why:** Removes the existing TODO at `Interpreter.ts:33` and makes the user's `local print = "asdf"` use case work cleanly without leaks. Keeping builtins frozen also means future tooling can rely on `print` actually being `print`.

**Alternatives considered:**
- *Leave builtins mutable (current state).* Rejected: defeats the purpose of giving users a safe shadow form.

### Decision: Duplicate `local x` in the same scope silently rebinds

**Choice:** `local x = 1; local x = 2` is allowed and rebinds `x` to `2`. No error.

**Why:** Pythonic and dead-simple. The user explicitly asked for silent rebinding. We can revisit and warn (or error) later when a resolver lands.

## Risks / Trade-offs

- **Read-then-local asymmetry** → Without a resolver, a function that reads `x` before declaring `local x` will read the outer `x` for the read and create a fresh local for the subsequent write. Documented, accepted, and revisitable when a resolver is added.
- **Loop closure trap** → All closures created in a `for` body capture the same `item` and see the final iteration value. Documented as Python-style behavior. Mitigation: users who need per-iteration capture can wrap the loop body in an immediately-invoked `fn`.
- **Breaking change for existing user code** → Any existing program that relied on `x = e` inside a function reaching out to mutate an enclosing `x` will silently change behavior (now creates a local). Mitigation: the project is pre-1.0, the only callers are the test suite and `src/examples/`. Audit during implementation; migrate offending code to `outer x = e`.
- **`outer` runtime error timing** → A typo in `outer foobr = 1` (meant `foobar`) only surfaces if that branch executes. Mitigation: deferred to a future resolver pass; not blocking.
- **Builtin freeze affects tests** → Any tests that previously overwrote builtins via `set()` will now fail. Mitigation: search for and migrate.

## Migration Plan

1. Land the lexer/parser changes for `local` and `outer` first (no semantic change yet — both can map to bare assignment in the interpreter as a temporary shim).
2. Land the `SymbolTable` rework (function-boundary marker, frozen builtins layer, new `setLocal`/`setOuter` semantics).
3. Switch `visitVariableAssigment` to dispatch on binding mode and remove `withScope(scope.createChild(), …)` from `visitIfStatement`.
4. Update the test suite and `src/examples/` to use `outer` where they previously relied on walk-up writes.
5. Update `docs/plan-improvements.md` to remove the line-67 vs line-187 contradiction and reflect the final rules.
6. Update `lark-sandbox/lucky_script.lark` and tests to keep the reference grammar in sync.

Rollback strategy: each step lands as a separate PR. If step 3 reveals unexpected fallout, the lexer/parser additions from step 1 are forward-compatible and can stay.

## Open Questions

- Do we want to surface a friendlier error than `RuntimeError` for `outer` lookup failures (e.g., a dedicated `ScopeError` or `NameError` variant)? Lean: yes, a distinct error class with the variable name in the message.
- Do we want to allow `local fn name() ... end` as sugar for `local name = fn() ... end`? Out of scope for this change; flag as a follow-up.
