# Contract: Surface grammar

This contract defines the surface syntax accepted by the Lucky Script parser for `break` and `continue`. Two artifacts must agree:

1. The lark reference grammar at `lark-sandbox/lucky_script.lark` (context-free; surface-syntax only).
2. The TypeScript recursive-descent parser at `src/Parser/Parser.ts` (context-sensitive; also enforces the "inside a loop body" rule).

## Grammar additions

### Lark reference grammar (`lark-sandbox/lucky_script.lark`)

```lark
statement          : func_declaration
                   | if_statement
                   | while_statement
                   | return_statement
                   | break_statement       // NEW
                   | continue_statement    // NEW
                   | local_assignment
                   | outer_assignment
                   | expression

break_statement    : "break"               // NEW
continue_statement : "continue"            // NEW
```

No precedence or associativity changes. `break` and `continue` are reserved keywords once the rules above are added (lark will refuse to lex them as identifiers because the rules consume them).

### TypeScript parser (`src/Parser/Parser.ts`)

In the `statement()` dispatch:

```ts
if (this.currentToken.type === Keyword.Break)    return this.breakStatement();
if (this.currentToken.type === Keyword.Continue) return this.continueStatement();
```

`breakStatement()` and `continueStatement()`:

1. Consume the keyword token.
2. If `loopDepth === 0`, throw `SyntaxError("'break' used outside a loop")` (or `'continue'`).
3. Return `new BreakStatement()` / `new ContinueStatement()`.

`whileStatement()` brackets its `block()` call with `loopDepth++` … `loopDepth--` (in a `try { … } finally { … }` so a parse error inside the body cannot leave the counter wrong).

`functionDeclaration()` and `anonymousFunction()` save the current `loopDepth`, set it to `0`, and restore it (also via `try { … } finally { … }`) around the `block()` call.

## Accepted programs (must parse)

| # | Program |
|---|---|
| G1 | `while (true) { break }` |
| G2 | `while (i < 10) { if (i == 3) { continue } i = i + 1 }` |
| G3 | `while (true) { while (false) { break } }` (inner break does not leak) |
| G4 | `while (true) { while (true) { continue } break }` (both used in different positions) |
| G5 | `while (true) { if (a) { break } else { continue } }` |
| G6 | `while (true) { x = 1 break }` (statements after `break` parse but are unreachable at runtime) |

## Rejected programs (must fail at parse time)

| # | Program | Why |
|---|---|---|
| G7 | `break` | Top-level use; `loopDepth === 0`. |
| G8 | `continue` | Top-level use; `loopDepth === 0`. |
| G9 | `function foo() { break }` | Function body resets `loopDepth` to 0. |
| G10 | `while (true) { function foo() { break } }` | Function definition inside a loop still resets `loopDepth`. |
| G11 | `while (true) { x = function () { continue } }` | Anonymous function body also resets. |
| G12 | `if (true) { break }` | Not inside a loop. |
| G13 | `break = 1` | After this change `break` is a reserved word and cannot appear in identifier position; the lexer/parser must reject. |

The lark grammar enforces G7–G12 only insofar as the surface syntax allows the keyword to appear; **the "inside a loop body" rule is enforced solely by the TypeScript parser**. The lark sandbox documents this with comments in the test file and only exercises positive surface-syntax cases (G1–G6) plus G13 (since `break` ceases to be a valid identifier).

## Parse-tree shape

For G1 (`while (true) { break }`):

```text
Program
└── WhileStatement
    ├── condition: BooleanLiteral(true)
    └── body: [ BreakStatement ]
```

For G2 (`while (i < 10) { if (i == 3) { continue } i = i + 1 }`):

```text
Program
└── WhileStatement
    ├── condition: BinaryOperation(VariableAccess(i), '<', Numeral(10))
    └── body:
        ├── IfStatement
        │   ├── condition: BinaryOperation(VariableAccess(i), '==', Numeral(3))
        │   └── thenBranch: [ ContinueStatement ]
        └── VariableAssigment(i, BinaryOperation(VariableAccess(i), '+', Numeral(1)), 'bare')
```
