## Context

Today the **reference grammar** used to live in a Python sandbox beside the repo. It is being replaced by **`src/grammar.ohm`**. The **executable language** uses a handwritten lexer (`src/Lexer/`), recursive-descent parser (`src/Parser/Parser.ts`), and interpreter (`src/Interpreter/`). The old Python description and this Ohm grammar both describe **surface syntax acceptance** only; they are not used in the runtime pipeline. The repo already depends on **`ohm-js`**. A separate **`src/simplified/`** subtree holds an older Ohm toy grammar for experimentation.

## Goals / Non-Goals

**Goals:**

- Provide a single **Node/Vitest** path to validate reference syntax alongside `yarn test`.
- Make **`src/grammar.ohm`** the canonical Ohm spelling of Lucky surface syntax presently described in legacy-grammar, **approximately** aligned with **`Parser.ts`** for structure, but **intentionally minimal** on line endings and horizontal whitespace (see decisions; the interpreter remains more permissive).
- Ship **syntax-only** wiring: `src/grammar.ts` exposes the loaded grammar; `src/grammar.test.ts` asserts `match` success/failure. **No toy interpreter** in this milestone (unlike `src/simplified/grammar.ts`).
- Port **smoke coverage** equivalent to former legacy-grammar parametrized tests plus one larger script corpus and an explicit numeric-literal micro-spec.
- Move the prior JSON grammar POC semantics into **`src/simplified/json.ohm`** with lightweight tests as a POC grammar sibling to `grammar.ohm`.
- Surface (without fixing) two known Lucky-Lexer / Ohm-grammar parity issues via dedicated Lucky Lexer tests so future work has a concrete baseline.
- Remove Python CI, the Python sandbox tree, and every other obsolete reference (lint ignores, docs, workflows; trim stale prose in active docs outside `openspec/changes/archive/`).

**Non-Goals:**

- Replacing **`Parser.ts`** or generating parsers from Ohm this iteration.
- Specifying runtime semantics (scope, builtins, interpreter errors beyond parse shape).
- Extending Lucky syntax to match futuristic examples in **`roadmap.md`**.
- Adding semantic actions on the Ohm CST. The grammar is acceptance-only.
- Validating `src/examples/*.test.ts` script strings against the Ohm grammar (potentially useful, but explicitly **out of scope** for this change — focus is on a grammar POC, not a drift harness).
- Fixing any Lucky Lexer parity issues the probe tests reveal. Failures will be filed and addressed in a follow-up change.

## Decisions

### D1: Grammar file layout and loader

**Chosen**: `src/grammar.ohm` holds the grammar text. `src/grammar.ts` reads it with `fs.readFileSync(path.join(__dirname, "grammar.ohm"), "utf-8")` and exports `export const grammar = ohm.grammar(...)`. Tests live at `src/grammar.test.ts`.

**Rationale**: `__dirname`-relative loading works under Vitest, `ts-node`, and the compiled `dist/` build without CWD coupling. The simplified POC at `src/simplified/grammar.ts` is **NOT** the template here — it uses a CWD-relative path (`fs.readFileSync("src/simplified/grammar.ohm", ...)`), which we deliberately avoid.

### D2: Lexical vs syntactic rules (Ohm's biggest trap)

**Chosen**: All token-shaped concepts are **lexical rules** (lowercase initial: `identifier`, `keyword`, `number`, `string`, `comment`, `nl`). Everything structural (`Program`, `Stmt`, `Exp`, …) is a **syntactic rule** (Capital initial). The Ohm `space` rule is **overridden** (`space = " " | comment`), not extended with `space += comment`. This is the linchpin: Ohm's default `space` includes `\n`, which would erase statement separation entirely.

**Rationale**: Without an override, syntactic rules auto-skip newlines and the grammar becomes incapable of recognizing line-delimited statements. Lexical rules then preserve token-internal strictness (e.g. `funny` is one identifier, not `fun` followed by `ny`).

### D3: Minimal line breaks (`\n` only, no `;`, no CRLF)

**Chosen**: The reference grammar treats **only LF (`\n`)** as a statement/closing-structure line separator. **`\r`/CRLF normalization is explicitly out of scope** (no `\r`-aware rules). **`;`** is **not** a separator in the grammar even though **`Lexer`** maps **`;`** to `Delimiter.NewLine`.

**Rationale**: Keep the rule set trivial. `;`-separated scripts and CRLF-heavy sources may still parse in the interpreter but are **not** validated by this grammar.

### D4: Minimal horizontal skip (space only, no tab)

**Chosen**: The Ohm `space` rule matches **ASCII space (`U+0020`) only** plus **`#` … end-of-line** comments. **No `\t`** in `space`. The comment rule MUST stop **before** the trailing `\n` so the newline remains available as a statement separator (`comment = "#" (~"\n" any)*`).

