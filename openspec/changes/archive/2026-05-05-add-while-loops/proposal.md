## Why

Lucky Script has `if` for branching but no looping construct, so iterative algorithms must currently be expressed via recursion. Adding `while` is the smallest viable looping primitive and the foundation that the planned `for-each` will build on.

## What Changes

- Add the `while` keyword and a `while (expression) { block }` statement to the language.
- The condition is evaluated each iteration with the same truthiness coercion as `if` (`toBoolean()`).
- The loop body executes in the enclosing scope — `while` does **not** create a child scope, consistent with the rule established by `variable-scoping` that function calls are the only scope-creating construct.
- An empty body (`while (cond) {}`) is accepted by the parser.
- `return` inside a `while` inside a function exits the function, matching `return` inside `if`.
- A `while` statement evaluates to `nothing`.
- `break` and `continue` are **out of scope** for this change and tracked separately in `TODOs.md`.
- No infinite-loop guard: `while (true) {}` runs until interrupted; acceptable for v1.

## Capabilities

### New Capabilities
- `while-loops`: the syntax, evaluation rules, and scoping behavior of the `while` statement.

### Modified Capabilities
<!-- None. This change consumes the existing `variable-scoping` rule that function
     calls are the only scope-creating construct, but does not change any
     requirement of that capability. -->

## Impact

- **Grammar**: `lark-sandbox/lucky_script.lark` and `lark-sandbox/lucky_script_test.py`.
- **Lexer**: `src/Lexer/Token.ts` (new `Keyword.While`), `src/Lexer/Lexer.test.ts`.
- **Parser**: `src/Parser/AstNode.ts` (new `WhileStatement` node), `src/Parser/Parser.ts`, `src/Parser/Parser.test.ts`.
- **Interpreter**: `src/Interpreter/Interpreter.ts` (new `visitWhileStatement`), `src/Interpreter/Interpreter.test.ts`.
- **Integration test**: a new file under `src/examples/` covering the canonical condition-mutated-by-body case.
- **Docs**: `TODOs.md` (mark `while` complete; `break`/`continue` line already present).
- No external API surface, no dependencies, no breaking changes.
