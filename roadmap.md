# Lucky Script — Roadmap

## Next

### Lists

Ordered, indexable collections. List literals use `[...]` syntax; elements are accessed by zero-based integer index with `lst[i]`. Out-of-bounds access raises a runtime error.

Lists are the foundation for `for-each` and higher-order methods like `map` and `filter`.

```
nums = [1, 2, 3]
nums[0]         # => 1
nums[2]         # => 3
```

### for-each loop

Iterates over every element in a list. The loop variable is bound in the enclosing function/top-level scope (Python-style: it persists and is accessible after the loop ends). Closures capture the variable, not the value at each iteration.

```
total = 0
for item in [10, 20, 30] {
  total = total + item
}
total   # => 60
```

---

## Later

### Syntax overhaul — `fn` / `end` blocks

Replace `function` / `{}` braces with `fn` / `end` to give the language a Python/Ruby feel. All blocks (`if`, `while`, `for`) use `end` as the closing delimiter. The `do` prefix is not required.

This is a breaking change to the surface syntax, but the interpreter internals stay the same.

```
fn add(a, b)
  a + b
end

if x > 0
  print(x)
end

while x > 0
  x = x - 1
end
```

### Implicit return

The last expression evaluated in a function body is returned automatically. Explicit `return` remains valid for early exit.

```
fn square(x)
  x * x
end

fn classify(n)
  if n < 0
    return -1
  end
  n * 2
end
```

### Strict boolean conditions

`if` and `while` conditions must evaluate to `true` or `false`. Passing any other type (number, string, list) is a type error. This removes truthiness/falsiness and makes type errors visible early.

```
if x > 0        # ok — comparison yields boolean
  ...
end

if x            # TypeError: condition must be boolean, got Number
  ...
end
```

### f-string interpolation

String interpolation with `f"..."` syntax. Any expression can appear inside `{}`. Single-quoted strings are also supported.

```
name = "world"
print(f"hello {name}")       # => hello world
print(f"result: {x + y}")    # => result: 42
print(f'also works: {name}') # => also works: world
```

### `%` modulo operator

Adds `%` as an arithmetic operator with the same precedence as `*` and `/`.

```
10 % 3   # => 1
7 % 2    # => 1
```

### Dot-notation method calls

Built-in methods on lists and strings via dot syntax. No user-defined classes — methods are intrinsic to each type.

```
nums = [1, 2, 3]
nums.length                      # => 3
nums.map(fn(x) x * 2 end)        # => [2, 4, 6]
nums.filter(fn(x) x > 1 end)     # => [2, 3]

"hello".upcase                   # => "HELLO"
"hello".length                   # => 5
```

### try / catch

Structured error handling. The `catch` clause binds the error to a variable in a new scope. Runtime errors (index out of bounds, type errors, scope errors) are catchable.

Deferred until lists and for-each are stable, because those features introduce the most common runtime errors worth catching.

```
try
  result = nums[99]
catch e
  print(f"Error: {e}")
end
```

---

## Future

### User-defined classes / objects

Struct-like objects with named fields and methods. Syntax and semantics TBD.

### `p(x)` debug inspect

A debug-inspect built-in that prints the type and representation of any value, distinct from `print` which formats for human output.

### Multiline strings
