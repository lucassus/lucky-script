## Why

The current `function` / `{}` syntax feels heavy and C-derived. Replacing it with `fn` / `end` blocks gives Lucky Script a Ruby/Lua feel that is more readable and approachable. The short-form `fn(x) expr` lambda syntax (Python-style) also enables ergonomic higher-order function usage, which is critical for the upcoming dot-notation methods (`map`, `filter`).

## What Changes

- **BREAKING**: Replace `function` keyword with `fn`
- **BREAKING**: Replace `{}` block delimiters with `end` keyword
- **BREAKING**: Remove required parentheses around `if` / `while` conditions
- **BREAKING**: `fn` and `end` become reserved words (cannot be used as identifiers)
- Add `then` keyword as optional condition terminator (enables single-line `if`/`while`)
- Add `elseif` as a single keyword replacing `else if` chains
- Reserve `in` keyword for upcoming `for`-each loop
- Rename `Delimiter.End` (EOF token) to `Delimiter.Eof` to avoid collision with `end` keyword
- Add short-form anonymous functions: `fn(x) expr` — single expression, no `end`, implicit return
- Full-form functions still require explicit `return` (no implicit return for multi-statement bodies)

## Capabilities

### New Capabilities
- `fn-end-blocks`: The `fn`/`end` block syntax, `then` keyword, `elseif` keyword, short-form lambda syntax, and removal of `{}`/`function`/parenthesized conditions

### Modified Capabilities
- `variable-scoping`: `fn` and `end` become reserved words, affecting valid identifier names
- `while-loops`: Condition parentheses removed, `end` replaces `}`, `then` enabled

## Impact

- **Lexer**: New keywords (`fn`, `end`, `then`, `elseif`, `in`), removal of `{`/`}` delimiter tokenization, rename `Delimiter.End` → `Delimiter.Eof`
- **Parser**: Rewrite `block()` to use `end` instead of `}`, remove required `(`/`)` around conditions, add `then` handling, add `elseif` parsing, add short-form lambda parsing
- **AST**: No structural changes — `FunctionDeclaration`, `IfStatement`, `WhileStatement` retain same fields
- **Interpreter**: No changes — AST structure is unchanged
- **All tests**: Every test using `function`, `{`, `}` must be updated to new syntax
- **Reference grammar**: `lark-sandbox/lucky_script.lark` and its tests must be updated
- **Breaking**: All existing Lucky Script code needs syntax migration
