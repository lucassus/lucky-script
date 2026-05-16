- [x] Variable re-assigment
- [x] Logic and branching
  - [x] Operators
  - [x] Logical operators (and, or)
  - [x] Basic if statements; Control flow jumps
  - [x] else elseif statements (optionally)
  - [x] Short-circuit evaluation
- [x] While loops
- [x] Functions
  - [x] CallFrame architecture
  - [x] Function invocation and returns 
- [x] First-class functions
  - [ ] Make Call Expressions Dynamic: Immediately invoke a returned function like getAdder(5)(10)
- [x] Closures
- [ ] Better tests organization
- [ ] None type
- [ ] Anonymous functions aka lambdas
- [ ] Move to v2 folder
- [ ] Arrays
- [ ] Repl
- [ ] Std library functions, like print, assert


```
let add = (a, b) -> a + b
map(list, add)

let add = def (a,b)
  return a + b
end

map(list, (x) -> x * 2)
map(list, def(x)
  return x * 2
end)
```
