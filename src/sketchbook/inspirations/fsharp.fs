// ============================================================
// Lucky Script Inspirations — F#
// ============================================================
// Assumed: F# 8 (.NET 8).
// See ../roadmap.md for Lucky Script's feature roadmap.
//
// F# is where `|>` was invented (Elixir borrowed it). It's a pragmatic
// ML-family language: type inference, pattern matching, immutable by
// default, but with comfortable interop and a less-academic feel than
// Haskell. The standout features for LS-inspiration are:
//
//   - active patterns: pattern matching extensible with named patterns
//   - computation expressions: customizable `do`-notation (generalized
//     monad sugar for async, sequences, queries, results)
//
// These two are NOT covered by any other file in this set.
//
// Sections:
//   01. Comments & program structure
//   02. Variables & assignment (let / let mutable)
//   03. Numbers, booleans, Option
//   04. Strings
//   05. Operators
//   06. if / elif / else (expression form)
//   07. while, for, break-via-exception
//   08. for-each (Seq.iter)
//   09. Functions (curried by default, no defaults/kwargs)
//   10. Lambdas (fun x -> x * 2 — direct ancestor of LS shorthand)
//   11. Pipelines — F# is the design source for `|>`
//   12. Lists & arrays
//   13. Maps
//   14. Sets
//   15. Pattern matching + discriminated unions
//   16. Error handling: Result, Option, try-with
//   17. Methods on types (dot-call inherited from .NET)
//   18. Inspect / debug (printfn / sprintf)
//   19. Beyond LS: active patterns, computation expressions, units of measure, sequence expressions

module Inspirations.FSharp

open System
open System.Collections.Generic


// ============================================================
// 01. Comments & program structure
//   LS: shipped (# comments). F#: //, (* *), /// (XML doc).
// ============================================================

// Line comment.
(* Block comment.
   Can span lines. *)
/// XML doc comment for the next declaration.
let documented () = ()


// ============================================================
// 02. Variables & assignment (let / let mutable)
//   LS: shipped (mutable). F#: `let x = 10` is IMMUTABLE by default;
//   `let mutable x = 10` opts in to mutation, and assignment uses `<-`,
//   not `=` (which is equality / pattern-match).
// ============================================================

let section02 () =
    let x = 10
    // x = 20                        // this is a BOOLEAN comparison, not assignment
    let mutable y = 10
    y <- 20                          // mutation via `<-`
    y <- y + 5

    // Tuple destructure for parallel binding.
    let (a, b) = (1, 2)
    let mutable p = 1
    let mutable q = 2
    let tmp = p in (p <- q; q <- tmp)   // swap

    (a + b, y, p, q)


// ============================================================
// 03. Numbers, booleans, Option (no null in idiomatic F#)
//   LS: shipped (has `nothing`). F# inherits .NET so `null` exists for
//   reference types, but idiomatic F# uses `Option<'T>` everywhere
//   for missing-ness.
// ============================================================

let section03 () =
    let n : int = 1_000_000          // F# allows _ digit separators
    let pi : float = 3.14159
    let big : int64 = 1L <<< 62
    let t : bool = true

    // option<'T> = Some 'T | None.
    let maybeName : string option = Some "Alice"
    let greeted =
        match maybeName with
        | Some name -> "hello, " + name
        | None -> "hello, stranger"
    (n, pi, big, t, greeted)


// ============================================================
// 04. Strings
//   LS: shipped (escapes, concat). f-strings planned (Later). F#:
//   `sprintf`/`printfn` for formatted strings; `$` strings (F# 5+) for
//   interpolation: `$"hello {name}"`. Triple-quote for multi-line.
// ============================================================

let section04 () =
    let greeting = "hello"
    let name = "world"
    printfn "%s %s" greeting name        // C-printf style
    printfn $"hello {name}"               // interpolated string (F# 5+)
    printfn $"sum is {1 + 2}"

    printfn "say \"hi\""
    printfn "line1\nline2"

    // Triple-quoted strings — no escape interpretation, multi-line.
    let multi = """
  line 1
  line 2
"""
    printfn "%s" multi


// ============================================================
// 05. Operators
//   LS: shipped. F#: `%` for modulo; `**` for float power (`pown` for int);
//   `=` is equality (NOT assignment), `<>` is "not equal".
// ============================================================

