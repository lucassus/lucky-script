# Lucky Script v1 (archived)

Hand-built **lexer**, **recursive-descent parser**, and **AST-walking interpreter** — the original “crafted” stack (recognizer state machines, manual lookahead, `SymbolTable`, `LuckyObject` runtime types).

**Not evolving v1:** no new language features and no dialect expansion. Keep tests green for mechanical fixes only; product work belongs in **v2** (see root [`AGENTS.md`](../../AGENTS.md) and [`src/v2/AGENTS.md`](../v2/AGENTS.md)).

## Layout (under `src/v1/`)

```
grammar.ohm          # Surface-syntax / regression smoke (not wired into v1 runtime)
grammar.ohm-bundle.*
grammar.ts           # Grammar wrapper / helpers for tests where used
Lexer/               # Hand-written tokenizer (Recognizer/, Token, …)
Parser/              # Recursive descent (Parser, AstNode, Lookahead, …)
Interpreter/         # Tree walk (Interpreter, SymbolTable, builtins, objects/, …)
examples/            # Integration tests (multi-statement programs)
repl.ts              # REPL over v1 interpreter
testingUtils.ts      # Test helpers (e.g. parse)
```

## Architecture: Lexer → Parser → Interpreter

**Lexer** (`Lexer/`): `Lexer.tokenize()` yields `Token` objects; complex tokens use `Recognizer` subclasses (`IdentifierRecognizer`, `NumeralRecognizer`, `CommentRecognizer`, …) on `State` / `Case`. `Keyword.fromString()` separates keywords from identifiers.

**Parser** (`Parser/`): Recursive descent; `Parser.parse()` → `Program`. One-token `Lookahead<Token>`; AST in `AstNode.ts`. Operator precedence (low to high): or < and < not (unary) < comparison < arithmetic < term (`*` / `÷`) < factor (unary +/-) < power (`**`).

**Interpreter** (`Interpreter/`): Visitor over the AST; `Interpreter.run()` returns `LuckyObject` values; operators dispatch on those objects.

**Scope** (`SymbolTable`): Linked scopes; **only function calls** create a boundary — `if` / `while` use the enclosing scope. Assignments: `setBare`, `setLocal`, `setOuter`; `lookup` walks to the frozen builtins root. **`Return`** uses throw/catch inside `visitFunctionCall`.

## Tests

Colocated `*.test.ts` next to sources. Larger programs: `examples/`. Reference grammar coverage: `grammar.test.ts` + `grammar.ohm` (see root [`AGENTS.md`](../../AGENTS.md) for bundle regeneration).

## Maintenance workflow (TDD, when you must touch v1)

Only for fixes in the archived stack — not for new language features.

1. **Grammar smoke** — adjust `grammar.ohm` / `grammar.test.ts` if needed; run `ohm generateBundles --withTypes 'src/**/*.ohm'` then `yarn test grammar` (matches `**/grammar.test.ts`).
2. **Lexer** — `Lexer/Lexer.test.ts`, implement under `Lexer/`.
3. **Parser** — `Parser/Parser.test.ts`, `AstNode.ts`, `Parser.ts`.
4. **Interpreter** — colocated tests, `examples/` for integration scenarios.

Finish with root quality bar: `yarn lint && yarn typecheck && yarn test`.
