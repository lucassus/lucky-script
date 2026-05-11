### Requirement: Ohm grammar is the authoritative reference spelling for Lucky surface syntax

The project MUST provide an Ohm grammar at `src/grammar.ohm` that describes Lucky Script syntax for smoke validation. The handwritten TypeScript lexer and parser MUST remain the implementation used by the interpreter; the Ohm grammar is a parallel reference, not the runtime parser.

A loader module MUST exist at `src/grammar.ts` that:

- reads `src/grammar.ohm` using a path resolved relative to **`__dirname`** (e.g. `fs.readFileSync(path.join(__dirname, "grammar.ohm"), "utf-8")`), NOT a CWD-relative path,
- exports `export const grammar` as the parsed `ohm.Grammar`,
- contains **no semantic actions, no `addOperation`, and no toy interpreter** — syntax validation only.

#### Scenario: Grammar file exists and loads independent of CWD

- **WHEN** a test imports `grammar` from `src/grammar.ts` while Vitest runs from any working directory under the repo
- **THEN** the grammar loads without throwing and exposes a start rule suitable for whole-program matching

#### Scenario: Loader does not ship semantic actions

- **WHEN** a maintainer reads `src/grammar.ts`
- **THEN** the module SHALL only construct the `ohm.Grammar` and re-export it; no `createSemantics`, no operation registrations

---

### Requirement: Lexical vs syntactic discipline

The Ohm `space` rule MUST be **overridden** (not extended with `+=`) so that it matches `" " | comment` only. Newline (`\n`) MUST NOT be a member of `space` under any rule, so newlines remain structurally significant. Comments MUST stop strictly before the trailing newline (`comment = "#" (~"\n" any)*`), so that the `\n` after a `# …` comment remains available as a statement separator.

All token-shaped concepts (`identifier`, `keyword`, `number`, `string`, `comment`, `nl`) MUST be **lexical** rules. All structural concepts (`Program`, `Stmt`, `Exp`, `If`, `While`, `Fun*`, …) MUST be **syntactic** rules.

The `keyword` rule MUST end with a `~(letter | digit)` boundary check so that identifiers beginning with a keyword (e.g. `funny`, `iff`, `whilez`, `infinity`) do NOT match the keyword prefix.

#### Scenario: Two statements on one line MUST be rejected

- **WHEN** the program `1 2` is matched
- **THEN** matching SHALL fail (this guarantees the `space` override took effect)

#### Scenario: Identifier beginning with a keyword MUST parse as identifier

- **WHEN** the program `funny = 1` is matched
- **THEN** matching SHALL succeed (the grammar treats `funny` as an identifier, not `fun` plus suffix)

#### Scenario: Comment does not swallow the trailing newline

- **WHEN** the program `1 # comment\n2` is matched
- **THEN** matching SHALL succeed and be interpreted as two statements (`1` and `2`) separated by the `\n` left over after the comment

---

### Requirement: Statement separation (LF-only)

Statement boundaries MUST use **LF (`\n`) only**: leading newlines MAY be discarded; successive statements MUST be separated by **one or more `\n`**. The reference grammar intentionally does **NOT** treat `;`, `\r`, or CRLF as separators (the interpreter lexer MAY still accept `;` and typical whitespace). Tabs (`\t`) MUST NOT appear in `space` and therefore tab-padded sources MUST be rejected.

#### Scenario: Empty program is accepted

- **WHEN** the program `""` is matched
- **THEN** matching SHALL succeed

#### Scenario: File of only blank lines and comments is accepted

- **WHEN** the program `"\n\n# hi\n\n"` is matched
- **THEN** matching SHALL succeed

#### Scenario: Semicolon-separated statements are rejected

- **WHEN** the program `1; 2` is matched
- **THEN** matching SHALL fail

#### Scenario: CRLF line endings are rejected

- **WHEN** the program `1\r\n2` is matched
- **THEN** matching SHALL fail

#### Scenario: Tab between tokens is rejected

- **WHEN** the program `1\t+\t2` is matched
- **THEN** matching SHALL fail

#### Scenario: Multiple blank lines separate statements

