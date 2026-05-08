## ADDED Requirements

### Requirement: Compound assignment operators desugar at parse time

The parser SHALL recognize compound assignment operators (`+=`, `-=`, `*=`, `/=`) and transform them into equivalent simple assignment expressions. The desugaring SHALL produce AST identical to the explicit form: `x += e` becomes `x = x + e`.

#### Scenario: plus-equals desugars correctly

- **WHEN** the parser processes `x += 5`
- **THEN** the resulting AST is `VariableAssigment("x", BinaryOperation(VariableAccess("x"), "+", Numeral("5")))`

#### Scenario: minus-equals desugars correctly

- **WHEN** the parser processes `counter -= 1`
- **THEN** the resulting AST is `VariableAssigment("counter", BinaryOperation(VariableAccess("counter"), "-", Numeral("1")))`

#### Scenario: multiply-equals desugars correctly

- **WHEN** the parser processes `total *= 2`
- **THEN** the resulting AST is `VariableAssigment("total", BinaryOperation(VariableAccess("total"), "*", Numeral("2")))`

#### Scenario: divide-equals desugars correctly

- **WHEN** the parser processes `value /= 10`
- **THEN** the resulting AST is `VariableAssigment("value", BinaryOperation(VariableAccess("value"), "/", Numeral("10")))`

### Requirement: Compound assignment works with local keyword

`local x += e` SHALL desugar to `local x = x + e`. The read of `x` SHALL follow normal lookup rules (finding outer binding if no local exists), and the write SHALL create or rebind `x` in the current scope.

#### Scenario: local compound assignment reads from outer scope

- **WHEN** the program runs `x = 10`, then a function body runs `local x += 5` and returns `x`
- **THEN** the function returns `15` (outer `x` is read, local `x` is created with result)

#### Scenario: local compound assignment with no outer binding raises error

- **WHEN** a function body runs `local y += 5` and no binding for `y` exists anywhere
- **THEN** evaluating that statement raises a NameError on the read

### Requirement: Compound assignment works with outer keyword

`outer x += e` SHALL desugar to `outer x = x + e`. The read of `x` SHALL follow normal lookup rules, and the write SHALL target the nearest enclosing scope past the current function boundary that defines `x`.

#### Scenario: outer compound assignment mutates enclosing variable

- **WHEN** the program runs `x = 10`, then a function body runs `outer x += 5`
- **THEN** after the function call, `x` is `15` in the outer scope

#### Scenario: outer compound assignment with no enclosing binding raises error

- **WHEN** a function body runs `outer y += 5` and no binding for `y` exists in any enclosing scope
- **THEN** evaluating that statement raises a runtime error

### Requirement: Compound assignment preserves bare assignment semantics

Inside a function, `x += e` SHALL desugar to `x = x + e` with bare assignment semantics: the read finds `x` via normal lookup, and the write binds `x` in the current function scope. At top level, bare compound assignment SHALL bind in the top-level scope.

#### Scenario: bare compound assignment inside a function creates local

- **WHEN** the program runs `x = 10`, then a function body runs `x += 5` and returns `x`
- **THEN** the function returns `15` (local `x`), and the outer `x` remains `10`

#### Scenario: bare compound assignment at top level mutates top-level binding

- **WHEN** the program runs `x = 10` then `x += 5`
- **THEN** `x` is `15` at the top level

### Requirement: Compound assignment requires identifier on LHS

The parser SHALL reject compound assignment where the left-hand side is not a simple identifier. Expressions like `5 += 1` or `(a + b) += 1` SHALL raise a syntax error.

#### Scenario: non-identifier LHS raises syntax error

- **WHEN** the parser processes `5 += 1`
- **THEN** a syntax error is raised

#### Scenario: expression LHS raises syntax error

- **WHEN** the parser processes `(a + b) += 1`
- **THEN** a syntax error is raised