**Rationale**: Mirrors D2/D3 — keep horizontal skip narrow and structural newline behavior explicit. The Lucky Lexer still skips `\t`; the grammar is intentionally stricter.

### D5: Structure parity (non-lexical) with `Parser.ts`

**Chosen**: For control flow and expressions, **`Parser.ts`** is the behavioral guide. The prior standalone grammar files are superseded everywhere they disagree with `Parser.ts` (see D11–D14).

**Rationale**: legacy-grammar and Lucky have drifted in several places. The TS implementation is the source of truth for surface acceptance.

### D6: Numeric literal micro-spec

The Ohm `number` rule MUST accept exactly the shapes the Lucky `NumeralRecognizer` accepts.

**VALID**:

- `0`
- `0.5`
- `.5` (leading dot is allowed because `NumeralRecognizer.beginNumber` transitions on `.`)
- `1_000`
- `1.000_001`

**INVALID** (matching MUST fail when the whole program is just the literal):

- `0123` (leading zero followed by digits — `zero.on(...Digits).switchTo(invalid)`)
- `1_` (trailing underscore — `beginIntegerSeparator` is non-final)
- `1__0` (double underscore — only digits are accepted after the separator)
- `5.` (trailing dot — `beginFractionalPart` is non-final)
- `1e10` (no scientific notation — `e` is the start of an identifier)
- `+1` (the sign is the unary `+` operator at the `factor` level, not part of the literal)

### D7: Identifier shape (no underscore)

