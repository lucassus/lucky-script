# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn install        # install deps
yarn test           # run all tests
yarn test Lexer  # run single test file
yarn lint           # eslint
yarn typecheck      # tsc --noEmit
yarn build          # compile to dist/
ts-node src/repl.ts # interactive REPL
```

## Philosophy

Lucky Script is a personal learning project. No one uses it in production systems, and it should not be used in production systems. Breaking changes to the language syntax or semantics are fine — don't let backward compatibility concerns block good design decisions.

## Quality

After any code change, run `yarn lint`, `yarn typecheck`, and `yarn test`. Fix all failures before finishing.

## Directory Structure

- `src/grammar.ohm` — Ohm reference grammar for surface-syntax smoke checks (not used by the interpreter pipeline)
- `src/Lexer/` — tokenizer
  - `Lexer.ts` — main tokenizer
  - `Recognizer/` — state-machine recognizers for complex tokens (identifiers, numbers, strings, comments)
- `src/Parser/` — recursive descent parser
  - `Parser.ts` — main parser
  - `AstNode.ts` — all AST node types
  - `Lookahead.ts` — one-token lookahead wrapper
- `src/Interpreter/` — tree-walking interpreter
  - `Interpreter.ts` — main interpreter/visitor
  - `SymbolTable.ts` — linked-list scope chain
  - `objects/` — runtime value types (`LuckyNumber`, `LuckyBoolean`, `LuckyString`, `LuckyFunction`, base `LuckyObject`)
  - `examples/` — integration tests (multi-statement programs)
- `src/repl.ts` — interactive REPL entry point
- `src/testingUtils.ts` — `parse()` helper used in tests

## Architecture

Three-stage pipeline: **Lexer → Parser → Interpreter**

### Lexer (`src/Lexer/`)

Tokenizes source text. `Lexer.tokenize()` is a generator yielding `Token` objects. Complex tokens (identifiers, numbers, comments) delegate to `Recognizer` subclasses (`IdentifierRecognizer`, `NumeralRecognizer`, `CommentRecognizer`) that implement a state machine via `State`/`Case`. `Keyword.fromString()` distinguishes keywords from identifiers.

### Parser (`src/Parser/`)

Recursive descent. `Parser.parse()` → `Program` (AST root). Uses `Lookahead<Token>` wrapper for one-token lookahead. AST node types live in `AstNode.ts`. Operator precedence (lowest to highest): or < and < not (unary) < comparison < arithmetic < term (\*/÷) < factor (unary +/-) < power (`**`).

### Interpreter (`src/Interpreter/`)

Tree-walking visitor. `Interpreter.run()` takes an `AstNode` (typically `Program`) and returns a primitive value. All runtime values are `LuckyObject` subclasses (`LuckyNumber`, `LuckyBoolean`, `LuckyFunction`). Operations (+, -, etc.) dispatch via methods on `LuckyObject`.

**Scope**: `SymbolTable` is a linked-list of scopes. **Function calls are the only scope-creating construct** — `if`/`else`/`while`/`for` execute in the enclosing scope. Each function-call scope is marked with `isFunctionBoundary = true`. Assignment dispatch:

- `setBare(key, value)` — the bare `x = e` path: inside a function writes to the nearest function-boundary scope (local); at top level writes to the current (top-level) scope.
- `setLocal(key, value)` — the `local x = e` path: always writes to the current scope.
- `setOuter(key, value)` — the `outer x = e` path: walks past the current function boundary to find the nearest enclosing non-frozen scope that defines `key`; throws `ScopeError` if not found.
- Reads (`lookup`) always walk the full chain from innermost to the frozen builtins root.

**Frozen builtins**: `SymbolTable.createFrozenBuiltins(BUILTINS)` creates the root scope (parent of the user top-level scope). Its `setLocal` throws; user code can shadow builtins with `local` inside functions or via bare assignment at the top level.

**Return**: implemented by throwing a `Return` error caught in `visitFunctionCall`.

### Test structure

Unit tests are colocated with source files (`*.test.ts`). `src/examples/` holds integration tests for complex multi-statement programs (e.g., fibonacci).

## Development Lifecycle

When adding a new language feature, follow this TDD workflow. Only apply each step to layers that are actually affected by the feature — skip layers that need no changes.

### Step 1 — Grammar (only if the feature involves new syntax)

1. Extend `src/grammar.ohm`, then add or adjust matching cases in `src/grammar.test.ts`
2. Run `yarn test grammar` (or `yarn test`) to verify the Ohm grammar still matches the intended surface syntax

### Step 2 — TypeScript implementation (layer by layer)

For each affected layer, write tests first, then implement. Work in this order:

**Lexer** (if new tokens or tokenization rules are needed)

1. Add tests to `src/Lexer/Lexer.test.ts`
2. Implement in `src/Lexer/`
3. Run `yarn test Lexer`

**Parser** (if new AST nodes or parse rules are needed)

1. Add tests to `src/Parser/Parser.test.ts`
2. Add AST node types to `src/Parser/AstNode.ts` if needed
3. Implement in `src/Parser/Parser.ts`
4. Run `yarn test Parser`

**Interpreter** (if new runtime behavior is needed)

1. Add unit tests colocated with the implementation (e.g., `Interpreter.test.ts` or `objects/LuckyFoo.test.ts`)
2. Add integration tests in `src/examples/` for complex multi-statement scenarios
3. Implement in `src/Interpreter/`
4. Run `yarn test Interpreter`

### Step 3 — Final quality check

Run `yarn lint && yarn typecheck && yarn test`. Fix all failures before finishing.
