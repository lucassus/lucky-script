## Why

Lucky Script currently uses `local` and `outer` for binding control, while bare assignment has special function-boundary behavior. This is powerful but unfamiliar compared to modern declaration-first languages, and it makes simple variable rules harder to teach and reason about.

## What Changes

- **BREAKING**: Introduce `let` as the declaration keyword and require declarations before assignment in user code, including at the top level.
- **BREAKING**: Remove `local` and `outer` keywords from the language surface.
- **BREAKING**: Redefine `name = expr` to mutate the nearest existing binding in lexical scope; raise an error when the name is undeclared.
- Keep closure updates possible through standard reassignment semantics (no special nonlocal write keyword).
- Reserve `const` as a follow-up extension; this change does not implement immutability.

## Capabilities

### New Capabilities
- `variable-declarations`: declaration-first variable model using `let` with lexical reassignment rules and undeclared-assignment errors.

### Modified Capabilities
- `variable-scoping`: update scoping requirements to remove `local`/`outer` and define nearest-binding reassignment behavior.

## Impact

- Affected code: lexer keywords/tokens, parser assignment/declaration grammar, AST binding modes, interpreter symbol table write semantics, scope error behavior.
- Affected docs/tests: README scoping examples and all parser/interpreter/example tests that currently use `local`/`outer`.
- Compatibility: existing scripts using `local` or `outer` will require migration.