**Chosen**: `identifier = ~keyword letter (letter | digit)*`. Identifiers do **not** allow `_` (matches `IdentifierRecognizer`, diverges from legacy-grammar's `CNAME`).

**Rationale**: legacy-grammar's `common.CNAME` is `(letter|"_")(letter|digit|"_")*` and silently accepts `_foo` and `my_var`. The Lucky lexer rejects both. Ohm follows the lexer.

### D8: Keyword set and reservation of `in`

**Chosen**: The `keyword` rule enumerates every Lucky keyword and ends with a `~(letter | digit)` boundary: `fun if else elseif while return nothing true false and or not local outer break continue end then in`. `in` is included even though no production uses it yet — `Token.ts` reserves it, and the Ohm grammar mirrors that reservation.

**Rationale**: Prevents `funny`/`iff` from masquerading as keywords, and prevents `in` from leaking into identifier positions just because legacy-grammar/Lucky drifted on this point.

### D9: String literal follows Ohm defaults (Lexer drift is deferred)

**Chosen**: The Ohm `string` rule uses the conventional Ohm shape — `string = "\"" stringChar* "\""`, with `stringChar = "\\" any | ~"\"" any`. **No Lucky-specific narrowing** of the escape alphabet in this grammar.

**Rationale**: The Lucky `StringRecognizer` accepts only `\"`, `\\`, `\n` and throws on any other escape (e.g. `\t`, `\u0041`). That is stricter than Ohm-default and stricter than legacy-grammar's `ESCAPED_STRING`. Rather than re-encode that strictness in Ohm, we accept the broader surface here and **probe the Lucky Lexer in a follow-up-shaped test** (see D15). The probe is allowed to fail; this change does not fix the Lexer.

### D10: Statement lists

**Chosen**: Encode nullable statement lists separated by **one-or-more `\n`** (no `;`), with redundant blank lines tolerated. Concrete shape: `Program = nl* (Stmt (nl+ Stmt)*)? nl*` (and the equivalent inside blocks). `nl = "\n"+` so a single token absorbs runs of newlines where structurally needed.

### D11: `consume_condition_end` shape

**Chosen**: After `if`/`elseif`/`while` conditions, accept either `then` (optionally followed by `nl*` before the body) or a `\n` (followed by `nl*`) directly before the body. Do **not** model `;` after the condition.

### D12: Anonymous functions mirror `Parser.ts`, not legacy-grammar

**Chosen**:

- Short form: `fun ( params ) Expression`. MUST NOT be followed by `end`.
- Block form: `fun ( params ) (Stmts)? "end"` where the body may be **empty** with no intervening newline (`fun () end` is valid).

**Rationale**: `Parser.anonymousFunction` accepts `fun () end` and explicitly throws on `fun () expr end`. legacy-grammar's `_NEWLINE statements "end"` requires a newline before the body — we follow the parser, not legacy-grammar.

### D13: `else if` two-word form is rejected

**Chosen**: The grammar accepts `elseif` (single token, single keyword) but rejects `else if` as a chain head. Mirrors `Parser.parseElseBranch` which explicitly throws `SyntaxError("Expected 'elseif' instead of 'else if'.")`.

### D14: Assignment is an expression (mirror Lucky, defer cleanup)

**Chosen**: The Ohm grammar treats simple and compound assignment as productions reachable through `Expression` (matching `Parser.expression()`'s `assigment` dispatch), so `1 + (x = 2)` parses. **This is a known wart** — it lets assignment appear in arbitrary expression positions — but we mirror current behavior. A separate change may tighten this later.

### D15: Lucky Lexer probe tests (added here, fixed later)

**Chosen**: Add Lucky Lexer tests in `src/Lexer/Lexer.test.ts` covering:

- **Token-boundary discipline**: identifiers like `funny`, `iff`, `whilez`, `infinity`, `funin` MUST tokenize as a single `Literal.Identifier`, not as keyword-plus-suffix.
- **String escape surface**: cases that Ohm-default and legacy-grammar accept but Lucky's `StringRecognizer` may reject (e.g. `"\t"`, `"\r"`, `"\0"`, `"\xFF"`).

If any of these tests fail against the current Lexer, **leave them failing** and open a follow-up. Document with `// TODO(grammar-ohm): see openspec/changes/migrate-reference-grammar-to-ohm` so the link is obvious.

**Rationale**: Surfacing parity gaps is the whole point of moving the reference grammar to live next to the TS implementation. Forcing fixes in this change would bloat its scope.

### D16: Naming and layout

**Chosen**: Full reference grammar at `src/grammar.ohm`; loader at `src/grammar.ts`; tests at `src/grammar.test.ts`. JSON POC stays under `src/simplified/json.ohm`. The pre-existing `src/simplified/grammar.ohm` (the arithmetic toy) keeps its `//`-comment convention; we do not unify it with the new `#` convention.

## Risks / Trade-offs

| Risk                                                                                                            | Mitigation                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ohm's default `space` swallows `\n`**, silently erasing statement boundaries.                                 | D2/D4 mandate an **override** of `space` (not `+=`) and a sentinel test asserting `1 2` fails early in the smoke suite.                                                                 |
| **Token-boundary discipline** (keywords vs identifiers) is easy to get wrong in Ohm.                            | D2 mandates lexical rules and a `~(letter \| digit)` boundary on `keyword`. D15 adds Lucky Lexer probe tests to catch parallel issues there.                                            |
| **String surface drift** between Lucky Lexer (strict) and Ohm grammar (Ohm-default).                            | D9 accepts the drift on purpose. D15 surfaces it via Lexer tests. A follow-up change will reconcile.                                                                                    |
| **Reference grammar / parser disagreement** on `\t`, `;`, CRLF.                                                 | Documented as intentional subset (D3/D4); smoke corpus is rewritten in spaces + LF.                                                                                                     |
| **Ohm ergonomics** — verbose duplication between program- and block-level statement lists.                      | Accept moderate duplication rather than parameterization hacks; prioritize readability.                                                                                                 |
| **Contributor breakage** — removing Python toolchain.                                                           | Documented in `AGENTS.md`/`CLAUDE.md` with the new `yarn test` path and rationale.                                                                                                      |
| **Loader path coupling** — CWD-relative `fs.readFileSync` breaks under `ts-node`, sub-directory runs, `dist/`.  | D1 mandates `__dirname` (or equivalent) resolution.                                                                                                                                     |
| **Lark drift** copied into Ohm (CNAME-style identifiers, `common.NUMBER` scientific notation, broad keyword set). | D6–D8 enumerate the divergences and the spec adds explicit negative scenarios so they cannot be silently re-introduced.                                                                 |

## Migration Plan

1. Add `src/grammar.ohm`, `src/grammar.ts` (loader only), and `src/grammar.test.ts` (smoke + numeric micro-spec + kitchen-sink); confirm green suite with **`yarn lint`**, **`yarn typecheck`**, **`yarn test`**.
2. Add `src/simplified/json.ohm` + tests.
3. Add Lucky Lexer probe tests (D15). If any fail, mark them with `it.fails` / `it.todo` / a `TODO` comment as appropriate (do **not** fix the Lexer here).
4. Update docs (`AGENTS.md`, top-level `CLAUDE.md`, `README.md`, `roadmap.md`); delete the Python sandbox directory, its CI workflow, and the `eslint.config.js` sandbox ignore entry.
5. Grep the tree for obsolete Python sandbox markers and remove every remaining reference outside of archived OpenSpec changes.

## Resolved / closed

- **CRLF**: `\n`-only in the grammar; ignore Windows line-ending edge cases.
- **Toy interpreter on the Ohm grammar**: not in this milestone; `grammar.ts` only loads and exports.
- **`src/examples/` as a drift corpus**: out of scope; revisit in a follow-up.

## Open Questions

- Whether smoke tests SHOULD assert explicit match-failure traces or only `succeeded()`/`failed()` booleans — start with booleans for simplicity.
