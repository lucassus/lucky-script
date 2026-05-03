# Boolean Operators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `and`, `or`, `not` operators and `true`/`false` boolean literals to Lucky Script.

**Architecture:** Five new keywords feed into extended AST types (`BooleanLiteral`, widened `BinaryOperator`/`UnaryOperator`). The parser gains three grammar levels (`orExpression → andExpression → notExpression`) above `comparison`. The interpreter handles short-circuit evaluation for `and`/`or` before the existing eager-evaluation path.

**Tech Stack:** TypeScript, Jest (`yarn test`), ESLint (`yarn lint`)

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `src/Lexer/Token.ts` | Modify | Add `True`, `False`, `And`, `Or`, `Not` to `Keyword` |
| `src/Parser/AstNode.ts` | Modify | Add `BooleanLiteral`; extend `BinaryOperator` and `UnaryOperator` |
| `src/Parser/index.ts` | Modify | Export `BooleanLiteral` |
| `src/Parser/Parser.ts` | Modify | Widen `binaryOperation`; add `orExpression`, `andExpression`, `notExpression`; update `expression()` and `atom()` |
| `src/Interpreter/Interpreter.ts` | Modify | Dispatch `BooleanLiteral`; add `visitBooleanLiteral`; short-circuit `and`/`or`; `not` unary case |
| `src/Interpreter/objects/LuckyNumber.ts` | Modify | Implement `toBoolean()` |
| `src/Interpreter/objects/LuckyFunction.ts` | Modify | Implement `toBoolean()` |
| `src/Lexer/Lexer.test.ts` | Modify | Add keyword recognition tests |
| `src/Parser/Parser.test.ts` | Modify | Add boolean literal + operator parsing tests |
| `src/Interpreter/objects/LuckyNumber.test.ts` | Create | Unit test `toBoolean()` |
| `src/Interpreter/objects/LuckyFunction.test.ts` | Create | Unit test `toBoolean()` |
| `src/Interpreter/examples/booleans.test.ts` | Create | Integration tests |

---

## Task 1: Keywords and AST types

**Files:**
- Modify: `src/Lexer/Token.ts`
- Modify: `src/Parser/AstNode.ts`
- Modify: `src/Parser/index.ts`
- Modify: `src/Lexer/Lexer.test.ts`

- [ ] **Step 1: Write failing lexer tests**

Add to `src/Lexer/Lexer.test.ts` inside the existing `describe("Lexer", ...)` block (after the last existing test):

```ts
it.each`
  input      | keyword
  ${"true"}  | ${Keyword.True}
  ${"false"} | ${Keyword.False}
  ${"and"}   | ${Keyword.And}
  ${"or"}    | ${Keyword.Or}
  ${"not"}   | ${Keyword.Not}
`("tokenizes '$input' as a keyword", ({ input, keyword }) => {
  const tokens = [...new Lexer(input).tokenize()];
  expect(tokens[0]).toEqual(new Token(keyword, anyLocation));
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn test --testPathPattern=Lexer
```

Expected: 5 failures — `Keyword.True`, `Keyword.False`, etc. are undefined.

- [ ] **Step 3: Add keywords to Token.ts**

In `src/Lexer/Token.ts`, after `static Nothing = new Keyword("nothing");`:

```ts
static True = new Keyword("true");
static False = new Keyword("false");
static And = new Keyword("and");
static Or = new Keyword("or");
static Not = new Keyword("not");
```

- [ ] **Step 4: Extend BinaryOperator and UnaryOperator in AstNode.ts**

In `src/Parser/AstNode.ts`, replace:

```ts
export type BinaryOperator =
  | "+"
  | "-"
  | "*"
  | "/"
  | "**"
  | "<"
  | "<="
  | "=="
  | "!="
  | ">="
  | ">";
```

with:

```ts
export type BinaryOperator =
  | "+"
  | "-"
  | "*"
  | "/"
  | "**"
  | "<"
  | "<="
  | "=="
  | "!="
  | ">="
  | ">"
  | "and"
  | "or";
```

Replace:

