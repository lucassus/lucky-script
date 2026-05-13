// ============================================================
// Lucky Script Inspirations — Gleam
// ============================================================
// Assumed: Gleam 1.5+.
// See ../roadmap.md for Lucky Script's feature roadmap.
//
// Gleam is the spiritual cousin of LS in this set: small, opinionated,
// FP-first, deliberately minimal. The interesting design lessons:
//
//   1. NO null — Option(a) is the only "missing".
//   2. NO exceptions — Result(value, error) is the only "failure".
//   3. NO statements that aren't expressions — everything returns a value.
//   4. NO method-chaining syntax — `|>` is the only pipeline.
//   5. NO operator overloading.
//   6. NO macros, NO reflection, NO metaprogramming.
//   7. Pattern matching is the primary control flow.
//   8. The compiler is opinionated about style ("friendly compiler" goal).
//   9. Compiles to both Erlang (BEAM) and JavaScript.
//
// Several of these are explicit non-features. Read the §19 tail as the
// "design philosophy LS could borrow" notes.
//
// Sections:
//   01. Comments & program structure
//   02. Variables & assignment (immutable; rebinding via shadowing)
//   03. Numbers, booleans, Option (no null)
//   04. Strings (no interpolation — only concatenation)
//   05. Operators
//   06. case (Gleam has NO if/else — `case` is everything)
//   07. while-style: there isn't one (use recursion + list.fold)
//   08. for-each (list.each, list.map)
//   09. Functions, no defaults, no kwargs
//   10. Anonymous functions & function capture
//   11. Pipelines — `|>` is the only flow operator
//   12. Lists (linked, immutable)
//   13. Dicts (via gleam/dict)
//   14. Sets (via gleam/set)
//   15. Pattern matching (exhaustive `case`)
//   16. Error handling (Result + `use` for short-circuit)
//   17. "Methods on types" — module functions only, no dot-call
//   18. Inspect / debug (io.debug)
//   19. Beyond LS: type system, `use` sugar, opinionated minimalism, dual targets

import gleam/dict
import gleam/int
import gleam/io
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/result
import gleam/set
import gleam/string


// ============================================================
// 01. Comments & program structure
//   LS: shipped (# comments). Gleam: //. Doc comments are /// and ////.
// ============================================================

// Line comments use //.
/// Doc comment for the item below — feeds the generated docs.
//// Module-level doc comment.


// ============================================================
// 02. Variables & assignment (immutable; rebinding via shadowing)
//   LS: shipped (with rebinding). Gleam: `let` binds; ALL bindings are
//   immutable. To "update", you shadow with a new `let`.
// ============================================================

pub fn section02() -> Int {
  let x = 10
  let x = 20
  // x = 30                 // syntax error: no reassignment
  let x = x + 5
  let x = x * 2
  x
}


// ============================================================
// 03. Numbers, booleans, Option (no null)
//   LS: shipped (has `nothing`). Gleam: NO null, NO nil, NO undefined.
//   "Maybe a name" is `Option(String)` — Some(value) or None.
//   This is the most LS-relevant single design decision in the file.
// ============================================================

pub fn section03() {
  let n: Int = 1_000_000
  let pi: Float = 3.14159
  let t: Bool = True
  let f: Bool = False

  // Numbers: Int and Float are separate types — no implicit conversion.
  // 1 + 1.5  is a TYPE ERROR. Use int.to_float / float.truncate.

  let maybe_name: Option(String) = Some("Alice")
  let _ = case maybe_name {
    Some(name) -> "hello, " <> name
    None -> "hello, stranger"
  }

  #(n, pi, t, f, maybe_name)
}


// ============================================================
// 04. Strings (no interpolation — only concatenation)
//   LS: shipped (escapes, concat). f-strings planned (Later); multiline
//   planned (Future). Gleam has NEITHER — explicit `<>` concatenation is
//   the only string-building operator. A deliberate minimalism choice.
// ============================================================

pub fn section04() {
  let greeting = "hello"
  let name = "world"
  io.println(greeting <> " " <> name)
  io.println("say \"hi\"")
  io.println("line1\nline2")

  // No interpolation; use string.concat or string_builder for many parts.
  let msg = string.concat([greeting, " ", name])
  io.println(msg)

  // Multi-line is just a regular string with newlines inside the literal.
  let multi = "line 1
line 2"
  io.println(multi)
}


