## Context

Lucky Script currently supports only simple assignment (`x = expr`). Compound assignment operators (`+=`, `-=`, `*=`, `/=`) are a common syntactic convenience in most languages that reduce verbosity in accumulator patterns.

The language has three assignment modes:
- **Bare**: `x = e` — inside functions, binds locally; at top-level, binds in current scope
- **Local**: `local x = e` — always binds in current scope
- **Outer**: `outer x = e` — binds to nearest enclosing scope past the current function boundary

## Goals / Non-Goals

**Goals:**
- Add `+=`, `-=`, `*=`, `/=` operators for numeric compound assignment
- Desugar at parse time so interpreter requires no changes
- Preserve existing scope semantics for all assignment modes

**Non-Goals:**
- `**=` (power-assign) — not in initial scope
- `%=` (modulo-assign) — defer until `%` operator is added
- Indexed compound assignment (`arr[i] += 1`) — defer until lists are implemented

## Decisions

### D1: Desugar at parse time, not at lexer or interpreter

**Chosen**: Parser transforms `x += 5` into `VariableAssigment(name, BinaryOperation(VarAccess(name), "+", expr))`

**Alternatives considered**:
- Lexer desugaring: Would emit multiple tokens, complicates token stream
- Interpreter handling: Would require new AST node type and interpreter logic

**Rationale**: Parser desugaring is clean, produces standard AST, and requires zero interpreter changes. The scope semantics are preserved because the desugared AST is identical to the explicit form.

### D2: Support compound assignment with `local` and `outer` keywords

**Chosen**: `local x += 5` desugars to `local x = x + 5`, same pattern for `outer`

**Rationale**: Consistency with existing syntax. The read (`x`) follows normal lookup rules; the write follows the keyword's semantics.

### D3: Defer indexed compound assignment

**Chosen**: Only support identifier LHS initially

**Rationale**: Lists aren't implemented yet. Indexed compound (`arr[i] += 1`) has a multiple-evaluation problem for the index expression. We'll address this when lists are added.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| `local x += 5` where `x` doesn't exist anywhere raises NameError on read | Document as expected behavior — same as `local x = x + 5` |
| Users expect `**=` to work | Clear documentation of supported operators; can add later |
| Future indexed compound may need different desugaring | Defer decision until lists are implemented |
