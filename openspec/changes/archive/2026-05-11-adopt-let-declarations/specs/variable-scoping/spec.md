## MODIFIED Requirements

### Requirement: Function calls are the only scope-creating construct

The interpreter SHALL create a new variable scope only when entering a function body. Control-flow constructs (`if`, `else`, `while`) SHALL execute their body in the surrounding scope. Each scope SHALL track whether it is a function boundary so closures and lexical lookup can distinguish function scopes from the chain of surrounding scopes.

#### Scenario: assignment inside an if block is visible after the block

- **WHEN** a top-level program runs `if true; let x = 1; end` followed by `print(x)`
- **THEN** `print(x)` outputs `1` (no `NameError`)

#### Scenario: assignment inside a while loop persists after the loop

- **WHEN** a top-level program runs `let n = 0; while n < 3; n = n + 1; end` followed by `print(n)`
- **THEN** `print(n)` outputs `3`

#### Scenario: function call creates a fresh scope

- **WHEN** a function declares `let x = 1` and the caller has its own `x` bound to `0`
- **THEN** the caller's `x` remains `0` after the call returns

### Requirement: Reads walk the lexical scope chain

A variable read `x` SHALL walk from the current scope up through enclosing scopes until a binding is found, terminating at the frozen builtins scope. If no scope contains `x`, a `NameError` SHALL be raised.

#### Scenario: read finds the local binding before walking up

- **WHEN** the program runs `let x = 1`, then a function body runs `let x = 2; print(x)`
- **THEN** the function prints `2`

#### Scenario: read walks past the function boundary when no local is bound

- **WHEN** the program runs `let x = 1`, then a function body runs `print(x)`
- **THEN** the function prints `1`

#### Scenario: read of an undefined name raises NameError

- **WHEN** the program evaluates `print(z)` and no binding for `z` exists anywhere
- **THEN** a `NameError` is raised naming `z`

#### Scenario: read before a later local declaration sees the outer binding

- **WHEN** the program runs `let x = 1`, then a function body runs `print(x); let x = 2`
- **THEN** the function prints `1` (no static resolver alters the read)

### Requirement: Builtins live in a frozen root scope

Builtin bindings (e.g., `print`, `type`) SHALL live in a dedicated scope that is the parent of the top-level user scope. Reassignment traversal SHALL NOT mutate that builtins scope. User code SHALL be able to shadow builtins via `let` in writable scopes, while the frozen builtins bindings remain unchanged.

#### Scenario: assigning to builtin name without declaration fails

- **WHEN** the program runs `print = "x"` at the top level without prior `let print = ...`
- **THEN** evaluation raises `NameError` and the builtins scope is unchanged

#### Scenario: function body without a local shadow can still call print after a function that uses local print

- **WHEN** one function body runs `let print = "shadowed"` and returns; a separate function body then calls `print("hello")`
- **THEN** the second function calls the builtin `print` successfully (the first function's shadow did not leak)

## REMOVED Requirements

### Requirement: Bare assignment inside a function binds locally
**Reason**: Assignment now targets the nearest existing lexical binding and no longer creates implicit function-local bindings.
**Migration**: Replace first-write assignments with `let` declarations, then keep `name = expr` for reassignment.

### Requirement: `local` keyword forces binding in the current scope
**Reason**: `let` replaces `local` as the declaration syntax.
**Migration**: Replace `local name = expr` with `let name = expr`.

### Requirement: `outer` keyword writes to the nearest enclosing binding
**Reason**: Reassignment now uses nearest-binding lexical resolution directly.
**Migration**: Replace `outer name = expr` with `name = expr` after ensuring `name` is declared in an enclosing writable scope.
