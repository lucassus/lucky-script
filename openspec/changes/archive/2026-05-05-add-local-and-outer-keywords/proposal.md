## Why

The current scope rules let any bare assignment inside a function silently mutate a same-named variable in an enclosing scope. There is no way to declare a fresh local that shadows an outer name, no way to opt into mutating an outer name explicitly, and the read/write rules drift away from the Python/Ruby feel the language is targeting elsewhere. The result is fragile closures, leaked overrides (e.g. `print = "x"` clobbering the builtin), and a footgun where typos quietly mutate the wrong variable.

## What Changes

- **BREAKING**: bare `x = e` inside a function body no longer walks up the scope chain. It binds `x` in the current function scope (creating it if absent, reassigning if already local). Top-level `x = e` keeps "create-or-reassign at top scope".
- Add the `local` keyword: `local x = e` always binds `x` in the current scope. If `x` already exists in that scope it is silently rebound. Used to shadow an outer name (including builtins) without leaking.
- Add the `outer` keyword: `outer x = e` walks past the current function boundary to the nearest enclosing scope that defines `x` and writes there. If no enclosing `x` exists, a runtime error is raised.
- Reads remain unchanged: `x` walks up the scope chain until a binding is found, terminating at builtins; `NameError` if nothing matches.
- Scopes are function boundaries only. `if` / `else` / `while` / `for` no longer create child scopes; assignments inside them affect the enclosing function or top scope.
- Loop variables follow Python: `for item in xs` binds `item` in the enclosing function/top scope. `item` outlives the loop and closures over it all see the final iteration value.
- Builtins live in a frozen root scope. `local print = "x"` shadows cleanly inside a function; the builtin itself can never be mutated.

## Capabilities

### New Capabilities
- `variable-scoping`: rules for how variable bindings are created, looked up, mutated, and shadowed across function, top-level, and block contexts; defines the `local` and `outer` keywords.

### Modified Capabilities
<!-- None: scoping has no prior spec; behavior was implicit in the interpreter. -->

## Impact

- `src/Lexer/` — recognise `local` and `outer` as keywords.
- `src/Parser/AstNode.ts`, `src/Parser/Parser.ts` — `VariableAssigment` gains a binding-mode tag (`bare` | `local` | `outer`).
- `src/Interpreter/SymbolTable.ts` — function-boundary marker, `setLocal`/`setOuter` semantics, removal of unconditional walk-up on writes inside functions.
- `src/Interpreter/Interpreter.ts` — `visitVariableAssigment` dispatches on binding mode; `visitIfStatement` no longer creates a child scope.
- `lark-sandbox/lucky_script.lark` and `lucky_script_test.py` — grammar additions for `local` / `outer`.
- `docs/plan-improvements.md` — bring the Scoping and Variables sections into agreement with the new rules.
- Existing user code that relied on `x = e` inside a function reaching out to mutate an enclosing `x` will break and must migrate to `outer x = e`.
