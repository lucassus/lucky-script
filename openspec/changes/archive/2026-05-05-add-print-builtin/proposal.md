## Why

Lucky Script has no way to produce output. Without `print`, programs can only be observed by reading the return value of the last expression — unusable in the REPL and impossible to test multi-statement programs interactively. Adding `print` unblocks every subsequent feature from being testable end-to-end.

## What Changes

- Introduce a `print` built-in function (arity 1) that writes its argument's string representation to stdout and returns `nothing`
- Add a `display(): string` abstract method to `LuckyObject`, implemented by every runtime value type
- Introduce a `LuckyBuiltin` class to represent native (JS-backed) functions
- Introduce a `builtins.ts` registry as the single place to add future built-ins
- Seed built-ins into the root scope at interpreter startup

## Capabilities

### New Capabilities

- `print-builtin`: The `print(x)` built-in function and the infrastructure supporting native functions (LuckyBuiltin class, builtins registry, display protocol)

### Modified Capabilities

_(none — no existing spec-level requirements change)_

## Impact

- `src/Interpreter/objects/LuckyObject.ts` — new abstract method `display()`
- `src/Interpreter/objects/` — all existing subclasses gain `display()` implementation
- `src/Interpreter/objects/LuckyBuiltin.ts` — new file
- `src/Interpreter/builtins.ts` — new file (registry)
- `src/Interpreter/Interpreter.ts` — constructor seeds built-ins; `visitFunctionCall` gains a `LuckyBuiltin` early-return branch
- No parser or lexer changes required
- No breaking changes to existing programs
