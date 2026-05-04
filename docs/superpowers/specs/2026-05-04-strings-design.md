# String Support Design

**Date:** 2026-05-04
**Feature:** Feature 4 from `docs/plan-next-steps.md`

## Overview

Add string literals to Lucky Script. Strings are double-quoted, support three escape sequences, support concatenation (`+`) and equality comparison (`==`/`!=`), and are truthy/falsy based on length.

## Syntax

```
"hello"          # simple string
""               # empty string (falsy)
"say \"hi\""     # escaped quote
"line1\nline2"   # newline escape
"back\\slash"    # escaped backslash
```

Supported escape sequences: `\"`, `\\`, `\n`. All other characters are literal.

## Supported Operations

| Operation | Example | Result |
|-----------|---------|--------|
| Concatenation | `"hello" + " world"` | `"hello world"` |
| Equality | `"a" == "a"` | `true` |
| Inequality | `"a" != "b"` | `true` |
| Boolean context | `if ("")` | falsy; `if ("x")` truthy |
| Pass to `print` | `print("hi")` | prints `hi` (no quotes) |

Type errors (e.g., `"x" + 1`) throw `RuntimeError`. No coercion.

## Implementation

### Lexer — `src/Lexer/`

**`Token.ts`:** Add `static String = new Literal("String")` to the `Literal` class.

**New `StringRecognizer.ts`** in `src/Lexer/Recognizer/`, extending `Recognizer`. Uses custom `State` objects (same technique as `CommentRecognizer`) to handle the "any character" transitions that the `Case` map cannot express.

State machine:

| State | Final? | Transitions |
|-------|--------|-------------|
| `beginString` | no | `"` → `inString` |
| `inString` | no | any char except `"` and `\` → self; `\` → `escape`; `"` → `endString` |
| `escape` | no | `"`, `\`, `n` → `inString` |
| `endString` | yes | nothing (rejects all) |

`inString` is intentionally **not** final so an unterminated string (`"hello` with no closing `"`) causes `recognized: false` at EOF, triggering `IllegalSymbolError` — the same error path as an invalid numeral.

The recognizer accumulates raw characters **including surrounding quotes**. For `"hi\n"`, the accumulated value is the 6-character string `"hi\n"` (backslash + `n`, not a decoded newline). Escape decoding happens in the interpreter.

**`Lexer.ts`:** Add `case '"':` to the `nextToken()` switch, calling a new `recognizeString()` method that mirrors `recognizeNumber()`:

```typescript
private recognizeString(): Token {
  const value = this.recognizeWith(new StringRecognizer());
  return this.createToken(Literal.String, value);
}
```

**`Recognizer/index.ts`:** Export `StringRecognizer`.

### Parser — `src/Parser/`

**`AstNode.ts`:** Add:

```typescript
export class StringLiteral extends Expression {
  constructor(public readonly value: string) {
    super();
  }
}
```

**`Parser.ts`:** Add to `atom()`, alongside the existing `Numeral`, `NothingLiteral`, `BooleanLiteral` branches:

```typescript
if (currentToken.type === Literal.String) {
  this.consume(Literal.String);
  return new StringLiteral(currentToken.value!);
}
```

The raw token value (including surrounding quotes) is stored in the AST node. No semantic processing at parse time.

### Interpreter — `src/Interpreter/`

**New `objects/LuckyString.ts`:**

```typescript
export class LuckyString extends LuckyObject {
  constructor(public readonly value: string) { super(); }

  add(other: LuckyObject): LuckyObject {
    this.ensureLuckyString(other);
    return new LuckyString(this.value + other.value);
  }

  eq(other: LuckyObject): LuckyBoolean {
    this.ensureLuckyString(other);
    return LuckyBoolean.fromNative(this.value === other.value);
  }

  toBoolean(): LuckyBoolean {
    return LuckyBoolean.fromNative(this.value.length > 0);
  }

  display(): string {
    return this.value; // no surrounding quotes, used by print
  }

  private ensureLuckyString(other: LuckyObject): asserts other is LuckyString {
    if (!(other instanceof LuckyString)) {
      this.throwIllegalOperationError();
    }
  }
}
```

`neq` is inherited from `LuckyObject` (delegates to `eq`) — no override needed.

**`objects/index.ts`:** Export `LuckyString`.

**`Interpreter.ts`:** Add `visitStringLiteral`:

```typescript
private visitStringLiteral(node: StringLiteral): LuckyString {
  const raw = node.value.slice(1, -1); // strip surrounding quotes
  const decoded = raw
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, '\n');
  return new LuckyString(decoded);
}
```

Escape replacements run in order: `\\` before `\n`/`\"` to avoid double-processing. Add the `instanceof StringLiteral` branch in `visit()`.

## Files Touched

| File | Change |
|------|--------|
| `src/Lexer/Token.ts` | Add `Literal.String` |
| `src/Lexer/Recognizer/StringRecognizer.ts` | New file |
| `src/Lexer/Recognizer/index.ts` | Export `StringRecognizer` |
| `src/Lexer/Lexer.ts` | Add `case '"':` + `recognizeString()` |
| `src/Parser/AstNode.ts` | Add `StringLiteral` node |
| `src/Parser/Parser.ts` | Add branch in `atom()` |
| `src/Interpreter/objects/LuckyString.ts` | New file |
| `src/Interpreter/objects/index.ts` | Export `LuckyString` |
| `src/Interpreter/Interpreter.ts` | Add `visitStringLiteral` + `visit()` branch |

## Testing

**`src/Interpreter/objects/LuckyString.test.ts`** (unit):
- `add()`: string + string concatenates; string + number throws
- `eq()`: equal strings → true; unequal → false; non-string → throws
- `neq()`: inherited — verify it delegates correctly
- `toBoolean()`: `""` → false; `"x"` → true

**`src/Lexer/Lexer.test.ts`** (additions):
- `"hello"` → `Literal.String` token, value `"hello"` (with quotes)
- `""` → token with value `""`
- `"say \"hi\""` → token with raw value preserved
- `"back\\slash"` and `"line\n"` → raw values preserved
- Unterminated string → `IllegalSymbolError`

**`src/Parser/Parser.test.ts`** (additions):
- String literal → `StringLiteral` AST node
- `"a" + "b"` → `BinaryOperation` with two `StringLiteral` children

**`src/Interpreter/examples/strings.test.ts`** (integration):
- `"hello" + " world"` → `"hello world"`
- `"a" == "a"` → `true`; `"a" != "b"` → `true`
- Empty string in `if` condition takes else branch
- Non-empty string in `if` condition takes then branch
- `"line1\nline2"` — decoded value contains actual newline character
- `"x" + 1` → throws `RuntimeError`
