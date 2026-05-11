## Context

Lucky Script currently uses `function` / `{}` / parenthesized-conditions syntax inherited from C/JavaScript. The pipeline is Lexer → Parser → Interpreter, with the parser producing an AST that the interpreter walks. The `block()` method in `Parser.ts` is the single point that consumes `{`/`}` — all block-creating constructs delegate to it. The interpreter is unaffected by syntax changes since the AST structure remains the same.

Current block-creating constructs:
- Named function: `function name(params) { ... }`
- Anonymous function: `function (params) { ... }`
- If/else: `if (expr) { ... } else { ... }`
- While: `while (expr) { ... }`

Upcoming constructs (already on roadmap):
- For-each: `for item in list ... end`
- Try/catch: `try ... catch e ... end`

## Goals / Non-Goals

**Goals:**
- Replace `function` with `fn`, `{}` with `end`, remove required `()` around conditions
- Support short-form lambda `fn(x) expr` with implicit return for single-expression anonymous functions
- Add `then` keyword for single-line `if`/`while` blocks
- Add `elseif` keyword to flatten else-if chains
- Reserve `in` keyword for upcoming `for`-each
- Keep interpreter unchanged — all changes are syntax-level only

**Non-Goals:**
- Implicit return for full-form functions (explicit `return` still required)
- `do` prefix for `while` blocks
- Numeric `for` loops (only for-each with `in`)
- Backward compatibility or migration tooling for old syntax
- Changes to runtime behavior, scoping, or the interpreter

## Decisions

### D1: Condition termination — newline + optional `then`

Conditions in `if`/`while` are terminated by a newline or the `then` keyword. This follows Ruby's approach.

- Multi-line: `if x > 0\n ... end` — newline ends condition
- Single-line: `if x > 0 then ... end` — `then` ends condition
- `then` is optional when a newline follows the condition
- `then` is required for same-line blocks

**Alternatives considered:**
- Keep `()` around conditions (rejected: contradicts the Ruby/Lua feel goal)
- Require `then` always (rejected: too verbose for multi-line)
- Newline-only, no single-line (rejected: too restrictive)

### D2: `elseif` as a single keyword

`elseif` replaces `else if` as two separate tokens. One `end` closes the entire chain.

```
if a
  ...
elseif b
  ...
else
  ...
end
```

**Rationale:** With `else if`, each `if` is a nested block needing its own `end`, leading to confusing multiple `end`s. A single `elseif` keeps the chain flat with one `end`.

**Alternatives considered:**
- `else if` (two keywords, multiple `end`s) — verbose, visually misleading
- `elif` (Python spelling) — less readable, too Python-specific

### D3: Short-form lambda — `fn(params) expr`

When the token immediately after the parameter list is on the same line (not a newline), parse one expression as the body. The expression's value is implicitly returned. No `end` is consumed or allowed.

```
fn(x) x * 2          # short form — implicit return
fn(a, b) a + b       # short form — implicit return

fn(x)                 # full form — newline after params
  return x * 2       # explicit return required
end
```

The parser distinguishes the two forms by checking whether a newline follows the closing `)` of the parameter list:
- Same-line token after `)` → short form (one expression, no `end`)
- Newline after `)` → full form (statements, `end` required)

**`end` after short form is a parse error** — prevents ambiguity about which form the programmer intended.

**Alternatives considered:**
- Always require `end` (rejected: `fn(x) x * 2 end` is noisy for callbacks)
- Separate `lambda` keyword (rejected: two concepts for the same thing)
- Implicit return for full form too (rejected: decided against — explicit `return` keeps multi-line functions clear)

### D4: `end` as a Keyword, `Delimiter.End` renamed to `Delimiter.Eof`

`end` becomes a `Keyword` (not a `Delimiter`). The existing `Delimiter.End` (used for EOF) is renamed to `Delimiter.Eof` to avoid naming confusion.

**Rationale:** `end` is a word with semantic meaning (block terminator), making it a keyword is more natural. EOF is a sentinel, not a word — `Eof` as a delimiter type is clearer.

### D5: Short form restricted to anonymous functions only

Named functions always use full form: `fn name(params)\n ... end`. Short form is only for anonymous functions: `fn(params) expr`.

**Rationale:** A named function with a single-expression body is unusual enough that requiring full form is fine. The short form's purpose is ergonomic callbacks: `nums.map(fn(x) x * 2)`.

## Risks / Trade-offs

- **[Breaking change]** All existing code becomes invalid → Acceptable for a young language with no external users. Update all test fixtures.
- **[Parsing ambiguity: short form boundary]** `fn(x) x * 2` — where does the expression end? → Mitigated by "one complete expression" rule: the parser stops at `)`, `,`, newline, or any token that cannot continue the expression.
- **[Reserved word collision]** `fn` and `end` can no longer be variable names → Acceptable; unlikely anyone uses these. `in` also reserved but not yet used.
- **[Newline sensitivity]** The parser now cares about newlines to distinguish short vs full form and to terminate conditions → This is inherent to the `end`-block style. The language already uses newlines as statement separators, so this is consistent.
- **[Missing `then` confusion]** `if x + 1 end` — parser would try to parse `x + 1` as condition, then hit `end` → Clear parse error: "expected newline or `then` after condition".