let section05 () =
    let a = 1 + 2 * pown 3 2          // 1 + 2 * 9 = 19
    let b = 10 % 3
    let c = 10 / 3                     // integer division between ints
    let d = 10.0 ** 3.0                // float power
    let eq = 1 = 1                     // true
    let ne = 1 <> 2                    // true
    (a, b, c, d, eq, ne)


// ============================================================
// 06. if / elif / else (expression form)
//   LS: shipped (statement). if-expression planned (Next) — F#'s `if`
//   IS an expression already; both branches must have the same type.
// ============================================================

let classify (value : int) =
    if value < 0 then -1
    elif value = 0 then 0
    else 1

// Inline conditional.
let absValue x = if x < 0 then -x else x


// ============================================================
// 07. while, for, break-via-exception
//   LS: shipped (while/break/continue). F# has `while ... do ... done`
//   and `for ... do ... done`, BUT NO `break` or `continue`. Use
//   recursion, mutable flags, or throw an exception. The clean idiom is
//   to refactor to `Seq.takeWhile` / `Seq.tryFind` instead.
// ============================================================

let section07 () =
    let mutable i = 0
    while i < 10 do
        i <- i + 1
        if i = 3 then ()
        elif i = 7 then i <- 11           // sentinel: bumps i past loop cond
        else printfn "%d" i

    // for ... to / for ... downto.
    for k in 0 .. 4 do printfn "%d" k
    for k in 10 .. -2 .. 0 do printfn "%d" k

    // The functional way to "break": find/takeWhile.
    let firstOver5 = [ 1; 3; 7; 4; 9 ] |> List.tryFind (fun v -> v > 5)
    firstOver5


// ============================================================
// 08. for-each (Seq.iter)
//   LS: planned (Next). F#: `for x in seq do ...` is the for-each;
//   `Seq.iter`/`List.iter` is the functional equivalent.
// ============================================================

let section08 () =
    let mutable total = 0
    for item in [ 10; 20; 30 ] do
        total <- total + item

    [ "a"; "b"; "c" ] |> List.iteri (fun i s -> printfn "%d: %s" i s)
    total


// ============================================================
// 09. Functions (curried by default, no defaults/kwargs)
//   LS: shipped. Defaults & kwargs planned (Later) — F# has neither;
//   all functions are CURRIED, which gives partial application for free.
// ============================================================

let add a b = a + b                    // inferred: int -> int -> int
let inc = add 1                         // partial application

// Multi-clause via pattern matching at function body.
let rec factorial = function
    | 0 -> 1
    | n -> n * factorial (n - 1)

// Closures.
let makeCounter () =
    let count = ref 0
    fun () ->
        count.Value <- count.Value + 1
        count.Value


// ============================================================
// 10. Lambdas (fun x -> x * 2 — direct ancestor of LS shorthand)
//   LS: shipped (full-form). Arrow shorthand `x -> x*2` planned (Next).
//   F#'s `fun x -> x * 2` is *literally* the syntactic ancestor of LS's
//   planned arrow shorthand (Haskell uses `\x ->`; F# dropped the slash).
// ============================================================

let double = fun x -> x * 2
let addXY = fun x y -> x + y
let constFn = fun () -> 42


// ============================================================
// 11. Pipelines — F# is the design source for `|>`
//   LS: planned (Next) — pipeline operator. F# INVENTED `|>` as a
//   first-class operator (Don Syme, around 2003). Reads left-to-right.
//   `x |> f` is just `f x`. With curried functions, this is the natural
//   "value flows into the next function" pattern.
// ============================================================

let section11 () =
    [ 1; 2; 3; 4; 5 ]
    |> List.filter (fun v -> v > 0)
    |> List.map (fun v -> v * 2)
    |> List.sum
    // |> printfn "%d"

// Also: `>>` for function composition, `<|` for right-to-left application.
let composed = (fun x -> x + 1) >> (fun x -> x * 2)
// composed 3 = (3+1)*2 = 8


// ============================================================
// 12. Lists & arrays
//   LS: planned (Next). F#: immutable List (linked), mutable Array,
//   immutable Set, lazy Seq. List literal: `[ 1; 2; 3 ]` — semicolons!
// ============================================================