- **WHEN** two statements appear with multiple consecutive LF characters between them
- **THEN** matching SHALL succeed

---

### Requirement: Conditional and loop headers align with Parser condition ends

After the condition expression in `if`, `elseif`, and `while`, the grammar MUST accept either (**a**) the keyword `then` (optionally followed by `nl*` before the body) or (**b**) `\n` (optionally followed by additional `nl*`) before the body when `then` is omitted — a minimal mirror of `consumeConditionEnd` that does **not** allow `;` after the condition.

Two-word `else if` MUST be rejected; only the single-token `elseif` form is accepted (mirroring `Parser.parseElseBranch`).

#### Scenario: Inline `then` form is accepted

- **WHEN** the snippet `while true then break end` is matched (ASCII spaces only between tokens)
- **THEN** matching SHALL succeed

#### Scenario: Newline opener (no `then`) is accepted

- **WHEN** a multi-line `if` or `while` opens the guarded body immediately after `\n` following the condition expression
- **THEN** matching SHALL succeed

#### Scenario: `elseif` chain is accepted

- **WHEN** the program `if x < 1\n  print(x)\nelseif x == 1\n  print(1)\nelse\n  print(0)\nend` is matched
- **THEN** matching SHALL succeed

#### Scenario: Two-word `else if` is rejected

- **WHEN** the program `if x\nelse if y\nend\nend` is matched
- **THEN** matching SHALL fail

---

### Requirement: Anonymous function shape mirrors `Parser.ts` (not legacy-grammar)

Anonymous functions MUST be modeled with two productions reachable from `Expression`:

- **Block form**: `fun "(" Params ")" (Stmts)? "end"`. A newline before the body is NOT required; `fun () end` and `fun (x) end` are valid.
- **Short form**: `fun "(" Params ")" Expression`. The short form MUST NOT be followed by `end`.

`fun` MUST NOT appear as a sub-atom inside arithmetic expressions (it lives directly under `Expression`, mirroring `Parser.expression()`).

#### Scenario: Empty anonymous block body with no newline is accepted

- **WHEN** the program `fun () end` is matched
- **THEN** matching SHALL succeed

#### Scenario: Short-form anonymous function is accepted

- **WHEN** the program `fun (x) x + 1` is matched
- **THEN** matching SHALL succeed

#### Scenario: Short form followed by `end` is rejected

- **WHEN** the program `fun (x) 123 end` is matched
- **THEN** matching SHALL fail

#### Scenario: `fun` inside arithmetic is rejected

- **WHEN** the program `1 + fun(x) x` is matched
- **THEN** matching SHALL fail

#### Scenario: Malformed parameter lists are rejected

- **WHEN** any of `fun foo(1+2)\nend`, `fun bar(,y)\nend`, `fun foo(fun(bar)\nend)\nend` is matched
- **THEN** matching SHALL fail

---

### Requirement: Numeric literal micro-spec

The Ohm `number` rule MUST accept exactly the shapes the Lucky `NumeralRecognizer` accepts. Concretely:

- **VALID** (the whole program matches): `0`, `0.5`, `.5`, `1_000`, `1.000_001`.
- **INVALID** (matching fails): `0123` (leading zero), `1_` (trailing underscore), `1__0` (double underscore), `5.` (trailing dot), `1e10` (no scientific notation), and the literal `+1` taken as a single number token (the `+` is the unary `+` operator at `factor`, not part of the literal — at program level, `+1` MAY still match via `factor → +factor → number`, but the **`number` rule alone** MUST NOT accept `+1`).

#### Scenario: Each VALID numeric literal succeeds as the whole program

- **WHEN** each of `0`, `0.5`, `.5`, `1_000`, `1.000_001` is matched as the whole program
- **THEN** matching SHALL succeed

#### Scenario: Each INVALID numeric literal fails

- **WHEN** each of `0123`, `1_`, `1__0`, `5.`, `1e10` is matched as the whole program
- **THEN** matching SHALL fail

#### Scenario: Sign is unary, not part of the literal

- **WHEN** the `number` rule alone is asked to match `+1` (via a sub-rule match, not the program start)
- **THEN** matching SHALL fail; matching the whole program `+1` SHALL succeed because the unary `+` operator at `factor` consumes the sign

