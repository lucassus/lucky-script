## MODIFIED Requirements

### Requirement: Function calls are the only scope-creating construct

The interpreter SHALL create a new variable scope only when entering a function body. Control-flow constructs (`if`, `elseif`, `else`, `while`, `for`) SHALL execute their body in the surrounding scope. Each scope SHALL track whether it is a function boundary so that `outer` resolution and closure capture can distinguish function scopes from the chain of scopes that may exist around them.

#### Scenario: assignment inside an if block is visible after the block

- **WHEN** a top-level program runs `if true\n  x = 1\nend` followed by `print(x)`
- **THEN** `print(x)` outputs `1` (no `NameError`)

#### Scenario: assignment inside a while loop persists after the loop

- **WHEN** a top-level program runs `n = 0\nwhile n < 3\n  n = n + 1\nend` followed by `print(n)`
- **THEN** `print(n)` outputs `3`

#### Scenario: function call creates a fresh scope

- **WHEN** a function declares `local x = 1` and the caller has its own `x` bound to `0`
- **THEN** the caller's `x` remains `0` after the call returns

### Requirement: Bare assignment inside a function binds locally

Inside a function body, `x = e` SHALL bind `x` in the current function scope. If `x` already has a binding in that scope, the existing local SHALL be rebound. The interpreter SHALL NOT walk past the function boundary to find an outer binding for a bare assignment. At the top level (no enclosing function), `x = e` SHALL create or reassign the binding in the top-level scope.

This behavior SHALL also apply to compound assignment operators (`+=`, `-=`, `*=`, `/=`), which desugar to simple assignment at parse time.

#### Scenario: bare assignment inside a function does not mutate an outer binding

- **WHEN** the program runs `x = 1`, then defines `fn foo()\n  x = 99\nend`, calls `foo()`, then evaluates `x`
- **THEN** `x` is `1`

#### Scenario: bare assignment inside a function rebinds the local on subsequent writes

- **WHEN** a function body runs `x = 1` then `x = 2` then returns `x`
- **THEN** the function returns `2`

#### Scenario: bare assignment at the top level reassigns the existing top-level binding

- **WHEN** a top-level program runs `x = 1` then `x = 2` then evaluates `x`
- **THEN** `x` is `2`

#### Scenario: bare compound assignment inside a function creates local binding

- **WHEN** the program runs `x = 1`, then defines `fn foo()\n  x += 99\nend`, calls `foo()`, then evaluates `x`
- **THEN** `x` is `1` (compound assignment desugared to bare assignment, which bound locally)
