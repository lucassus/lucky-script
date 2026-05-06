# Phase 1 Data Model

The "data" for a tree-walking interpreter is the AST plus the runtime value graph. This feature adds two AST node kinds, two control-flow signal kinds, and two keyword token kinds. There is no persistent storage and no schema migration.

## Token additions (`src/Lexer/Token.ts`)

| Field | Type | Description |
|---|---|---|
| `Keyword.Break` | `Keyword` | Static instance constructed with the literal `"break"`. Auto-registered via the `Keyword` constructor's `Keyword.values.push(this)` so `Keyword.fromString("break")` returns it. |
| `Keyword.Continue` | `Keyword` | Same pattern as above for `"continue"`. |

**Validation rules**: none beyond what `Keyword.fromString` already does — once these statics exist the existing identifier recognizer treats them as keywords automatically.

**State transitions**: N/A (immutable singletons).

## AST nodes (`src/Parser/AstNode.ts`)

### `BreakStatement extends Statement`

| Field | Type | Description |
|---|---|---|
| *(none)* | — | The class carries no data — its presence in the AST is the entire signal. |

**Validation rules** (enforced in the parser, not on the node itself):
- May only appear when `loopDepth > 0` at parse time.
- May only appear at statement position (i.e. produced by `statement()`, never by `expression()`).

### `ContinueStatement extends Statement`

| Field | Type | Description |
|---|---|---|
| *(none)* | — | Same shape as `BreakStatement`. |

**Validation rules**: identical to `BreakStatement`.

## Control-flow signals (`src/Interpreter/ControlFlow.ts`)

### `Break extends ControlFlow`

| Field | Type | Description |
|---|---|---|
| *(inherited `message: string`)* | `string` | Set to `"Break"` for parity with the existing `Return` ("Return") for debugging. |

Constructor: `new Break()` — no arguments.

`Object.setPrototypeOf(this, Break.prototype)` is set in the constructor for the same reason `Return` does it (subclassing `Error` across transpilation targets).

### `Continue extends ControlFlow`

| Field | Type | Description |
|---|---|---|
| *(inherited `message: string`)* | `string` | Set to `"Continue"`. |

Constructor: `new Continue()` — no arguments.

## Parser state (`src/Parser/Parser.ts`)

| Field | Type | Description |
|---|---|---|
| `loopDepth` | `number` (private, default `0`) | Number of `while` bodies currently being parsed. Incremented before parsing a `while` body, decremented after (try/finally). Save/zero/restore around function-literal bodies (named `functionDeclaration` and anonymous `anonymousFunction`). |

**Invariants**:
- `loopDepth >= 0` at all times.
- After `parse()` returns successfully, `loopDepth === 0`.
- A parse error inside a `while` body or a function body must not leak a wrong `loopDepth` into a sibling subtree — guaranteed by `try { … } finally { … }` save/restore.

**Transitions**:
- `whileStatement()`: `loopDepth++` → parse body → `loopDepth--`.
- `functionDeclaration()` / `anonymousFunction()`: `const saved = loopDepth; loopDepth = 0;` → parse body → `loopDepth = saved`.
- `break` / `continue` parsing: if `loopDepth === 0`, throw `SyntaxError("'break' used outside a loop")` (or `'continue'`).

## Relationships

```text
Token (Keyword.Break, Keyword.Continue)
       │
       ▼ recognized by Lexer.tokenize → Parser.statement()
Parser produces:
       ├── BreakStatement   (only if loopDepth > 0)
       └── ContinueStatement (only if loopDepth > 0)
       │
       ▼ executed by Interpreter.visit
Throws:
       ├── new Break()     ← caught by visitWhileStatement (terminates loop)
       └── new Continue()  ← caught by visitWhileStatement (re-tests condition)
```

Both signals propagate through `IfStatement` and any other intermediate statement-bearing constructs unchanged, since those constructs do not catch `ControlFlow`. They are halted only by `visitWhileStatement`. (A future `for` loop must also catch them.)
