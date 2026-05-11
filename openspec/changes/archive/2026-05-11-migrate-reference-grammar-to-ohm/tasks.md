## 1. Lucky Script Ohm grammar

- [x] 1.1 Create `src/grammar.ohm` skeleton: `Program`, statement list with `nl` separator, and the `space` **override** (`space = " " | comment`) plus a `comment` rule that does NOT consume the trailing `\n`. Add a single failing test (`'1 2'` MUST fail) as the early sentinel that the `space` override is correct.
- [x] 1.2 Encode statements: `if`/`elseif`/`else`/`end`, `while`, `break`, `continue`, `return`, bare assignment (simple and compound), `local`/`outer` assignment (simple and compound).
- [x] 1.3 Encode function declarations:
  - named: `fun ident "(" Params ")" nl* Stmts "end"`
  - anonymous block form: `fun "(" Params ")" (Stmts)? "end"` (note: **no required `nl`** before the body, matching `Parser.anonymousFunction`)
  - anonymous short form: `fun "(" Params ")" Expression` (MUST NOT be followed by `end`)
- [x] 1.4 Encode the expression precedence ladder (or < and < not < comparison < arithmetic < term < factor < power), mirroring `Parser.ts`. Assignment is reachable from `Expression` (mirroring `Parser.expression()`'s dispatch on `IDENT (= | += | -= | *= | /=)` lookahead) — see D14.
- [x] 1.5 Encode atoms: number, string, `true`, `false`, `nothing`, identifier, function call (`ident "(" Args ")"`), grouping `( Exp )`. `fun` is NOT a sub-atom.
- [x] 1.6 Encode lexical rules (all lowercase / lexical, NOT syntactic):
  - `identifier = ~keyword letter (letter | digit)*` — no underscore.
  - `keyword = ("fun" | "if" | "else" | "elseif" | "while" | "return" | "nothing" | "true" | "false" | "and" | "or" | "not" | "local" | "outer" | "break" | "continue" | "end" | "then" | "in") ~(letter | digit)` — includes `in` per D8.
  - `number` matching the micro-spec in 2.3 below.
  - `string` using the Ohm-default-shaped escape rule per D9.
  - `comment = "#" (~"\n" any)*` — does NOT eat the trailing `\n`.
  - `nl = "\n"+`.
- [x] 1.7 Create `src/grammar.ts` that loads the grammar via `fs.readFileSync(path.join(__dirname, "grammar.ohm"), "utf-8")` and exports `export const grammar = ohm.grammar(...)`. **No semantic actions, no toy interpreter.**

## 2. Smoke tests in `src/grammar.test.ts`

- [x] 2.1 Positive corpus: port every legacy valid-syntax case from the former Python smoke file, normalized to LF + ASCII spaces. Assert `grammar.match(src).succeeded()`.
- [x] 2.2 Negative corpus: port every legacy invalid-syntax case. Assert `grammar.match(src).failed()`. Add Lucky-specific negatives the old grammar missed:
  - `'1; 2'` (semicolon separation rejected)
  - `'1\r\n2'` (CRLF rejected)
  - `'1\t+\t2'` (tab between tokens rejected)
  - `'_foo'`, `'my_var = 1'` (underscore identifier rejected)
  - `'if = 1'`, `'in = 1'` (keyword as identifier rejected)
  - `'else if'`-chained `if` (two-word `else if` rejected — see D13)
  - `'fun (x) 123 end'` (short form + `end` rejected — see D12)
  - `'1 + fun(x) x'` (`fun` not a sub-atom)
- [x] 2.3 Numeric-literal micro-spec — assert each as the **whole** program:
  - **succeed**: `0`, `0.5`, `.5`, `1_000`, `1.000_001`
  - **fail**: `0123`, `1_`, `1__0`, `5.`, `1e10`, `+1` (the `+1` case checks that `+` is unary, not part of the literal — `match('+1')` should succeed via `factor → +factor`; the spec is that the **number literal alone** does not include the sign. Assert via a dedicated rule check or by matching against a number-only start rule if exposed; if not exposed, document the constraint in a comment.)
- [x] 2.4 Kitchen-sink: port the whole-script integration sample, normalized to LF + ASCII spaces.
- [x] 2.5 Sentinel: assert `grammar.match('1 2').failed()` to guarantee the `space` override actually rejects newline-less statement adjacency.
- [x] 2.6 Run `yarn lint && yarn typecheck && yarn test` and fix all failures **in this change's files only** (do NOT fix probe-test failures from §3 — see D15).

## 3. Lucky Lexer probe tests (add but do not fix)

- [x] 3.1 In `src/Lexer/Lexer.test.ts`, add token-boundary cases: tokenizing `funny`, `iff`, `whilez`, `infinity`, `funin`, `andx`, `orx`, `notx` MUST each yield a single `Literal.Identifier` (not keyword + suffix). If any case fails against the current Lexer, mark with a `TODO(grammar-ohm-followup)` comment and leave it failing — open a follow-up issue.
- [x] 3.2 In `src/Lexer/Lexer.test.ts`, add string-escape probe cases targeting Ohm-default-equivalent surface: `"\t"`, `"\r"`, `"\0"`, `"\xFF"`, `"\u0041"`. Expected outcome (per D9) is acceptance; if the Lexer rejects (via `IllegalSymbolError` in `StringRecognizer`), mark with `TODO(grammar-ohm-followup)` and leave failing.
- [x] 3.3 Document the failing tests' expected resolution path in a one-line code comment pointing back to `openspec/changes/migrate-reference-grammar-to-ohm/`.

## 4. JSON POC under simplified

- [x] 4.1 Add `src/simplified/json.ohm` mirroring the prior JSON grammar POC structure.
- [x] 4.2 Add a Vitest test file under `src/simplified/` with:
  - **valid**: `"hello"`, `42`, `-3.14`, `true`, `false`, `null`, `[]`, `{}`, `[1,2,3]`, `{"a":1,"b":[true,null]}`, escaped strings in keys and values.
  - **invalid**: trailing comma (`[1,2,]`), missing colon (`{"a" 1}`), unquoted key (`{a:1}`), single-quoted string (`'hi'`).

## 5. Docs and CI cleanup — every Python grammar reference goes away

- [x] 5.1 Update **`AGENTS.md`**: remove the Python sandbox command pointer; rewrite `## Development Lifecycle → Step 1 — Grammar` to point at `src/grammar.ohm` + `yarn test`.
- [x] 5.2 Update top-level **`CLAUDE.md`** to match `AGENTS.md` (they currently mirror each other).
- [x] 5.3 Update **`README.md`**: note the Ohm reference grammar at `src/grammar.ohm` and that no Python-based tooling is required for grammar checks.
- [x] 5.4 Update **`roadmap.md`**: remove or rewrite any reference to the old Python sandbox.
- [x] 5.5 Update **`eslint.config.js`**: remove the Python-sandbox ignore entry from the top-level `ignores` array.
- [x] 5.6 Delete the Python sandbox directory and the dedicated Python grammar workflow. Confirm `.github/workflows/main.yaml` is unchanged.
- [x] 5.7 Grep the tree for legacy Python grammar path markers and remove hits outside `openspec/changes/archive/`.

## 6. Verification

- [x] 6.1 Run `yarn lint && yarn typecheck && yarn test`. All grammar/JSON POC suites must pass; probe tests from §3 may remain failing if marked with the `TODO(grammar-ohm-followup)` comment.
- [x] 6.2 Re-run the cleanup grep from 5.7 and confirm zero hits outside `openspec/changes/archive/`.
