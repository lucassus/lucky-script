## Context

The interpreter currently recognises only one callable type: `LuckyFunction`. `visitFunctionCall` hard-checks `instanceof LuckyFunction` and throws for anything else. There is no mechanism for native (JS-backed) functions, and no protocol for converting a `LuckyObject` to a printable string.

## Goals / Non-Goals

**Goals:**

- Add a `print(x)` built-in with arity 1
- Establish an extensible pattern for future built-ins (zero changes to interpreter dispatch when adding a new one)
- Enforce a `display(): string` contract on all runtime value types at compile time

**Non-Goals:**

- Variadic `print` (deferred until strings are added and multi-arg printing is useful)
- Protecting built-ins from being overwritten by user code (TODO — current `set()` semantics allow it; acceptable for now)
- A `local` / `global` keyword to control scoping of built-in redefinition

## Decisions

### 1. `LuckyBuiltin` wraps a plain JS closure — no shared abstract base with `LuckyFunction`

`LuckyBuiltin` holds a `(args: LuckyObject[]) => LuckyObject` closure. It has a fixed `arity: number` field. Execution is self-contained: no interpreter reference needed.

`LuckyFunction` execution stays in `visitFunctionCall` because it needs `interpreter.visit()` to walk its AST. Forcing a common `call(args, interpreter)` interface would introduce a circular import (`LuckyFunction → Interpreter → LuckyFunction`) and pollute builtins with an interpreter argument they never use.

**Alternative considered:** A `LuckyCallable` abstract base with `call(args, interpreter)`. Rejected because: circular dependency risk, and builtins genuinely don't need the interpreter — the distinction is real, not incidental.

### 2. `builtins.ts` registry as the single extension point

All built-ins are defined in `src/Interpreter/builtins.ts` as a `Record<string, LuckyBuiltin>`. Adding a new built-in is one entry in this file — `Interpreter.ts`, `LuckyBuiltin`, and the dispatch logic are untouched.

### 3. `visitFunctionCall` gets an early-return branch for `LuckyBuiltin`

```
lookup(name)
  → instanceof LuckyBuiltin  → validate arity, evaluate args, call → return
  → instanceof LuckyFunction → existing logic
  → else                     → RuntimeError "'name' is not callable"
```

Existing `LuckyFunction` path is unchanged.

### 4. `display(): string` is abstract on `LuckyObject`

TypeScript enforces implementation on every subclass. Display values:

| Type            | `display()`                                         |
| --------------- | --------------------------------------------------- |
| `LuckyNumber`   | `String(this.value)`                                |
| `LuckyBoolean`  | `"true"` / `"false"`                                |
| `LuckyNothing`  | `"nothing"`                                         |
| `LuckyString`   | the raw string value (no quotes)                    |
| `LuckyFunction` | `"<function name>"` or `"<function>"` for anonymous |
| `LuckyBuiltin`  | `"<builtin name>"`                                  |

### 5. Built-ins are seeded via `setLocal` in the `Interpreter` constructor

Root scope is the `private scope = new SymbolTable()` field. The constructor iterates `BUILTINS` and calls `this.scope.setLocal(name, builtin)`. User code can overwrite them via the normal `set()` walk-up semantics.

## Risks / Trade-offs

- **Built-ins are globally mutable** — `print = myFn` anywhere in user code replaces the built-in in the root scope. Acceptable for now; mitigate later with a read-only scope layer or `setLocal`-only assignment for the root scope. TODO left in code.

## Open Questions

_(none — all decisions made during explore session)_