let section12 () =
    let nums = [ 1; 2; 3; 4; 5 ]        // semicolons, not commas (commas make tuples)
    let head = List.head nums
    let prepended = 0 :: nums            // cons
    let len = List.length nums

    let arr = [| 1; 2; 3; 4; 5 |]        // mutable array literal
    arr.[0] <- 100                        // index assignment via <-
    (head, prepended, len, arr.[0])


// ============================================================
// 13. Maps
//   LS: planned (Next). F#: immutable Map. `Map.ofList` to build.
// ============================================================

let section13 () =
    let person = Map.ofList [ "name", "Alice"; "age", "30" ]
    let name = Map.tryFind "name" person
    let updated = Map.add "role" "admin" person
    let removed = Map.remove "name" updated
    (name, Map.count person, Map.count removed)


// ============================================================
// 14. Sets
//   LS: planned (Later). F#: immutable Set with operators.
// ============================================================

let section14 () =
    let primes = Set.ofList [ 2; 3; 5; 7 ]
    let more = primes.Add 11
    let has = primes.Contains 2
    let u = Set.union primes (Set.ofList [ 11; 13 ])
    let i = Set.intersect primes (Set.ofList [ 3; 5; 9 ])
    (has, Set.count more, Set.count u, Set.count i)


// ============================================================
// 15. Pattern matching + discriminated unions
//   LS: planned (Next). F# pattern matching is full-featured: literals,
//   bindings, guards, tuple/list/record patterns. Discriminated unions
//   are the algebraic-data-type primitive — LS's `match` on Lists/Dicts
//   plus tagged variants would land in this design.
// ============================================================

type Shape =
    | Circle of radius: float
    | Square of side: float
    | Rect of width: float * height: float

let area shape =
    match shape with
    | Circle r -> Math.PI * r * r
    | Square s -> s * s
    | Rect (w, h) -> w * h

let describe value =
    match value with
    | 0 -> "zero"
    | n when n < 0 -> "negative"
    | _ -> "positive"

let describeList xs =
    match xs with
    | [] -> "empty"
    | [ x ] -> sprintf "one: %d" x
    | x :: rest -> sprintf "first %d, then %d more" x (List.length rest)

// Destructuring in `let`.
let section15 () =
    let (a, b, c) = (1, 2, 3)
    let head :: _tail = [ 1; 2; 3; 4 ]  // warning: incomplete pattern
    let { Width = w; Height = h } = {| Width = 10; Height = 20 |}   // anonymous record
    (a, b, c, head, w, h)


// ============================================================
// 16. Error handling: Result, Option, try-with
//   LS: planned (Later) — try/catch. F# preferred style: encode failure
//   in the type with Result<'T, 'TError>. Exceptions (try/with) exist
//   for .NET interop and truly exceptional cases.
// ============================================================

type AppError =
    | NotFound of string
    | BadInput of string

let parseId (s : string) : Result<int, AppError> =
    match Int32.TryParse s with
    | true, n when n > 0 -> Ok n
    | true, _ -> Error (BadInput "must be positive")
    | false, _ -> Error (BadInput ("not a number: " + s))

let findUser id =
    match parseId id with
    | Error e -> Error e
    | Ok 0 -> Error (NotFound "no user 0")
    | Ok n -> Ok (sprintf "user_%d" n)

// try-with for actual exceptions.
let section16 () =
    try
        let arr = [| 1; 2; 3 |]
        arr.[99]
    with
    | :? IndexOutOfRangeException as e ->
        printfn "out of bounds: %s" e.Message
        -1
    | _ ->
        -1


// ============================================================
// 17. Methods on types (dot-call inherited from .NET)
//   LS: planned (Later). F# inherits the .NET method ecosystem.
//   Strings, arrays, etc. have rich method surfaces accessed via `.`.
// ============================================================

let section17 () =
    let upper = "hello".ToUpper()
    let parts = "a,b,c".Split(',')
    let trimmed = "  pad  ".Trim()
    let arr = [| 1; 2; 3 |]
    let joined = String.Join(",", parts)
    (upper, parts, trimmed, joined, arr.Length)


// ============================================================
// 18. Inspect / debug (printfn / sprintf)
//   LS: planned (Future). F#: `printfn "%A"` is the universal "pretty
//   print anything" verb; `sprintf "%A"` returns a string instead.
// ============================================================

