## Why

While loops are a fundamental control flow construct needed for iterative algorithms. Currently, lucky-script supports if statements but no loop support, limiting scripts to recursive patterns. Adding while loops enables practical iteration without requiring data structures.

## What Changes

- Add `while` keyword and syntax to lexer
- Add while statement parsing (recursive descent)
- Add while statement execution in interpreter
- **Critical constraint**: loop body executes in the enclosing scope (not a child scope) — variables created in the loop body are visible after the loop exits

## Capabilities

### New Capabilities
- `while-loops`: While loop syntax (`while (condition) { ... }`), execution semantics with proper scope handling

### Modified Capabilities

(none)

## Impact

- **Lexer**: New `while` keyword
- **Parser**: New `WhileStatement` AST node, new parse rule
- **Interpreter**: New `visitWhileStatement()` method
- **No breaking changes** — purely additive feature