```ts
export type UnaryOperator = "+" | "-";
```

with:

```ts
export type UnaryOperator = "+" | "-" | "not";
```

- [ ] **Step 5: Add BooleanLiteral node to AstNode.ts**

After the `NothingLiteral` class:

```ts
export class BooleanLiteral extends Expression {
  constructor(public readonly value: boolean) {
    super();
  }
}
```

- [ ] **Step 6: Export BooleanLiteral from Parser index**

In `src/Parser/index.ts`, replace:

```ts
export { AstNode, Numeral, BinaryOperation, UnaryOperation } from "./AstNode";
```

with:

```ts
export { AstNode, BooleanLiteral, BinaryOperation, Numeral, UnaryOperation } from "./AstNode";
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
yarn test --testPathPattern=Lexer
```

Expected: all pass.

- [ ] **Step 8: Lint and full test suite**

```bash
yarn lint && yarn test
```

Expected: no errors, all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/Lexer/Token.ts src/Parser/AstNode.ts src/Parser/index.ts src/Lexer/Lexer.test.ts
git commit -m "feat: add boolean keywords and AST types"
```

---

## Task 2: Parse boolean literals

**Files:**
- Modify: `src/Parser/Parser.test.ts`
- Modify: `src/Parser/Parser.ts`

- [ ] **Step 1: Write failing parser tests**

Add to `src/Parser/Parser.test.ts`, after the `"parses the nothing literal"` test:

```ts
describe("boolean literals", () => {
  it("parses true", () => {
    expect(parse("true")).toEqual(new Program([new BooleanLiteral(true)]));
  });

  it("parses false", () => {
    expect(parse("false")).toEqual(new Program([new BooleanLiteral(false)]));
  });
});
```

Add `BooleanLiteral` to the import at the top of the test file:

```ts
import {
  BinaryOperation,
  BooleanLiteral,
  FunctionCall,
  FunctionDeclaration,
  IfStatement,
  NothingLiteral,
  Numeral,
  Program,
  ReturnStatement,
  UnaryOperation,
  VariableAccess,
  VariableAssigment,
} from "./AstNode";
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn test --testPathPattern=Parser
```

Expected: 2 failures — `Unexpected 'true' keyword.`

- [ ] **Step 3: Add true/false parsing to atom() in Parser.ts**

In `src/Parser/Parser.ts`, add to the top-level imports from `./AstNode`:

```ts
import {
  BinaryOperation,
  BinaryOperator,
  BooleanLiteral,
  Expression,
  FunctionCall,
  FunctionDeclaration,
  IfStatement,
  NothingLiteral,
  Numeral,
  Program,
  ReturnStatement,
  Statement,
  UnaryOperation,
  UnaryOperator,
  VariableAccess,
  VariableAssigment,
} from "./AstNode";
```

In `atom()`, before the `throw new SyntaxError(...)` line, add:

```ts
if (currentToken.type === Keyword.True) {
  this.consume(Keyword.True);
  return new BooleanLiteral(true);
}