---

### Requirement: Identifier shape (no underscore, keyword-reserved)

The Ohm `identifier` rule MUST be `~keyword letter (letter | digit)*` — no underscore is permitted (mirroring `IdentifierRecognizer`, diverging from legacy-grammar's `CNAME`). The keyword set MUST include `in` even though no production currently uses it (it is reserved in `Token.ts`).

#### Scenario: Underscore identifier forms are rejected

- **WHEN** any of `_foo`, `my_var = 1`, `foo_bar` is matched as a whole program
- **THEN** matching SHALL fail

#### Scenario: Keywords cannot appear as identifiers

- **WHEN** any of `if = 1`, `while = 1`, `in = 1`, `return = 1` is matched as a whole program
- **THEN** matching SHALL fail

---

### Requirement: String literal follows Ohm defaults; Lucky Lexer is intentionally stricter

The Ohm `string` rule MUST use the conventional Ohm shape — `string = "\"" stringChar* "\""` with `stringChar = "\\" any | ~"\"" any`. The grammar MUST NOT narrow the escape alphabet to the Lucky `StringRecognizer` subset (`\"`, `\\`, `\n`). Strings the Lucky Lexer rejects (e.g. `"\t"`, `"\xFF"`) MAY still be accepted by this grammar; that drift is intentional and surfaced by Lexer probe tests (see the probe-test requirement below).

#### Scenario: Common Lucky string forms match

- **WHEN** any of `"hello"`, `""`, `"hello" + " world"`, `"a" == "b"`, `"say \"hi\""`, `"line1\nline2"`, `"back\\slash"` is matched
- **THEN** matching SHALL succeed

#### Scenario: Ohm-default escape that Lucky Lexer rejects still matches the grammar

- **WHEN** the program `"\t"` is matched against the grammar
- **THEN** matching SHALL succeed (even though the Lucky Lexer would throw — the divergence is intentional for this milestone)

---

### Requirement: Assignment is reachable as an expression (mirror current Lucky)

Simple and compound assignment (`=`, `+=`, `-=`, `*=`, `/=`) MUST be reachable from `Expression`, mirroring `Parser.expression()`'s dispatch on `IDENT` followed by `=` or a compound operator. This includes the bare form and the `local` / `outer` variants. The grammar therefore parses `1 + (x = 2)` and `if x = 1 then end`. This is a known wart inherited from the current implementation; it is **not** in scope to tighten in this change.

#### Scenario: Assignment as a sub-expression is accepted

- **WHEN** the program `1 + (x = 2)` is matched
- **THEN** matching SHALL succeed

#### Scenario: Compound assignment forms parse

- **WHEN** any of `x += 1`, `x -= 1`, `x *= 1`, `x /= 1`, `local x += 1`, `outer x -= 1` is matched
- **THEN** matching SHALL succeed

---

### Requirement: Automated smoke verification at `src/grammar.test.ts`

The implementation MUST ship a Vitest suite at `src/grammar.test.ts` that:

- Asserts `grammar.match(src).succeeded()` for every positive case ported from the former Python smoke suite, normalized to LF + ASCII spaces only (no `\t`, `;`, or CRLF).
- Asserts `grammar.match(src).failed()` for every negative case ported from that suite, plus the Lucky-specific negatives required by other requirements in this spec (`;`, CRLF, tabs, underscore identifiers, keyword-as-identifier, two-word `else if`, short-form + `end`, `fun` in arithmetic).
- Includes the numeric-literal micro-spec scenarios as parametrized cases.
- Includes a kitchen-sink multi-statement script equivalent to the legacy whole-script smoke test, normalized to LF + ASCII spaces.
- Includes the sentinel `grammar.match('1 2').failed()` assertion.

Matching success MUST be asserted without requiring semantic actions on the CST.

#### Scenario: Sentinel guards the `space` override

- **WHEN** the suite runs
- **THEN** `grammar.match('1 2').failed()` SHALL be asserted

#### Scenario: Negative corpus stays rejected

- **WHEN** each legacy invalid-syntax snippet AND each Lucky-specific negative is matched as a whole program
- **THEN** matching SHALL fail

---

### Requirement: Lucky Lexer probe tests for known parity issues (surfaced, not fixed)

`src/Lexer/Lexer.test.ts` MUST contain probe tests that characterize the Lucky Lexer's behavior on two known parity concerns surfaced by this change. The probe tests serve as a baseline for a follow-up change; **failures are acceptable in this milestone** if marked with a `TODO(grammar-ohm-followup)` code comment pointing to `openspec/changes/archive/2026-05-11-migrate-reference-grammar-to-ohm/`. This change MUST NOT modify the Lexer to make the probes pass.

The probes MUST cover:

- **Token-boundary discipline**: tokenizing each of `funny`, `iff`, `whilez`, `infinity`, `funin`, `andx`, `orx`, `notx` MUST be asserted to yield a single `Literal.Identifier`.
- **String escape surface**: tokenizing each of `"\t"`, `"\r"`, `"\0"`, `"\xFF"`, `"\u0041"` MUST be asserted to yield a single `Literal.String` token (the Ohm-default acceptance level — see the string-literal requirement above).

#### Scenario: Probe tests exist for keyword-prefixed identifiers

- **WHEN** `src/Lexer/Lexer.test.ts` is read
- **THEN** it SHALL contain assertions tokenizing at least `funny`, `iff`, `whilez`, `infinity` as single `Literal.Identifier` tokens

#### Scenario: Probe tests exist for broader string escapes

- **WHEN** `src/Lexer/Lexer.test.ts` is read
- **THEN** it SHALL contain assertions tokenizing at least `"\t"`, `"\xFF"`, `"\u0041"` as single `Literal.String` tokens

#### Scenario: Probe failures are tracked, not patched

- **WHEN** any probe test fails against the current Lexer
- **THEN** it SHALL carry a `TODO(grammar-ohm-followup)` comment, and the Lexer SHALL NOT be modified within this change

---

### Requirement: JSON POC grammar relocated under simplified

The JSON surface syntax POC MUST be re-expressed as `src/simplified/json.ohm` and covered by concise Vitest tests in `src/simplified/` that accept representative valid JSON payloads and reject minimal invalid fragments.

#### Scenario: Canonical JSON parses

- **WHEN** any of `"hello"`, `42`, `-3.14`, `true`, `false`, `null`, `[]`, `{}`, `[1,2,3]`, `{"a":1,"b":[true,null]}` is matched against `src/simplified/json.ohm`
- **THEN** matching SHALL succeed

#### Scenario: Common JSON malformations are rejected

- **WHEN** any of `[1,2,]`, `{"a" 1}`, `{a:1}`, `'hi'` is matched
- **THEN** matching SHALL fail

---

### Requirement: Complete removal of the Python grammar sandbox from the project

Every project-level reference to the old Python sandbox (that directory, its workflow, its lint-ignore entry, and obsolete documentation prose) MUST be removed when the Ohm path is wired and green. Specifically:

- The Python sandbox directory MUST be deleted.
- Its dedicated GitHub Actions workflow file MUST be deleted.
- `eslint.config.js` MUST NOT ignore that directory anymore.
- `AGENTS.md`, top-level `CLAUDE.md`, `README.md`, and `roadmap.md` MUST NOT mention the removed Python workflow or legacy grammar paths. The `Development Lifecycle → Step 1 — Grammar` section MUST point at `src/grammar.ohm` + `yarn test`.
- Archived OpenSpec changes under `openspec/changes/archive/` MAY retain their original wording (they are historical artifacts).

#### Scenario: Active tree stays free of stale Python sandbox markers

- **WHEN** a maintainer reviews active documentation and config (excluding `openspec/changes/archive/`)
- **THEN** instructions SHALL reference `src/grammar.ohm` and `yarn test` without pointing contributors at a Python sandbox

#### Scenario: Grammar workflow guidance is Ohm-only

- **WHEN** a new contributor reads `AGENTS.md` or `CLAUDE.md` for the grammar TDD step
- **THEN** the instructions SHALL reference `src/grammar.ohm` and `yarn test` exclusively, with no Python sandbox paths or `make test` workflow for grammar
