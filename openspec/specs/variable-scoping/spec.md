### Requirement: Function calls are the only scope-creating construct

The interpreter SHALL create a new variable scope only when entering a function body. Control-flow constructs (`if`, `else`, `while`, `for`) SHALL execute their body in the surrounding scope. Each scope SHALL track whether it is a function boundary so that `outer` resolution and closure capture can distinguish function scopes from the chain of scopes that may exist around them.

#### Scenario: assignment inside an if block is visible after the block

- **WHEN** a top-level program runs `if true; x = 1; end` followed by `print(x)`
- **THEN** `print(x)` outputs `1` (no `NameError`)

#### Scenario: assignment inside a while loop persists after the loop

- **WHEN** a top-level program runs `n = 0; while n < 3; n = n + 1; end` followed by `print(n)`
- **THEN** `print(n)` outputs `3`

#### Scenario: function call creates a fresh scope

- **WHEN** a function declares `local x = 1` and the caller has its own `x` bound to `0`
- **THEN** the caller's `x` remains `0` after the call returns

### Requirement: Bare assignment inside a function binds locally

Inside a function body, `x = e` SHALL bind `x` in the current function scope. If `x` already has a binding in that scope, the existing local SHALL be rebound. The interpreter SHALL NOT walk past the function boundary to find an outer binding for a bare assignment. At the top level (no enclosing function), `x = e` SHALL create or reassign the binding in the top-level scope.

This behavior SHALL also apply to compound assignment operators (`+=`, `-=`, `*=`, `/=`), which desugar to simple assignment at parse time.

#### Scenario: bare assignment inside a function does not mutate an outer binding

- **WHEN** the program runs `x = 1`, then defines `fn foo(); x = 99; end`, calls `foo()`, then evaluates `x`
- **THEN** `x` is `1`

#### Scenario: bare assignment inside a function rebinds the local on subsequent writes

- **WHEN** a function body runs `x = 1` then `x = 2` then returns `x`
- **THEN** the function returns `2`

#### Scenario: bare assignment at the top level reassigns the existing top-level binding

- **WHEN** a top-level program runs `x = 1` then `x = 2` then evaluates `x`
- **THEN** `x` is `2`

#### Scenario: bare compound assignment inside a function creates local binding

- **WHEN** the program runs `x = 1`, then defines `fn foo(); x += 99; end`, calls `foo()`, then evaluates `x`
- **THEN** `x` is `1` (compound assignment desugared to bare assignment, which bound locally)

### Requirement: `local` keyword forces binding in the current scope

`local x = e` SHALL always bind `x` in the current scope. If `x` already exists in that scope it SHALL be silently rebound. If a same-named binding exists in any enclosing scope (including builtins), the new local SHALL shadow it for the remainder of the current function. `local` is permitted at the top level; there it behaves the same as bare assignment.

This behavior SHALL also apply to compound assignment operators (`+=`, `-=`, `*=`, `/=`), which desugar to simple assignment at parse time. For compound assignment, the right-hand side expression SHALL read `x` via normal lookup before writing to the local binding.

#### Scenario: local shadows an outer variable

- **WHEN** the program runs `x = 1`, defines `fn foo(); local x = 99; end`, calls `foo()`, then evaluates `x`
- **THEN** `x` is `1`

#### Scenario: local shadows a builtin inside a function

- **WHEN** a function body runs `local print = "shadowed"` and then evaluates `print`
- **THEN** the function sees the string `"shadowed"`, and after the call the global `print` builtin is still callable

#### Scenario: duplicate local in the same scope rebinds silently

- **WHEN** a function body runs `local x = 1` then `local x = 2` then returns `x`
- **THEN** the function returns `2` and no error is raised

#### Scenario: local compound assignment reads outer then writes local

- **WHEN** the program runs `x = 1`, then a function body runs `local x += 5` and returns `x`
- **THEN** the function returns `6` (outer `x` was read, local `x` was created with the result)

### Requirement: `outer` keyword writes to the nearest enclosing binding

`outer x = e` SHALL search for an existing binding of `x` in scopes strictly outside the current function boundary, walking up until either a binding is found or the chain (including builtins) is exhausted. If a binding is found, the value SHALL be written into that scope, replacing the previous value. If no binding is found in any enclosing scope, the interpreter SHALL raise a runtime error naming the variable. `outer` SHALL NOT create a new binding under any circumstances. Builtins SHALL be excluded from `outer` writes — even if a builtin name matches, the `outer` write SHALL fail with the same runtime error.