if (currentToken.type === Keyword.False) {
  this.consume(Keyword.False);
  return new BooleanLiteral(false);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn test --testPathPattern=Parser
```

Expected: all pass.

- [ ] **Step 5: Lint and full test suite**

```bash
yarn lint && yarn test
```

Expected: no errors, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/Parser/Parser.ts src/Parser/Parser.test.ts
git commit -m "feat: parse boolean literals true/false"
```

---

## Task 3: Parse `not` operator

**Files:**
- Modify: `src/Parser/Parser.test.ts`
- Modify: `src/Parser/Parser.ts`

- [ ] **Step 1: Write failing parser tests**

Add to the `"boolean literals"` describe block (or a sibling describe) in `src/Parser/Parser.test.ts`:

```ts
describe("not operator", () => {
  it("parses not true", () => {
    expect(parse("not true")).toEqual(
      new Program([new UnaryOperation("not", new BooleanLiteral(true))]),
    );
  });

  it("parses double not (right-associative)", () => {
    expect(parse("not not false")).toEqual(
      new Program([
        new UnaryOperation(
          "not",
          new UnaryOperation("not", new BooleanLiteral(false)),
        ),
      ]),
    );
  });

  it("comparison binds tighter than not: not 1 == 1 parses as not (1 == 1)", () => {
    expect(parse("not 1 == 1")).toEqual(
      new Program([
        new UnaryOperation(
          "not",
          new BinaryOperation(new Numeral("1"), "==", new Numeral("1")),
        ),
      ]),
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn test --testPathPattern=Parser
```

Expected: 3 failures — `Unexpected 'not' keyword.`

- [ ] **Step 3: Add notExpression() to Parser.ts**

In `src/Parser/Parser.ts`, add this method after `comparison()`:

```ts
private notExpression(): Expression {
  if (this.currentToken.type === Keyword.Not) {
    this.consume(Keyword.Not);
    return new UnaryOperation("not", this.notExpression());
  }
  return this.comparison();
}
```

Update `expression()` to call `notExpression()` instead of `comparison()`:

```ts
private expression(): Expression {
  if (
    this.currentToken.type === Literal.Identifier &&
    this.nextToken.type === Operator.Assigment
  ) {
    return this.assigment();
  }

  if (this.currentToken.type === Keyword.Function) {
    return this.anonymousFunction();
  }

  return this.notExpression();
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn test --testPathPattern=Parser
```

Expected: all pass.

- [ ] **Step 5: Lint and full test suite**

```bash
yarn lint && yarn test
```

Expected: no errors, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/Parser/Parser.ts src/Parser/Parser.test.ts
git commit -m "feat: parse not operator"
```

---

## Task 4: Parse `and`/`or` operators

**Files:**
- Modify: `src/Parser/Parser.test.ts`
- Modify: `src/Parser/Parser.ts`

- [ ] **Step 1: Write failing parser tests**

Add to `src/Parser/Parser.test.ts`:

```ts
describe("and / or operators", () => {
  it("parses and", () => {
    expect(parse("true and false")).toEqual(
      new Program([
        new BinaryOperation(
          new BooleanLiteral(true),
          "and",
          new BooleanLiteral(false),
        ),
      ]),
    );
  });

  it("parses or", () => {
    expect(parse("true or false")).toEqual(
      new Program([
        new BinaryOperation(
          new BooleanLiteral(true),
          "or",
          new BooleanLiteral(false),
        ),
      ]),
    );
  });

  it("and has higher precedence than or: a or b and c = a or (b and c)", () => {
    expect(parse("a or b and c")).toEqual(
      new Program([
        new BinaryOperation(
          new VariableAccess("a"),
          "or",
          new BinaryOperation(
            new VariableAccess("b"),
            "and",
            new VariableAccess("c"),
          ),
        ),
      ]),
    );
  });

  it("not has higher precedence than and: not a and b = (not a) and b", () => {
    expect(parse("not a and b")).toEqual(
      new Program([
        new BinaryOperation(
          new UnaryOperation("not", new VariableAccess("a")),
          "and",
          new VariableAccess("b"),
        ),
      ]),
    );
  });

  it("brackets override precedence: a and (b or c)", () => {
    expect(parse("a and (b or c)")).toEqual(
      new Program([
        new BinaryOperation(
          new VariableAccess("a"),
          "and",
          new BinaryOperation(
            new VariableAccess("b"),
            "or",
            new VariableAccess("c"),
          ),
        ),
      ]),
    );
  });

  it("comparison binds tighter than and: true and x > 0 = true and (x > 0)", () => {
    expect(parse("true and x > 0")).toEqual(
      new Program([
        new BinaryOperation(
          new BooleanLiteral(true),
          "and",
          new BinaryOperation(new VariableAccess("x"), ">", new Numeral("0")),
        ),
      ]),
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn test --testPathPattern=Parser
```

Expected: 6 failures — parser does not yet recognise `and`/`or`.

- [ ] **Step 3: Widen binaryOperation signature in Parser.ts**

In `src/Parser/Parser.ts`, change the `binaryOperation` method signature from `Operator[]` to `TokenType[]`:

```ts
private binaryOperation(
  leftBranch: () => Expression,
  operators: TokenType[],
  rightBranch?: () => Expression,
): Expression {
  let left = leftBranch.apply(this);

  while (operators.includes(this.currentToken.type)) {
    const tokenType = this.currentToken.type;
    this.consume(tokenType);

    const right = (rightBranch || leftBranch).apply(this);
    left = new BinaryOperation(left, tokenType.name as BinaryOperator, right);
  }

  return left;
}
```

- [ ] **Step 4: Add orExpression() and andExpression() to Parser.ts**

Add after `notExpression()`:

```ts
private orExpression(): Expression {
  return this.binaryOperation(this.andExpression, [Keyword.Or]);
}

private andExpression(): Expression {
  return this.binaryOperation(this.notExpression, [Keyword.And]);
}
```

- [ ] **Step 5: Update expression() to call orExpression()**

Replace the `return this.notExpression();` line in `expression()` with:

```ts
return this.orExpression();
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
yarn test --testPathPattern=Parser
```

Expected: all pass.

- [ ] **Step 7: Lint and full test suite**

```bash
yarn lint && yarn test
```

Expected: no errors, all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/Parser/Parser.ts src/Parser/Parser.test.ts
git commit -m "feat: parse and/or operators with correct precedence"
```

---

## Task 5: Implement toBoolean() for LuckyNumber and LuckyFunction

Note: `LuckyNothing.toBoolean()` already returns `LuckyBoolean.False` — no change needed there.

**Files:**
- Create: `src/Interpreter/objects/LuckyNumber.test.ts`
- Create: `src/Interpreter/objects/LuckyFunction.test.ts`
- Modify: `src/Interpreter/objects/LuckyNumber.ts`
- Modify: `src/Interpreter/objects/LuckyFunction.ts`

- [ ] **Step 1: Write failing tests for LuckyNumber.toBoolean()**

Create `src/Interpreter/objects/LuckyNumber.test.ts`:

```ts
import { LuckyBoolean } from "./LuckyBoolean";
import { LuckyNumber } from "./LuckyNumber";

describe("LuckyNumber.toBoolean()", () => {
  it("returns False for 0", () => {
    expect(new LuckyNumber(0).toBoolean()).toBe(LuckyBoolean.False);
  });

  it("returns True for positive numbers", () => {
    expect(new LuckyNumber(1).toBoolean()).toBe(LuckyBoolean.True);
    expect(new LuckyNumber(42).toBoolean()).toBe(LuckyBoolean.True);
  });

  it("returns True for negative numbers", () => {
    expect(new LuckyNumber(-1).toBoolean()).toBe(LuckyBoolean.True);
  });
});
```

- [ ] **Step 2: Write failing test for LuckyFunction.toBoolean()**

Create `src/Interpreter/objects/LuckyFunction.test.ts`:

```ts
import { LuckyBoolean } from "./LuckyBoolean";
import { LuckyFunction } from "./LuckyFunction";
import { SymbolTable } from "../SymbolTable";

describe("LuckyFunction.toBoolean()", () => {
  it("is always True", () => {
    const fn = new LuckyFunction(new SymbolTable(), undefined, [], []);
    expect(fn.toBoolean()).toBe(LuckyBoolean.True);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
yarn test --testPathPattern=LuckyNumber|LuckyFunction
```

Expected: failures with `RuntimeError: Illegal operation`.

- [ ] **Step 4: Implement LuckyNumber.toBoolean()**

In `src/Interpreter/objects/LuckyNumber.ts`, replace:

```ts
toBoolean(): LuckyBoolean {
  this.throwIllegalOperationError();
}
```

with:

```ts
toBoolean(): LuckyBoolean {
  return LuckyBoolean.fromNative(this.value !== 0);
}
```

- [ ] **Step 5: Implement LuckyFunction.toBoolean()**

In `src/Interpreter/objects/LuckyFunction.ts`, replace:

```ts
toBoolean(): LuckyBoolean {
  this.throwIllegalOperationError();
}
```

with:

```ts
toBoolean(): LuckyBoolean {
  return LuckyBoolean.True;
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
yarn test --testPathPattern=LuckyNumber|LuckyFunction
```

Expected: all pass.

- [ ] **Step 7: Lint and full test suite**

```bash
yarn lint && yarn test
```

Expected: no errors, all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/Interpreter/objects/LuckyNumber.ts src/Interpreter/objects/LuckyNumber.test.ts src/Interpreter/objects/LuckyFunction.ts src/Interpreter/objects/LuckyFunction.test.ts
git commit -m "feat: implement toBoolean() for LuckyNumber and LuckyFunction"
```

---

## Task 6: Interpret boolean literals

**Files:**
- Create: `src/Interpreter/examples/booleans.test.ts`
- Modify: `src/Interpreter/Interpreter.ts`

- [ ] **Step 1: Write failing integration test**

Create `src/Interpreter/examples/booleans.test.ts`:

```ts
import { Lexer } from "../../Lexer";
import { Parser } from "../../Parser";
import { Interpreter } from "../Interpreter";

function run(script: string): undefined | boolean | number {
  const tokens = new Lexer(script).tokenize();
  const ast = new Parser(tokens).parse();
  return new Interpreter(ast).run();
}

describe("Boolean literals", () => {
  it.each`
    script     | expected
    ${"true"}  | ${true}
    ${"false"} | ${false}
  `("evaluates $script to $expected", ({ script, expected }) => {
    expect(run(script)).toBe(expected);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn test --testPathPattern=booleans
```

Expected: failures with `RuntimeError: Unsupported AST node type BooleanLiteral`.

- [ ] **Step 3: Add BooleanLiteral imports to Interpreter.ts**

In `src/Interpreter/Interpreter.ts`, add `BooleanLiteral` to the AstNode import:

```ts
import {
  FunctionCall,
  FunctionDeclaration,
  BooleanLiteral,
  IfStatement,
  NothingLiteral,
  Program,
  ReturnStatement,
  VariableAccess,
  VariableAssigment,
} from "../Parser/AstNode";
```

- [ ] **Step 4: Add dispatch and visitBooleanLiteral to Interpreter.ts**

In the `visit()` method, after the `if (node instanceof NothingLiteral)` block, add:

```ts
if (node instanceof BooleanLiteral) {
  return this.visitBooleanLiteral(node);
}
```

Add new method after `visitNumeral`:

```ts
private visitBooleanLiteral(node: BooleanLiteral): LuckyBoolean {
  return LuckyBoolean.fromNative(node.value);
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
yarn test --testPathPattern=booleans
```

Expected: all pass.

- [ ] **Step 6: Lint and full test suite**

```bash
yarn lint && yarn test
```

Expected: no errors, all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/Interpreter/Interpreter.ts src/Interpreter/examples/booleans.test.ts
git commit -m "feat: interpret boolean literals"
```

---

## Task 7: Interpret `not` operator

**Files:**
- Modify: `src/Interpreter/examples/booleans.test.ts`
- Modify: `src/Interpreter/Interpreter.ts`

- [ ] **Step 1: Write failing integration tests**

Add to the `describe` block in `src/Interpreter/examples/booleans.test.ts`:

```ts
describe("not operator", () => {
  it.each`
    script       | expected
    ${"not true"}  | ${false}
    ${"not false"} | ${true}
    ${"not 0"}     | ${true}
    ${"not 1"}     | ${false}
    ${"not -1"}    | ${false}
  `("evaluates $script to $expected", ({ script, expected }) => {
    expect(run(script)).toBe(expected);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn test --testPathPattern=booleans
```

Expected: 5 failures — `RuntimeError: Unsupported unary operator not`.

- [ ] **Step 3: Add not case to visitUnaryOperation in Interpreter.ts**

In `visitUnaryOperation`, add a case before the `default`:

```ts
case "not":
  return LuckyBoolean.fromNative(value.toBoolean() === LuckyBoolean.False);
```

The full method becomes:

```ts
private visitUnaryOperation(node: UnaryOperation): LuckyObject {
  const value = this.visit(node.child);

  switch (node.operator) {
    case "+":
      return value;
    case "-":
      return value.mul(new LuckyNumber(-1));
    case "not":
      return LuckyBoolean.fromNative(value.toBoolean() === LuckyBoolean.False);
    default:
      throw new RuntimeError(`Unsupported unary operator ${node.operator}`);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn test --testPathPattern=booleans
```

Expected: all pass.

- [ ] **Step 5: Lint and full test suite**

```bash
yarn lint && yarn test
```

Expected: no errors, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/Interpreter/Interpreter.ts src/Interpreter/examples/booleans.test.ts
git commit -m "feat: interpret not operator"
```

---

## Task 8: Interpret `and`/`or` with short-circuit evaluation

**Files:**
- Modify: `src/Interpreter/examples/booleans.test.ts`
- Modify: `src/Interpreter/Interpreter.ts`

- [ ] **Step 1: Write failing integration tests**

Add to `src/Interpreter/examples/booleans.test.ts`:

```ts
describe("and operator", () => {
  it.each`
    script               | expected
    ${"true and true"}   | ${true}
    ${"true and false"}  | ${false}
    ${"false and true"}  | ${false}
    ${"1 and 2"}         | ${true}
    ${"0 and true"}      | ${false}
  `("evaluates $script to $expected", ({ script, expected }) => {
    expect(run(script)).toBe(expected);
  });

  it("short-circuits: right side not evaluated when left is false", () => {
    // undeclaredFn() would throw RuntimeError if called
    expect(run("false and undeclaredFn()")).toBe(false);
  });
});

describe("or operator", () => {
  it.each`
    script                | expected
    ${"false or true"}    | ${true}
    ${"false or false"}   | ${false}
    ${"0 or false"}       | ${false}
    ${"true and false == false"} | ${true}
    ${"-1 or 0"}          | ${true}
  `("evaluates $script to $expected", ({ script, expected }) => {
    expect(run(script)).toBe(expected);
  });

  it("short-circuits: right side not evaluated when left is true", () => {
    // undeclaredFn() would throw RuntimeError if called
    expect(run("true or undeclaredFn()")).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn test --testPathPattern=booleans
```

Expected: failures with `RuntimeError: Unsupported operator and` (or similar).

- [ ] **Step 3: Add and/or short-circuit to visitBinaryOperation in Interpreter.ts**

In `visitBinaryOperation`, add short-circuit cases at the top of the method, before the existing `const left = ...` line:

```ts
private visitBinaryOperation(node: BinaryOperation): LuckyObject {
  if (node.operator === "and") {
    const left = this.visit(node.left);
    return left.toBoolean() === LuckyBoolean.False
      ? LuckyBoolean.False
      : this.visit(node.right).toBoolean();
  }

  if (node.operator === "or") {
    const left = this.visit(node.left);
    return left.toBoolean() === LuckyBoolean.True
      ? LuckyBoolean.True
      : this.visit(node.right).toBoolean();
  }

  const left = this.visit(node.left);
  const right = this.visit(node.right);

  switch (node.operator) {
    case "+":
      return left.add(right);
    case "-":
      return left.sub(right);
    case "*":
      return left.mul(right);
    case "/":
      return left.div(right);
    case "**":
      return left.pow(right);
    case "<":
      return left.lt(right);
    case "<=":
      return left.lte(right);
    case "==":
      return left.eq(right);
    case "!=":
      return left.neq(right);
    case ">=":
      return left.gte(right);
    case ">":
      return left.gt(right);
    default:
      throw new RuntimeError(`Unsupported operator ${node.operator}`);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn test --testPathPattern=booleans
```

Expected: all pass.

- [ ] **Step 5: Lint and full test suite**

```bash
yarn lint && yarn test
```

Expected: no errors, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/Interpreter/Interpreter.ts src/Interpreter/examples/booleans.test.ts
git commit -m "feat: interpret and/or with short-circuit evaluation"
```
