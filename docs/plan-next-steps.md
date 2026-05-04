# Next 6 Features for Lucky Script

## Context

Lucky Script currently has: numbers, booleans, nothing, functions (closures, first-class), if/else, arithmetic + comparison operators. No way to produce output, no loops, no text, no collections. These 6 features form a coherent progression where each unlocks the next.

---

## Feature Order

### 1. Boolean operators: `and` / `or` / `not`

**Why first:** needed for meaningful loop conditions (`while x > 0 and x < 10`). Without them, complex conditions require nested ifs.

**Implementation:**
- `src/Lexer/Token.ts` — add `and`, `or`, `not` to `Keyword` enum
- `src/Parser/Parser.ts` — add grammar levels:
  - `or` (lowest precedence, left-associative) → `and` → `not` (unary) → existing comparison
- `src/Parser/AstNode.ts` — reuse `BinaryOperation` for `and`/`or`; reuse `UnaryOperation` for `not`
- `src/Interpreter/Interpreter.ts` — handle in `visitBinaryOperation` / `visitUnaryOperation`: short-circuit `and`/`or`, return `LuckyBoolean`

---

### 2. `print` built-in

**Why second:** makes every subsequent feature immediately testable in REPL and integration tests.

**Implementation:**
- Add `LuckyBuiltin` class in `src/Interpreter/objects/` representing native functions
- Pre-populate root `SymbolTable` with `print` bound to a builtin that calls `console.log` on its argument's string representation and returns `LuckyNothing`
- Each `LuckyObject` subclass needs a `toString()` / `display()` method
- `src/Interpreter/Interpreter.ts` — `visitFunctionCall` already handles calls; ensure builtin callable form works

---

### 3. `while` loop

**Why third:** simplest loop form, no dependency on lists.

**Implementation:**
- `src/Lexer/Token.ts` — add `while` keyword
- `src/Parser/AstNode.ts` — add `WhileStatement { condition: Expression, body: Statement[] }`
- `src/Parser/Parser.ts` — parse `while (expr) { stmts }`
- `src/Interpreter/Interpreter.ts` — `visitWhileStatement`: evaluate condition, loop body until falsy
- No `break`/`continue` in this iteration

---

### 4. Strings

**Syntax:** double quotes only — `"hello"`. Escape sequences: `\"`, `\\`, `\n`.

**Operations at launch:** `+` concatenation, `==`/`!=` comparison, passable to `print`.

**Implementation:**
- `src/Lexer/Lexer.ts` + new `StringRecognizer` (mirrors `NumeralRecognizer` pattern) — tokenize `"..."`, handle escapes
- `src/Lexer/Token.ts` — add `StringLiteral` token type
- `src/Parser/AstNode.ts` — add `StringLiteral { value: string }` node
- `src/Parser/Parser.ts` — parse string literal as primary expression
- `src/Interpreter/objects/LuckyString.ts` — new class extending `LuckyObject`
  - `add(other)` → string concat
  - `equals(other)` → boolean
  - `display()` → raw string value (no quotes)
- `src/Interpreter/Interpreter.ts` — `visitStringLiteral`

---

### 5. Lists (immutable)

**Syntax:** `[1, 2, 3]` literal. Index access: `lst[0]`. No mutation methods.

**Implementation:**
- `src/Lexer/Token.ts` — add `[` `]` tokens (if not already present)
- `src/Parser/AstNode.ts` — add:
  - `ListLiteral { elements: Expression[] }`
  - `IndexAccess { target: Expression, index: Expression }`
- `src/Parser/Parser.ts`:
  - Parse `[expr, ...]` as primary expression
  - Parse `expr[expr]` as postfix (same level as function call)
- `src/Interpreter/objects/LuckyList.ts` — new class, stores `LuckyObject[]`
  - `getIndex(i: LuckyNumber)` → element or `IndexError`
  - `equals(other)` → element-wise
  - `display()` → `[a, b, c]`
- `src/Interpreter/Interpreter.ts` — `visitListLiteral`, `visitIndexAccess`

---

### 6. `for-each` loop

**Syntax:** `for item in list { body }` — iterates over list elements.

**Why last:** depends on lists being stable.

**Implementation:**
- `src/Lexer/Token.ts` — add `for`, `in` keywords
- `src/Parser/AstNode.ts` — add `ForEachStatement { variable: string, iterable: Expression, body: Statement[] }`
- `src/Parser/Parser.ts` — parse `for identifier in expr { stmts }`
- `src/Interpreter/Interpreter.ts` — `visitForEachStatement`: create child scope, bind loop var to each element, execute body

---

### 7. Error handling: `try/catch/end` (deferred)

**Why last:** significant interpreter complexity (propagation, error types, stack unwinding). Implement only after features 1–6 are stable.

**Planned syntax:**

```
try
  result = riskyOperation()
catch e
  print(f"Error: {e}")
end
```

**Implementation (when ready):**
- `src/Lexer/Token.ts` — add `try`, `catch` keywords
- `src/Parser/AstNode.ts` — add `TryCatchStatement { body: Statement[], errorVar: string, handler: Statement[] }`
- `src/Parser/Parser.ts` — parse `try ... catch identifier ... end`
- `src/Interpreter/Interpreter.ts` — `visitTryCatchStatement`: wrap body execution, catch runtime errors, bind to `errorVar` in handler scope
- Runtime errors (index out of bounds, type errors, etc.) throw catchable `LuckyRuntimeError`

---

## Critical Files

| File | Touched by |
|------|-----------|
| `src/Lexer/Token.ts` | 1, 3, 4, 5, 6, 7 |
| `src/Lexer/Lexer.ts` | 4 (StringRecognizer) |
| `src/Parser/AstNode.ts` | 1 (minor), 3, 4, 5, 6, 7 |
| `src/Parser/Parser.ts` | 1, 3, 4, 5, 6, 7 |
| `src/Interpreter/Interpreter.ts` | all |
| `src/Interpreter/objects/` | 2 (LuckyBuiltin), 4 (LuckyString), 5 (LuckyList) |
| `src/Interpreter/SymbolTable.ts` | 2 (seed builtins in root scope) |

---

## Verification

Each feature: `yarn lint && yarn test` must stay green.

Integration tests to add per feature:
1. `and/or/not`: `true and false == false`, short-circuit behavior
2. `print`: prints numbers, booleans, nothing; returns nothing
3. `while`: countdown loop, fibonacci with while
4. strings: concat, compare, print
5. lists: literal, index access, out-of-bounds error
6. for-each: iterate list, accumulate sum
7. try/catch: catch index error, catch type error, re-raise

---

## Future Ideas (post-roadmap)

- **Compound assignment**: `+=`, `-=`, `*=`, `/=` — desugar to `x = x + 1` at parse time