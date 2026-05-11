## Context

Lucky Script's interpreter represents all values as `LuckyObject` subclasses. Builtins are registered in `builtins.ts` as `LuckyBuiltin` instances with a fixed arity and a native function.

## Goals / Non-Goals

**Goals:**

- Add `type()` as a builtin that returns a string type name

**Non-Goals:**

- Type coercion or casting
- Distinguishing user-defined functions from builtins (both return `"function"`)

## Decisions

### Decision 1: Use `instanceof` checks in the native function

The native function receives a `LuckyObject[]`. We check `instanceof` in order (LuckyNumber, LuckyString, LuckyBoolean, LuckyNothing, LuckyFunction/LuckyBuiltin) and return a `LuckyString` with the type name. No changes to `LuckyObject` base class needed.