// ============================================================
// 05. Operators
//   LS: shipped (+/-*//**, comparison, boolean). Modulo `%` planned (Later).
//   Gleam SEPARATES int and float operators:
//     Int:   + - * / %       (no `**` — use int.power)
//     Float: +. -. *. /.     (note the trailing dot)
//   Strings use <> (no `+`).
// ============================================================

pub fn section05() {
  let _ = 1 + 2 * 3
  let _ = 10 % 3
  let _ = 10 / 3
  let _ = 1.5 +. 2.5            // float addition uses +.
  let _ = 1.5 /. 2.0
  let _ = "a" <> "b"            // string concat
  let _ = True && False
  let _ = True || False
  let _ = !True
}


// ============================================================
// 06. case (Gleam has NO if/else — `case` is everything)
//   LS: shipped (if/elseif/else, statement). if-expression planned (Next).
//   Gleam has NO `if` keyword. `case` on a boolean replaces it. Every
//   `case` is an expression; all arms must produce the same type.
// ============================================================

pub fn classify(value: Int) -> Int {
  case value {
    n if n < 0 -> -1
    0 -> 0
    _ -> 1
  }
}

// "if" on a boolean — using `case`:
pub fn abs_value(x: Int) -> Int {
  case x < 0 {
    True -> -x
    False -> x
  }
}


// ============================================================
// 07. while-style: there isn't one (use recursion + list.fold)
//   LS: shipped (while/break/continue). Gleam has NO loop keywords at
//   all. Use recursion for control, list/iterator functions for
//   transformations. The BEAM optimizes tail-recursive functions.
// ============================================================

pub fn count_to(n: Int) -> Nil {
  count_to_helper(0, n)
}

fn count_to_helper(i: Int, n: Int) -> Nil {
  case i >= n {
    True -> Nil
    False -> {
      io.debug(i)
      count_to_helper(i + 1, n)
    }
  }
}

// list.fold gives accumulator-style iteration without explicit recursion.
pub fn sum_list(xs: List(Int)) -> Int {
  list.fold(xs, 0, fn(acc, x) { acc + x })
}


// ============================================================
// 08. for-each (list.each, list.map)
//   LS: planned (Next). Gleam: list.each runs a side-effect over each
//   element; list.map transforms; both are just function calls.
// ============================================================

