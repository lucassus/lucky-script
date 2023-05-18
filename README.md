# My Own Simple Programming Language

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

## It supports basic if statements and the recursion:

```
function fib(n) {
  if (n < 2) {
    return n
  }
  
  return fib(n - 2) + fib(n - 1)
}
```

## Height order functions are also supported:

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
