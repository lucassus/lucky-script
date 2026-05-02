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

## Architecture

Three-stage pipeline: **Lexer → Parser → Interpreter**

### Lexer (`src/Lexer/`)
Tokenizes source text. `Lexer.tokenize()` is a generator yielding `Token` objects. Complex tokens (identifiers, numbers, comments) delegate to `Recognizer` subclasses (`IdentifierRecognizer`, `NumeralRecognizer`, `CommentRecognizer`) that implement a state machine via `State`/`Case`. `Keyword.fromString()` distinguishes keywords from identifiers.

### Parser (`src/Parser/`)
Recursive descent. `Parser.parse()` → `Program` (AST root). Uses `Lookahead<Token>` wrapper for one-token lookahead. AST node types live in `AstNode.ts`. Operator precedence: comparison < arithmetic < term (*/÷) < factor (unary) < power (`**`).

### Interpreter (`src/Interpreter/`)
Tree-walking visitor. `Interpreter.run()` takes an `AstNode` (typically `Program`) and returns a primitive value. All runtime values are `LuckyObject` subclasses (`LuckyNumber`, `LuckyBoolean`, `LuckyFunction`). Operations (+, -, etc.) dispatch via methods on `LuckyObject`.

**Scope**: `SymbolTable` is a linked-list of scopes. `set()` walks up to find the nearest scope that already defines the variable (dynamic/lexical hybrid); `setLocal()` forces creation in current scope. Functions capture their declaration scope (`LuckyFunction.scope`), creating child scopes on each call.

**Return**: implemented by throwing a `Return` error caught in `visitFunctionCall`.

### Entry points
- `src/repl.ts` — interactive REPL (parse + interpret each line)
- `src/testingUtils.ts` — `parse(input)` helper used in tests

### Test structure
Tests live alongside source files (`*.test.ts`). `src/Interpreter/examples/` holds integration-style tests (e.g., fibonacci).