This behavior SHALL also apply to compound assignment operators (`+=`, `-=`, `*=`, `/=`), which desugar to simple assignment at parse time.

#### Scenario: outer mutates an enclosing function variable

- **WHEN** the program defines `fn make(); local n = 0; fn inc(); outer n = n + 1; end; inc(); inc(); n; end` and calls `make()`
- **THEN** the call returns `2`

#### Scenario: outer mutates a top-level variable

- **WHEN** the program runs `x = 1`, defines `fn foo(); outer x = 99; end`, calls `foo()`, then evaluates `x`
- **THEN** `x` is `99`

#### Scenario: outer with no enclosing binding raises a runtime error

- **WHEN** a function body runs `outer y = 1` and no binding for `y` exists in any enclosing scope
- **THEN** evaluating that statement raises a runtime error whose message names `y`

#### Scenario: outer cannot mutate a builtin

- **WHEN** a function body runs `outer print = "nope"`
- **THEN** evaluating that statement raises a runtime error and the `print` builtin remains callable

#### Scenario: outer compound assignment mutates enclosing variable

- **WHEN** the program runs `x = 10`, defines `fn foo(); outer x += 5; end`, calls `foo()`, then evaluates `x`
- **THEN** `x` is `15`

### Requirement: Reads walk the lexical scope chain

A variable read `x` SHALL walk from the current scope up through enclosing scopes until a binding is found, terminating at the frozen builtins scope. If no scope contains `x`, a `NameError` SHALL be raised. Reads SHALL NOT be affected by the existence of `local` or `outer` keywords elsewhere in the function (no static analysis).

#### Scenario: read finds the local binding before walking up

- **WHEN** the program runs `x = 1`, then a function body runs `local x = 2; print(x)`
- **THEN** the function prints `2`

#### Scenario: read walks past the function boundary when no local is bound

- **WHEN** the program runs `x = 1`, then a function body runs `print(x)`
- **THEN** the function prints `1`

#### Scenario: read of an undefined name raises NameError

- **WHEN** the program evaluates `print(z)` and no binding for `z` exists anywhere
- **THEN** a `NameError` is raised naming `z`

#### Scenario: read before a later local declaration sees the outer binding

- **WHEN** the program runs `x = 1`, then a function body runs `print(x); local x = 2`
- **THEN** the function prints `1` (no static resolver alters the read)

### Requirement: Loop variables are bound in the enclosing scope

When `for item in xs ... end` is executed, the interpreter SHALL bind `item` in the enclosing function or top-level scope (treating each iteration as an assignment to `item`). The binding SHALL persist after the loop completes. A function value created inside the loop body that captures `item` SHALL observe the current value of that binding at call time, not the value at the iteration in which the function was created.

#### Scenario: loop variable persists after the loop

- **WHEN** the program runs `for i in [1, 2, 3]; end` and then evaluates `i`
- **THEN** `i` is `3`

#### Scenario: closures created in a loop share the loop variable

- **WHEN** the program creates a function in each iteration of `for i in [1, 2, 3]` that returns `i`, collects those functions, runs the loop to completion, and calls each function
- **THEN** every function returns `3`

#### Scenario: loop variable does not introduce a fresh scope for other writes

- **WHEN** a `for i in [1]` body contains `x = 7`
- **THEN** after the loop `x` is `7` in the enclosing scope

### Requirement: Builtins live in a frozen root scope

Builtin bindings (e.g., `print`, `type`) SHALL live in a dedicated scope that is the parent of the top-level user scope. Writes to that scope (`local`, `outer`, or bare assignment that would target it) SHALL fail. User code SHALL be able to shadow builtins via `local` inside a function, or via top-level assignment that creates a binding in the top-level user scope (without modifying the builtins scope).

#### Scenario: top-level assignment to a builtin name creates a top-level binding, not a write to the builtins scope

- **WHEN** the program runs `print = "x"` at the top level
- **THEN** the assignment creates a binding for `print` in the top-level user scope and the builtins scope still contains the original `print` builtin (the builtins scope is not mutated)

#### Scenario: function body without a local shadow can still call print after a function that uses local print

- **WHEN** one function body runs `local print = "shadowed"` and returns; a separate function body then calls `print("hello")`
- **THEN** the second function calls the builtin `print` successfully (the first function's `local print` did not leak)

#### Scenario: outer cannot reach into the builtins scope

- **WHEN** a function body runs `outer print = "nope"` and no user-defined `print` exists in any enclosing scope
- **THEN** a runtime error is raised and the builtins scope is unchanged
