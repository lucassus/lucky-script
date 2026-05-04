# My Own Simple Programming Language

Lucky Script is a dynamically-scoped scripting language built from scratch in TypeScript. It has a hand-written lexer, recursive-descent parser, and tree-walking interpreter. Built as a learning project to understand how programming languages work from the ground up.

**Features:**
- First-class functions and closures
- Dynamic scoping
- `if` / `else` / `else if` control flow
- Arithmetic, comparison, and unary operators
- Boolean operators: `and`, `or`, `not` (with short-circuit evaluation)
- Boolean literals: `true`, `false`
- String literals with escape sequences (`\"`, `\\`, `\n`)
- String concatenation (`+`) and equality comparison (`==`, `!=`)
- `nothing` (null) value
- Number literals: integers, floats, underscore separators (`1_000_000`)

## Basic usage

1. `yarn install`
2. `yarn lint` and `yarn test`
3. `ts-node src/repl.ts` to start the REPL

```
➜ ts-node src/repl.ts
> 1 + 2 * 3 ** 5.2
606.4252366531416

> function add(a, b) { return a + b }
undefined
> add(1, 2)
3

> function asdf
SyntaxError: Expected '(' delimiter but got 'End' delimiter.

> function foo() asdf
SyntaxError: Expected '{' delimiter but got 'Identifier' literal.
```

## Functions

```
function add(a, b) {
  return a + b
}

add(1, 2) * 2 - 1  # Evaluates to 5
```

## If / else

```
function classify(n) {
  if (n < 0) {
    return -1
  } else if (n == 0) {
    return 0
  } else {
    return 1
  }
}
```

## It supports basic if statements and the recursion:

```
function fib(n) {
  if (n < 2) {
    return n
  }
  
  return fib(n - 2) + fib(n - 1)
}
```

## Higher order functions are also supported:

```
foo = function() { 
  x = 1
  
  # Yes! It's a function that returns another function ;)
  return function() {
    return x + 2
  }
}

bar = foo()
bar()
```

## Variables scopes and closures

```
a = 1

function foo() {
  a = 2 # Should replace value in the parent scope
  b = 1 # Should be accessible only in the current scope
  
  function bar() {
    c = 3 # Should be accessible only in the current scope
    return a + b + c
  }
  
  return bar()
}

d = foo()
```

## Dynamic scopes

```
a = 1

function add() {
  # Currently a is 1, but later its value will be changed
  
  return a + 1
}

firstResult = add() 
# => 2

a = 2
secondResult = add() 
# => 3
```

## Operators

Arithmetic: `+`, `-`, `*`, `/`, `**` (exponentiation)

Comparison: `<`, `<=`, `==`, `!=`, `>=`, `>`

Unary: `-x`, `+x`

Boolean: `and`, `or`, `not`

```
1 + 2 * 3 ** 2   # => 19
-5 + 3           # => -2
1 < 2            # => truthy
1 == 1           # => truthy
1 != 2           # => truthy
```

## Booleans

```
true and false   # => false
true or false    # => true
not true         # => false
not 0            # => true (0 is falsy, any other number is truthy)

# Short-circuit evaluation
false and expensiveFn()  # expensiveFn() is never called
true or expensiveFn()    # expensiveFn() is never called

# and binds tighter than or
true or false and false  # => true  (parsed as: true or (false and false))
```

## Strings

```
greeting = "hello"
name = "world"
greeting + " " + name   # => "hello world"

"" == ""                # => true
"foo" != "bar"          # => true

# Escape sequences
"say \"hi\""            # => say "hi"
"line1\nline2"          # => line1
                        #    line2
"back\\slash"           # => back\slash

# Truthiness: empty string is falsy, non-empty is truthy
if ("") { ... }         # skipped
if ("hello") { ... }    # runs
```

## Nothing

`nothing` is the null value:

```
x = nothing
```

## Number literals

```
1_000_000   # underscores for readability
0.5         # floats
```

## Assignment chaining

```
x = y = 1
```

## Planned features

- `print` built-in function
- `while` loop
- Lists (`[1, 2, 3]`)
- `for-each` loop
