# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn install        # install deps
yarn test           # run all tests
yarn test -- --testPathPattern=Lexer  # run single test file
yarn lint           # eslint
yarn typecheck      # tsc --noEmit
yarn build          # compile to dist/
ts-node src/repl.ts # interactive REPL
```

See `lark-sandbox/CLAUDE.md` for lark-sandbox commands.

## Quality

After any code change, run `yarn lint` and `yarn test`. Fix all failures before finishing.

## Directory Structure

- `lark-sandbox/` — reference grammar (Python/Lark) and syntax smoke tests; has its own CLAUDE.md
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
Recursive descent. `Parser.parse()` → `Program` (AST root). Uses `Lookahead<Token>` wrapper for one-token lookahead. AST node types live in `AstNode.ts`. Operator precedence (lowest to highest): or < and < not (unary) < comparison < arithmetic < term (*/÷) < factor (unary +/-) < power (`**`).

### Interpreter (`src/Interpreter/`)
Tree-walking visitor. `Interpreter.run()` takes an `AstNode` (typically `Program`) and returns a primitive value. All runtime values are `LuckyObject` subclasses (`LuckyNumber`, `LuckyBoolean`, `LuckyFunction`). Operations (+, -, etc.) dispatch via methods on `LuckyObject`.

**Scope**: `SymbolTable` is a linked-list of scopes. `set()` walks up to find the nearest scope that already defines the variable (dynamic/lexical hybrid); `setLocal()` forces creation in current scope. Functions capture their declaration scope (`LuckyFunction.scope`), creating child scopes on each call.

**Return**: implemented by throwing a `Return` error caught in `visitFunctionCall`.

### Test structure
Unit tests are colocated with source files (`*.test.ts`). `src/Interpreter/examples/` holds integration tests for complex multi-statement programs (e.g., fibonacci).

## Development Lifecycle

When adding a new language feature, follow this TDD workflow. Only apply each step to layers that are actually affected by the feature — skip layers that need no changes.

### Step 1 — Grammar (only if the feature involves new syntax)

1. Add test cases to `lark-sandbox/lucky_script_test.py`
2. Update `lark-sandbox/lucky_script.lark` to make the tests green
3. Run `cd lark-sandbox && make test` to verify

### Step 2 — TypeScript implementation (layer by layer)

For each affected layer, write tests first, then implement. Work in this order:

**Lexer** (if new tokens or tokenization rules are needed)
1. Add tests to `src/Lexer/Lexer.test.ts`
2. Implement in `src/Lexer/`
3. Run `yarn test -- --testPathPattern=Lexer`

**Parser** (if new AST nodes or parse rules are needed)
1. Add tests to `src/Parser/Parser.test.ts`
2. Add AST node types to `src/Parser/AstNode.ts` if needed
3. Implement in `src/Parser/Parser.ts`
4. Run `yarn test -- --testPathPattern=Parser`

**Interpreter** (if new runtime behavior is needed)
1. Add unit tests colocated with the implementation (e.g., `Interpreter.test.ts` or `objects/LuckyFoo.test.ts`)
2. Add integration tests in `src/Interpreter/examples/` for complex multi-statement scenarios
3. Implement in `src/Interpreter/`
4. Run `yarn test -- --testPathPattern=Interpreter`

### Step 3 — Final quality check

Run `yarn lint && yarn test`. Fix all failures before finishing.
