## 1. display() protocol on LuckyObject

- [x] 1.1 Add `abstract display(): string` to `LuckyObject`
- [x] 1.2 Implement `display()` on `LuckyNumber` — returns `String(this.value)`
- [x] 1.3 Implement `display()` on `LuckyBoolean` — returns `"true"` or `"false"`
- [x] 1.4 Implement `display()` on `LuckyNothing` — returns `"nothing"`
- [x] 1.5 Implement `display()` on `LuckyString` — returns the raw string value
- [x] 1.6 Implement `display()` on `LuckyFunction` — returns `"<function name>"` or `"<function>"` for anonymous
- [x] 1.7 Run `yarn typecheck` — confirm no subclass is missing `display()`

## 2. LuckyBuiltin class

- [x] 2.1 Create `src/Interpreter/objects/LuckyBuiltin.ts` — class with `name: string`, `arity: number`, private `fn: (args: LuckyObject[]) => LuckyObject`, `call(args)` method, `display()` returning `"<builtin name>"`, and `toBoolean()` returning `LuckyBoolean.True`
- [x] 2.2 Export `LuckyBuiltin` from `src/Interpreter/objects/index.ts`
- [x] 2.3 Write unit tests for `LuckyBuiltin` — verify `call()` invokes the native fn and `display()` returns the expected string

## 3. Builtins registry

- [x] 3.1 Create `src/Interpreter/builtins.ts` — export `BUILTINS: Record<string, LuckyBuiltin>` with a `print` entry: arity 1, calls `console.log(args[0].display())`, returns `LuckyNothing.Instance`

## 4. Interpreter wiring

- [x] 4.1 In `Interpreter` constructor, iterate `BUILTINS` and call `this.scope.setLocal(name, builtin)` for each entry
- [x] 4.2 In `visitFunctionCall`, add an early-return branch: if `obj instanceof LuckyBuiltin`, validate arity, evaluate args, call `obj.call(evaluatedArgs)`, and return the result
- [x] 4.3 Add a TODO comment near the root-scope seeding noting that builtins can currently be overwritten by user code

## 5. Tests

- [x] 5.1 Add unit tests for `display()` on each type (number, boolean, nothing, function named, function anonymous)
- [x] 5.2 Add integration test: `print(42)` writes `"42"` to stdout and returns `nothing`
- [x] 5.3 Add integration test: `print(true)`, `print(false)`, `print(nothing)` each write the correct string
- [x] 5.4 Add integration test: calling `print()` with zero args throws RuntimeError
- [x] 5.5 Add integration test: calling `print(1, 2)` throws RuntimeError
- [x] 5.6 Add integration test: overwriting `print` and calling the replacement
- [x] 5.7 Create `src/examples/helloWorld.test.ts` — define `sayHello(name)` that calls `print("Hello, " + name + "!")`, assert stdout receives `"Hello, World!"`

## 6. Quality check

- [x] 6.1 Run `yarn lint && yarn test` — all passing
