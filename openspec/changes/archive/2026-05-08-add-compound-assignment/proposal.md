## Why

Repeated `x = x + n` patterns are verbose and error-prone. Compound assignment operators (`+=`, `-=`, `*=`, `/=`) provide a concise, familiar syntax used in most mainstream languages. They reduce boilerplate in accumulator patterns, counters, and numeric updates.

## What Changes

- Add compound assignment operators: `+=`, `-=`, `*=`, `/=`
- Desugar at parse time: `x += 5` becomes `x = x + 5` in the AST
- Support with all assignment modes: bare, `local`, `outer`
- No interpreter changes needed (desugaring happens before interpretation)

## Capabilities

### New Capabilities

- `compound-assignment`: Shorthand syntax for `x = x <op> <expr>` using `+=`, `-=`, `*=`, `/=` operators

### Modified Capabilities

- `variable-scoping`: Add specification for compound assignment scope semantics (desugaring preserves existing scope rules)

## Impact

- **Lexer**: New token types for compound operators, recognition of `+=`, `-=`, `*=`, `/=`
- **Parser**: Desugaring logic in assignment parsing
- **Grammar**: `lark-sandbox/lucky_script.lark` updated for compound assignment syntax
- **Interpreter**: No changes (desugared AST is identical to explicit form)
