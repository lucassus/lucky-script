# Contract: Error messages

The feature introduces one new class of parse-time error and reuses two existing ones.

## New parse-time error: `break` / `continue` outside a loop

**Trigger**: `Parser.statement()` encounters a `Keyword.Break` or `Keyword.Continue` token when `loopDepth === 0`.

**Error type**: `SyntaxError` (the existing class from `src/Parser/errors.ts`). No new error subclass is introduced — the message string is what distinguishes this case.

**Message format**: exactly one of:

```
'break' used outside a loop
'continue' used outside a loop
```

The single-quoted keyword is the offending statement — this satisfies FR-007's "identify the offending statement". The current parser style does not attach line/column to `SyntaxError` instances; this feature does not change that. (If/when location information is added to `SyntaxError` repository-wide, this error participates automatically.)

**Behaviour**: thrown synchronously from `Parser.parse()`. The interpreter never runs — the program is rejected before the AST root is returned. This satisfies FR-007's "MUST NOT begin execution".

## Reused error: identifier where keyword now lives (FR-010)

After this change `break` and `continue` are reserved words. Any program that previously used either as an identifier (e.g. `break = 1`, `continue + 1`) will be tokenized with `Keyword.Break` / `Keyword.Continue` rather than `Literal.Identifier`. The existing parser's `consume(Literal.Identifier)` paths will then fail with the existing message:

```
Expected 'Identifier' literal but got 'break' keyword.
```

(Or the analogous `'continue'` message.) No new error class or message is introduced for this case.

## No new runtime errors

The interpreter must not throw any new runtime error classes for this feature. Specifically:

- `visitProgram` does **not** add a catch for `Break` or `Continue`.
- `visitFunctionCall` does **not** add a catch for `Break` or `Continue`.
- Only `visitWhileStatement` catches them, and it does so by *handling them as control flow* (terminate or restart the loop), never by re-throwing as a runtime error.

If, despite the parser's check, a `Break` or `Continue` ever escapes to top level at runtime, that indicates a parser regression and the bare `Error` will surface as such (with message `"Break"` or `"Continue"` from the `ControlFlow` constructor). This is intentional — adding a defensive runtime guard would mask the regression. See research.md, Decision 4.

## Error contract test cases

| # | Input | Expected `SyntaxError.message` |
|---|---|---|
| E1 | `break` | `'break' used outside a loop` |
| E2 | `continue` | `'continue' used outside a loop` |
| E3 | `if (true) { break }` | `'break' used outside a loop` |
| E4 | `function foo() { break }` | `'break' used outside a loop` |
| E5 | `while (true) { function foo() { continue } }` | `'continue' used outside a loop` |
| E6 | `while (true) { x = function () { break } }` | `'break' used outside a loop` |
| E7 | `break = 1` | `Expected '(' delimiter but got '=' operator.` *or similar — produced by existing parser machinery, exact wording follows whatever the `Keyword.Break` token does next in the dispatch.* The contract is "the program is rejected", not the exact string. |

E7's exact message follows whatever path the parser takes after consuming the `break` keyword and finding `=` instead of nothing-or-newline. The contract for FR-010 is **rejection**, not a specific wording.
