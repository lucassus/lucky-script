# Quickstart: `break` and `continue`

This document shows how a Lucky Script programmer uses the feature once it ships, and how a contributor verifies the implementation locally.

## For programmers

Both keywords are statements. They may appear anywhere a statement may appear, **as long as that position is lexically inside a `while` loop body** (and not crossing a function literal boundary).

### Exit a loop early

```text
i = 0
while (true) {
  if (i == 5) {
    break
  }
  i = i + 1
}
// after the loop, i == 5
```

### Skip an iteration

```text
i = 0
while (i < 10) {
  i = i + 1
  if (i == 3) {
    continue
  }
  print(i)
}
// prints 1 2 4 5 6 7 8 9 10
```

### Nested loops

`break` and `continue` always act on the **innermost** enclosing `while`:

```text
while (true) {
  while (true) {
    break        // exits the inner loop only
  }
  break          // exits the outer loop
}
```

### Inside `if` / `else`

`break` / `continue` inside an `if` block belong to the enclosing loop, not the `if`:

```text
while (cond) {
  if (skip) {
    continue   // re-tests `cond` for the next iteration
  }
  if (done) {
    break      // exits this `while`
  }
  // …
}
```

### What is rejected

These programs fail to parse — the interpreter never runs them:

```text
break                                   // top-level
continue                                // top-level
if (cond) { break }                     // not inside a loop
function foo() { break }                // function body resets the loop context
while (true) { function f() { break } } // ditto — function literal inside a loop
```

The error message names the offending statement (e.g. `'break' used outside a loop`).

### What still works (unchanged)

- `return` inside a loop continues to exit the enclosing function (not just the loop).
- Variables assigned before a `break` / `continue` keep their values per the existing scope rules.

## For contributors

### Run the full quality gate

```bash
yarn lint && yarn typecheck && yarn test
cd lark-sandbox && make test
```

All four must pass before declaring the feature done.

### Try it in the REPL

```bash
ts-node src/repl.ts
> i = 0
> while (i < 5) { i = i + 1 if (i == 3) { continue } i }
> // observe that i prints 1, 2, then 4, 5
```

### Verify the parse-time check

```bash
echo 'break' | ts-node src/repl.ts        # expect SyntaxError "'break' used outside a loop"
echo 'function f() { break }' | ts-node src/repl.ts  # same error
```

### Targeted tests

```bash
yarn test Lexer       # keyword recognition
yarn test Parser      # AST nodes + parse-time errors (G1–G13 from contracts/grammar.md)
yarn test Interpreter # runtime semantics (Break/Continue caught in visitWhileStatement)
yarn test examples    # integration scenarios from spec.md User Story 1 and 2
```

### Acceptance scenarios from the spec

The integration test (`src/examples/breakContinue.test.ts`) must implement:

- **US1.1** — `while (true) { if (i == 5) { break } i = i + 1 }` starting from `i = 0` ⇒ `i == 5` after the loop.
- **US1.2** — `while (true) { break }` ⇒ body executes once, control proceeds.
- **US1.3** — nested while; inner `break` exits only inner loop.
- **US2.1** — loop printing 1..10 skipping 3 ⇒ output `1,2,4,5,6,7,8,9,10`.
- **US2.2** — `continue` on every iteration ⇒ no body side effects, loop terminates when condition is false.
- **US2.3** — nested while; inner `continue` skips only inner iteration.

All six map directly to acceptance scenarios in `spec.md` and must pass for SC-003.