pub fn section08() {
  list.each([10, 20, 30], fn(item) { io.debug(item) })

  // index_map gives (index, value) pairs.
  list.index_map(["a", "b", "c"], fn(item, i) { #(i, item) })
  |> list.each(fn(pair) { io.debug(pair) })
}


// ============================================================
// 09. Functions, no defaults, no kwargs
//   LS: shipped (functions, closures). Defaults & kwargs planned (Later) —
//   Gleam has NEITHER. Idiomatic substitute: a config record with
//   optional fields, or labeled arguments at call sites (see below).
// ============================================================

pub fn add(a: Int, b: Int) -> Int {
  a + b
}

// LABELED arguments — Gleam's answer to keyword args (call site only).
// You name the parameter after the type to allow `divide(numerator: 10, denominator: 2)`.
pub fn divide(numerator num: Int, denominator den: Int) -> Int {
  num / den
}

pub fn section09() {
  let _ = divide(10, 2)                              // positional
  let _ = divide(numerator: 10, denominator: 2)      // labeled
  let _ = divide(denominator: 2, numerator: 10)      // any order
}


// ============================================================
// 10. Anonymous functions & function capture
//   LS: shipped (full-form). Arrow shorthand `x -> x*2` planned (Next) —
//   Gleam's `fn(x) { x * 2 }` is the anonymous form. There's no `->`
//   shorthand. There IS function CAPTURE: `add(_, 1)` is a 1-arg fn.
// ============================================================

pub fn section10() {
  let double = fn(x) { x * 2 }
  let add_xy = fn(x, y) { x + y }
  let const_fn = fn() { 42 }

  // Function capture — `_` is the hole.
  let inc = add(_, 1)
  let times_two = int.multiply(_, 2)

  #(double(3), add_xy(1, 2), const_fn(), inc(10), times_two(5))
}


// ============================================================
// 11. Pipelines — `|>` is the only flow operator
//   LS: planned (Next). Gleam follows Elixir/F#: `x |> f(a)` becomes
//   `f(x, a)`. This is THE control-flow pattern in idiomatic Gleam.
// ============================================================

pub fn section11() -> Int {
  [1, 2, 3, 4, 5]
  |> list.filter(fn(v) { v > 0 })
  |> list.map(fn(v) { v * 2 })
  |> list.fold(0, fn(acc, v) { acc + v })
}


// ============================================================
// 12. Lists (linked, immutable)
//   LS: planned (Next). Gleam lists are linked lists like Elixir/Haskell.
//   `[a, b, c]` literal, `[head, ..tail]` pattern. No index access by
//   default — use list.first / list.at / pattern match.
// ============================================================

pub fn section12() {
  let nums = [1, 2, 3, 4, 5]
  let head = list.first(nums)            // Result(Int, Nil)
  let _ = list.length(nums)
  let prepended = [0, ..nums]            // O(1) prepend
  let _ = list.append(nums, [6, 7])      // O(n) append
  #(head, prepended)
}


// ============================================================
// 13. Dicts (via gleam/dict)
//   LS: planned (Next). Gleam: dict.Dict(k, v) — no literal syntax,
//   only the dict.from_list / dict.new + dict.insert API.
// ============================================================

pub fn section13() {
  let person =
    dict.new()
    |> dict.insert("name", "Alice")
    |> dict.insert("age", "30")

  let name = dict.get(person, "name")       // Result(String, Nil)
  let updated = dict.insert(person, "role", "admin")
  let _ = dict.delete(updated, "name")
  #(name, dict.size(person))
}


// ============================================================
// 14. Sets (via gleam/set)
//   LS: planned (Later). Gleam: set.Set(a). No literal — set.new()
//   + set.insert chain. Same lesson as the rest: no literal syntax for
//   non-core types; small surface area is a virtue.
// ============================================================

pub fn section14() {
  let primes =
    set.new()
    |> set.insert(2)
    |> set.insert(3)
    |> set.insert(5)
    |> set.insert(7)

  let _ = set.contains(primes, 2)
  let _ = set.size(primes)
  primes
}


// ============================================================
// 15. Pattern matching (exhaustive `case`)
//   LS: planned (Next). Gleam: `case` is THE primary control flow.
//   The compiler enforces exhaustiveness — missing variants are errors.
// ============================================================

pub type Shape {
  Circle(radius: Float)
  Square(side: Float)
  Rect(width: Float, height: Float)
}

pub fn area(s: Shape) -> Float {
  case s {
    Circle(r) -> 3.14159 *. r *. r
    Square(side) -> side *. side
    Rect(w, h) -> w *. h
  }
}

pub fn describe(value: Int, list_value: List(Int)) -> String {
  case #(value, list_value) {
    #(0, _) -> "zero"
    #(n, _) if n < 0 -> "negative"
    #(_, []) -> "empty"
    #(_, [x]) -> "one"
    #(_, [_, ..rest]) -> "first plus " <> int.to_string(list.length(rest))
  }
}

// Destructuring in `let`.
pub fn section15() {
  let #(a, b, c) = #(1, 2, 3)
  let [head, ..tail] = [1, 2, 3, 4]            // Gleam warns: list might be empty
  #(a, b, c, head, tail)
}

// `let assert` — pattern-match that REQUIRES success (panics if it fails).
// Like Elixir's match-or-die. Avoid for user input; OK for tests / known invariants.
pub fn section15_assert() {
  let assert Ok(name) = dict.get(dict.from_list([#("k", "v")]), "k")
  name
}


// ============================================================
// 16. Error handling (Result + `use` for short-circuit)
//   LS: planned (Later) — try/catch. Gleam: there is NO try/catch.
//   `Result(value, error)` is the only failure encoding. The `use`
//   keyword (see §19) sugarises chained Result operations.
// ============================================================

pub type AppError {
  NotFound(String)
  BadInput(String)
}

pub fn parse_id(s: String) -> Result(Int, AppError) {
  case int.parse(s) {
    Ok(n) if n > 0 -> Ok(n)
    Ok(_) -> Error(BadInput("must be positive"))
    Error(_) -> Error(BadInput("not a number: " <> s))
  }
}

pub fn find_user(id_str: String) -> Result(String, AppError) {
  // Manual chain with case:
  case parse_id(id_str) {
    Error(e) -> Error(e)
    Ok(id) -> {
      case id {
        0 -> Error(NotFound("no user 0"))
        _ -> Ok("user_" <> int.to_string(id))
      }
    }
  }
}

// Same logic with the `use` keyword (see §19 for what `use` desugars to):
pub fn find_user_v2(id_str: String) -> Result(String, AppError) {
  use id <- result.try(parse_id(id_str))
  case id {
    0 -> Error(NotFound("no user 0"))
    _ -> Ok("user_" <> int.to_string(id))
  }
}


// ============================================================
// 17. "Methods on types" — module functions only, no dot-call
//   LS: planned (Later) — dot-method calls. Gleam has NO methods.
//   `string.uppercase(s)` is the form, not `s.uppercase()`. Pipelines
//   make this read fluently: `s |> string.uppercase`.
// ============================================================

pub fn section17() {
  let _ =
    "hello"
    |> string.uppercase
    |> io.debug

  let _ =
    "a,b,c"
    |> string.split(",")
    |> io.debug

  let _ =
    [1, 2, 3]
    |> list.map(fn(v) { v * 2 })
    |> io.debug

  let _ = list.length([1, 2, 3])
  Nil
}


// ============================================================
// 18. Inspect / debug (io.debug)
//   LS: planned (Future). Gleam: `io.debug` prints AND returns its
//   argument — perfect for mid-pipeline tracing. Same pattern as
//   Elixir's IO.inspect and Rust's dbg!.
// ============================================================

pub fn section18() {
  [1, 2, 3]
  |> io.debug
  |> list.map(fn(v) { v * 2 })
  |> io.debug
  |> list.fold(0, fn(acc, v) { acc + v })
  |> io.debug
}


// ============================================================
// 19. Beyond Lucky Script — Gleam gems
//   LS: not planned (Gleam's design philosophy is the inspiration here,
//   more than any individual feature).
// ============================================================

// --- The type system: sound, inferred, polymorphic ---
// Gleam's type system is Hindley-Milner-style: types are inferred from
// usage; you rarely write them, but they're always checked. Generic
// functions use lowercase type variables — `a`, `b`.

pub fn identity(x: a) -> a {
  x
}

pub fn first(pair: #(a, b)) -> a {
  let #(x, _) = pair
  x
}

// Result(a, b) and Option(a) are themselves generic types. The compiler
// tracks types through pipelines and pattern matches — type errors are
// caught at compile time, not runtime.


// --- The `use` keyword: callback flattening ---
// `use x <- f(...)` desugars to `f(..., fn(x) { rest_of_body })`.
// It turns deeply-nested callbacks into linear-looking code.

pub fn use_demo() -> Result(Int, AppError) {
  use a <- result.try(parse_id("10"))
  use b <- result.try(parse_id("32"))
  Ok(a + b)
}

// Without `use`, the same code is:
pub fn use_demo_desugared() -> Result(Int, AppError) {
  result.try(parse_id("10"), fn(a) {
    result.try(parse_id("32"), fn(b) {
      Ok(a + b)
    })
  })
}

// `use` works with ANY function whose last argument is a callback —
// not built into Result alone. It generalizes `do`-notation without
// monad infrastructure.


// --- Opinionated minimalism: a list of what Gleam refuses to ship ---
// (LS could draw a similar list as part of its identity.)
//
//   No null / undefined  → Option(a)
//   No exceptions        → Result(value, error)
//   No statements        → everything is an expression
//   No method-chain `.`  → module functions + `|>`
//   No operator overload → operators have fixed types
//   No macros            → no metaprogramming
//   No reflection        → no runtime type introspection
//   No inheritance       → no classes; records + functions only
//   No implicit conv     → Int + Float is a type error
//   No early `return`    → expressions only; `case`/`use` for branching
//   No mutable state     → all bindings immutable; recursion for change
//
// The cost: more verbose at times (no `if`, no method chains, no `**`).
// The benefit: fewer "wait, which way does this work?" moments.


// --- Dual targets: BEAM and JavaScript ---
// Gleam compiles to both Erlang (for the BEAM) and JavaScript. The same
// Gleam code can run server-side on BEAM or in a browser. The standard
// library has target-specific implementations of low-level primitives.
// `@target(erlang)` / `@target(javascript)` on a function selects builds.
// (Not demoed inline — would require multi-file project setup.)


// ============================================================
// main — entry point. `gleam run` calls this.
// ============================================================

pub fn main() {
  io.println("Lucky Script Inspirations — Gleam")
  let _ = section02()
  let _ = section03()
  section04()
  section05()
  section08()
  let _ = section09()
  let _ = section10()
  let _ = section11()
  let _ = section12()
  let _ = section13()
  let _ = section14()
  let _ = section15()
  let _ = section15_assert()
  let _ = find_user("42")
  let _ = find_user_v2("0")
  section17()
  section18()
  let _ = use_demo()
  let _ = classify(5)
  let _ = abs_value(-7)
  let _ = area(Circle(2.0))
  let _ = describe(3, [1, 2, 3])
  let _ = sum_list([1, 2, 3])
  let _ = identity(42)
  let _ = first(#(1, "x"))
}
