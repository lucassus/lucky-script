# My Own Simple Programming Language

Lucky Script is a scripting language built from scratch in TypeScript. It has a hand-written lexer, recursive-descent parser, and tree-walking interpreter. An Ohm reference grammar in `src/grammar.ohm` documents and smoke-tests surface syntax via `src/grammar.test.ts` (no separate Python grammar toolchain required).

**Features:**

- First-class functions and closures
- Function-scoped variables with explicit `local` and `outer` binding
- `if` / `elseif` / `else` control flow
- `while` loops with `break` and `continue`
- Short-form lambda expressions: `fun(x) x * 2`
- Arithmetic, comparison, and unary operators
- Compound assignment operators: `+=`, `-=`, `*=`, `/=`
- Boolean operators: `and`, `or`, `not` (with short-circuit evaluation)
- Boolean literals: `true`, `false`
- String literals with escape sequences (`\"`, `\\`, `\n`)
- String concatenation (`+`) and equality comparison (`==`, `!=`)
- `nothing` (null) value
- Number literals: integers, floats, underscore separators (`1_000_000`)
- `print` built-in function

## Basic usage

1. `yarn install`
2. `yarn lint` and `yarn test`
3. `ts-node src/repl.ts` to start the REPL

```
➜ ts-node src/repl.ts
> 1 + 2 * 3 ** 5.2
606.4252366531416

> fun add(a, b)
  return a + b
end
nothing
> add(1, 2)
3

> fun asdf
SyntaxError: Expected '(' delimiter but got 'end' keyword.

> fun foo() asdf
SyntaxError: Expected 'end' keyword but got 'Identifier' literal.
```

## Functions

Functions use the `fun` keyword and `end` delimiter:

```
fn add(a, b)
  return a + b
end

add(1, 2) * 2 - 1  # Evaluates to 5
```

### Short-form lambda

Anonymous functions with a single expression can be written inline without `end`. The expression is implicitly returned:

```
double = fun(x) x * 2
double(3)  # => 6

fun(a, b) a + b
```

For anything more complex, use the full form:

```
fun(x)
  local y = x * 2
  return y + 1
end
```

## If / elseif / else

Conditions are not wrapped in parentheses. The condition is terminated by a newline or the `then` keyword:

```
fn classify(n)
  if n < 0
    return -1
  elseif n == 0
    return 0
  else
    return 1
  end
end
```

Single-line with `then`:

```
if x > 0 then print(x) end
```

## While loops

```
i = 0
while i < 5
  print(i)
  i = i + 1
end
```

Single-line with `then`:

```
while true then break end
```

## break and continue

`break` exits the loop immediately; `continue` skips the rest of the current iteration and re-evaluates the condition.

```
i = 0
while true
  if i == 5 then break end
  i = i + 1
end
# i == 5 after the loop

i = 0
while i < 10
  i = i + 1
  if i == 3
    continue
  end
  print(i)
end
# prints 1 2 4 5 6 7 8 9 10 (3 is skipped)
```

Both keywords are parse-time checked: using `break` or `continue` outside a loop (including inside a function literal nested in a loop) is a `SyntaxError`.

## It supports basic if statements and the recursion:

```
fn fib(n)
  if n < 2
    return n
  end

  return fib(n - 2) + fib(n - 1)
end
```

## Higher order functions are also supported:

```
foo = fun()
  x = 1

  # Yes! It's a function that returns another function ;)
  return fun()
    return x + 2
  end
end

bar = foo()
bar()
```

With short-form lambdas:

```
nums.map(fun(x) x * 2)
nums.filter(fun(x) x > 1)
```

## Variable scoping

Only function calls create a new scope. `if`, `elseif`, `else`, and `while` execute in the enclosing scope.

```
a = 1

fn foo()
  a = 2       # local to foo — does NOT mutate outer a
  outer a = 2 # explicitly mutates the outer a
  local b = 3 # explicitly local, shadows any outer binding named b
end
```

Reads always walk the full scope chain:

```
x = 10

fn double()
  return x * 2  # reads x from the enclosing scope
end

double()  # => 20
x = 5
double()  # => 10
```

Closures with `outer`:

```
fn makeCounter()
  local n = 0

  fun inc()
    outer n = n + 1
  end

  fun get()
    return n
  end

  inc()
  inc()
  return get()
end

makeCounter()  # => 2
```

## Built-ins

```
print(42)       # => prints "42"
print("hello")  # => prints "hello"
print(true)     # => prints "true"
```

## Operators

Arithmetic: `+`, `-`, `*`, `/`, `**` (exponentiation)

Comparison: `<`, `<=`, `==`, `!=`, `>=`, `>`

Unary: `-x`, `+x`

Boolean: `and`, `or`, `not`

Compound assignment: `+=`, `-=`, `*=`, `/=`

```
1 + 2 * 3 ** 2   # => 19
-5 + 3           # => -2
1 < 2            # => truthy
1 == 1           # => truthy
1 != 2           # => truthy

x = 10
x += 5           # x is now 15
x *= 2           # x is now 30
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
if "" then ... end      # skipped
if "hello" then ... end # runs
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

See [roadmap.md](roadmap.md) for the full roadmap with descriptions and examples.