let section18 () =
    let x = [ 1; 2; 3 ]
    printfn "%A" x                  // [1; 2; 3]
    printfn "%O" x                  // generic ToString
    sprintf "%A" x                  // returns "[1; 2; 3]"


// ============================================================
// 19. Beyond Lucky Script — F# gems
//   LS: not planned.
// ============================================================

// --- Active patterns: pattern matching, but extensible ---
// An active pattern is a NAMED pattern that's a function under the hood.
// `(|Even|Odd|)` defines a complete partition of int into Even/Odd.
// Then `match n with | Even -> ... | Odd -> ...` works as if Even/Odd
// were built-in constructors. NO other language in this set has this.

let (|Even|Odd|) n =
    if n % 2 = 0 then Even else Odd

let parity n =
    match n with
    | Even -> "even"
    | Odd -> "odd"

// Partial active patterns: return Option to say "this case matches".
let (|Positive|_|) n = if n > 0 then Some n else None
let (|Negative|_|) n = if n < 0 then Some (-n) else None

let signOf n =
    match n with
    | Positive p -> sprintf "positive %d" p
    | Negative p -> sprintf "negative magnitude %d" p
    | _ -> "zero"

// Parameterized active patterns: take args.
let (|DivisibleBy|_|) divisor n = if n % divisor = 0 then Some n else None

let fizzbuzz n =
    match n with
    | DivisibleBy 15 _ -> "FizzBuzz"
    | DivisibleBy 3 _ -> "Fizz"
    | DivisibleBy 5 _ -> "Buzz"
    | _ -> string n


// --- Computation expressions: customizable `do`-notation ---
// A computation expression defines a domain-specific control-flow
// language using `let!` (bind) and `return` inside a builder block.
// Built-ins: `seq { }`, `async { }`, `task { }`. The `Result` builder
// below sugars Result-chaining the way Haskell's `do` sugars monads
// or Gleam's `use` sugars Result.try.

type ResultBuilder() =
    member _.Bind(m, f) =
        match m with
        | Ok v -> f v
        | Error e -> Error e
    member _.Return v = Ok v
    member _.ReturnFrom m = m

let result = ResultBuilder()

let combined =
    result {
        let! a = parseId "10"
        let! b = parseId "32"
        return a + b
    }
// `combined` is `Ok 42`. The two `let!` lines hide all the Result-matching.


// --- Units of measure: static dimensional analysis ---
// Compile-time check that you don't add metres to seconds. Zero runtime
// cost. Truly unique to F#; no other language in this set has it.

[<Measure>] type m
[<Measure>] type s

let distance : float<m> = 100.0<m>
let time : float<s> = 9.58<s>
let speed : float<m / s> = distance / time
// let bad = distance + time     // compile error: m and s don't add


// --- Sequence expressions: lazy collection builders ---
// `seq { }` is F#'s comprehension. With `yield` and `yield!`, sequences
// can be defined recursively and infinitely.

let squares = seq { for x in 1 .. 10 -> x * x }
let evens = seq { for x in 1 .. 20 do if x % 2 = 0 then yield x }

let rec naturals n = seq { yield n; yield! naturals (n + 1) }
let firstTen = naturals 0 |> Seq.take 10 |> Seq.toList


// ============================================================
// EntryPoint — `dotnet run` calls this.
// ============================================================

[<EntryPoint>]
let main _ =
    printfn "Lucky Script Inspirations — F#"
    let _ = section02 ()
    let _ = section03 ()
    section04 ()
    let _ = section05 ()
    let _ = section07 ()
    let _ = section08 ()
    let _ = section11 ()
    let _ = section12 ()
    let _ = section13 ()
    let _ = section14 ()
    let _ = section15 ()
    let _ = section16 ()
    let _ = section17 ()
    section18 ()
    printfn "%d" (classify 5)
    printfn "%d" (absValue -7)
    printfn "%f" (area (Circle 2.0))
    printfn "%s" (describeList [ 1; 2; 3 ])
    printfn "%s" (parity 7)
    printfn "%s" (signOf -3)
    printfn "%s" (fizzbuzz 15)
    printfn "%A" combined
    printfn "%A" firstTen
    0
