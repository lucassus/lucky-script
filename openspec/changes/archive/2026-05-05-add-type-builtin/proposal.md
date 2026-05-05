## Why

Lucky Script has no way to inspect a value's type at runtime. This makes it impossible to write generic code that branches on type — a common need in dynamic languages.

## What Changes

- A new `type()` builtin is available in all Lucky Script programs
- `type(value)` returns a string naming the value's type

## Capabilities

### New Capabilities
- `type`: Returns the runtime type of a value as a string (`"number"`, `"string"`, `"boolean"`, `"nothing"`, `"function"`)

### Modified Capabilities

## Impact

- `src/Interpreter/builtins.ts`: add `type` entry
- `src/examples/type.test.ts`: integration tests
