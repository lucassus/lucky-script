// ============================================================
// Lucky Script Inspirations — Swift
// ============================================================
// Assumed: Swift 5.9+.
// See ../roadmap.md for Lucky Script's feature roadmap.
//
// Swift earns a spot in this set primarily because `guard let` is the
// design ancestor of LS's planned guard-`if`: a statement that ONLY
// branches on the "fail" side and binds locals on the "success" side,
// with NO else-branch semantics. Outside of that, Swift overlaps with
// Kotlin on most ergonomic features.
//
// Sections:
//   01. Comments & program structure
//   02. Variables & assignment (let / var)
//   03. Numbers, booleans, Optional (no null)
//   04. Strings (interpolation built in)
//   05. Operators
//   06. if / else if / else (statement + expression)
//   07. while, repeat-while, guard, break, continue
//   08. for-each (for-in)
//   09. Functions, defaults, labels (Swift IS named-args)
//   10. Closures (LS arrow shorthand cousin: trailing closure)
//   11. Higher-order functions & method chains
//   12. Arrays
//   13. Dictionaries
//   14. Sets
//   15. Pattern matching (switch + enum w/ associated values)
//   16. Error handling (try / catch + Result + throws)
//   17. Methods on types (extensions are the standout)
//   18. Inspect / debug (print, dump, Mirror)
//   19. Beyond LS: guard-let, protocols + protocol extensions, trailing closures, property wrappers

import Foundation


// ============================================================
// 01. Comments & program structure
//   LS: shipped (# comments). Swift: //, /* */, /// (doc).
// ============================================================

// Line comment.
/* Block comment. Can /* nest */ unlike most languages. */
/// Doc comment — Markdown-formatted, feeds Xcode quick-help.


// ============================================================
// 02. Variables & assignment (let / var)
//   LS: shipped (mutable). Swift: `let` is IMMUTABLE, `var` is mutable.
//   Same split as Kotlin's val/var, Rust's let/let-mut.
// ============================================================

let pi = 3.14159

func section02() {
    let x = 10
    // x = 20                    // error: let is immutable
    var y = 10
    y = 20
    y += 5

    // Parallel binding via tuple destructure.
    let (a, b) = (1, 2)
    var (p, q) = (1, 2)
    (p, q) = (q, p)              // swap by destructure-reassignment
    _ = (x, y, a, b, p, q)
}


// ============================================================
// 03. Numbers, booleans, Optional (no null)
//   LS: shipped (has `nothing`). Swift: NO bare null. `Optional<T>` is
//   the encoding; the sugar `T?` is everywhere.
// ============================================================

func section03() {
    let n: Int = 1_000_000
    let pi: Double = 3.14159
    let big: Int64 = 1 << 62
    let t: Bool = true

    // Optional.
    var maybeName: String? = "Alice"   // sugar for Optional<String>.some("Alice")
    maybeName = nil                     // sugar for Optional<String>.none

    // Force-unwrap with `!` (throws at runtime if nil) — avoid.
    // Better: optional chaining `?.`, nil-coalesce `??`, if-let, guard-let.
    print(maybeName?.count ?? 0)
    if let name = maybeName {
        print(name)
    }
    _ = (n, pi, big, t)
}


// ============================================================
// 04. Strings (interpolation built in)
//   LS: shipped (escapes, concat). f-strings planned (Later);
//   multiline planned (Future). Swift has BOTH. Interpolation is
//   `\(expr)` inside double-quoted strings.
// ============================================================

func section04() {
    let greeting = "hello"
    let name = "world"
    print(greeting + " " + name)
    print("say \"hi\"")
    print("line1\nline2")

    // Interpolation.
    print("hello \(name)")
    print("sum is \(1 + 2)")

    // Multi-line via triple-quote with leading-whitespace strip.
    let multi = """
      line 1
      line 2
      """
    print(multi)
}


// ============================================================
// 05. Operators
//   LS: shipped. Swift: `%` is modulo for Int; `**` doesn't exist —
//   use `pow(base, exp)` from Foundation. Ranges with `...`/`..<`.
// ============================================================

func section05() {
    _ = 1 + 2 * 3
    _ = 10 % 3
    _ = 10 / 3                  // integer division for Int
    _ = pow(2.0, 10.0)          // float power via Foundation

    _ = true && false
    _ = true || false
    _ = !true

    _ = (1...5).contains(3)     // closed range
    _ = (1..<5).contains(5)     // half-open range
}


// ============================================================
// 06. if / else if / else (statement + expression)
//   LS: shipped (statement). if-expression planned (Next) — Swift's
//   `if` became an expression in Swift 5.9. Same for `switch`.
// ============================================================

func classify(_ value: Int) -> Int {
    if value < 0 {
        return -1
    } else if value == 0 {
        return 0
    } else {
        return 1
    }
}

// Swift 5.9+: if-expression
func classify2(_ value: Int) -> Int {
    return if value < 0 { -1 }
           else if value == 0 { 0 }
           else { 1 }
}

// Ternary works for simple cases.
func absValue(_ x: Int) -> Int { x < 0 ? -x : x }


// ============================================================
// 07. while, repeat-while, guard, break, continue
//   LS: shipped (while/break/continue). Guard-if planned (Later) —
//   Swift's `guard` is the most refined guard-style early-exit in any
//   mainstream language. It DEMANDS an `else` that exits (return/break/
//   continue/throw); the bindings live in the surrounding scope.
// ============================================================

func section07() {
    var i = 0
    while i < 10 {
        i += 1
        if i == 3 { continue }
        if i == 7 { break }
        print(i)
    }

    // repeat-while = do-while: body runs at least once.
    var j = 0
    repeat { j += 1 } while j < 3

    // Labeled break/continue.
    outer: for r in 0..<3 {
        for c in 0..<3 {
            if r == 1 && c == 1 { break outer }
        }
    }
}

// `guard` — the LS roadmap reference. The else MUST exit the scope.
// Bindings from `guard let x = ...` live in the *enclosing* scope,
// not just inside the else.
func process(input: String?) -> Int {
    guard let s = input else {
        return -1                       // must exit
    }
    guard let n = Int(s) else {
        return -1
    }
    guard n > 0 else {
        return -1
    }
    // `s` and `n` are now in scope, statically known non-nil and positive.
    return n * 2
}


// ============================================================
// 08. for-each (for-in)
//   LS: planned (Next). Swift: `for x in seq` is the for-each.
// ============================================================

func section08() {
    var total = 0
    for item in [10, 20, 30] {
        total += item
    }

    for (i, item) in ["a", "b", "c"].enumerated() {
        print("\(i): \(item)")
    }

    for i in 0..<5 { print(i) }
    for i in stride(from: 0, to: 10, by: 2) { print(i) }
    _ = total
}


// ============================================================
// 09. Functions, defaults, labels (Swift IS named-args)
//   LS: shipped. Defaults & kwargs planned (Later) — Swift is the
//   strongest named-args design in this set. Every argument has an
//   *external label* by default; you opt out with `_`.
// ============================================================

func add(_ a: Int, _ b: Int) -> Int { a + b }

// External label "to" — call site reads naturally: greet("Alice", with: "Hi")
func greet(_ name: String, with greeting: String = "Hello") {
    print("\(greeting), \(name)")
}

// Variadic.
func variadic(_ args: Int...) -> Int { args.reduce(0, +) }

// Closures (returned as values).
func makeCounter() -> () -> Int {
    var count = 0
    return {
        count += 1
        return count
    }
}

func section09() {
    greet("Alice")
    greet("Alice", with: "Hi")
    _ = variadic(1, 2, 3)
    let c = makeCounter()
    print(c(), c())
}


// ============================================================
// 10. Closures (LS arrow shorthand cousin: trailing closure)
//   LS: shipped (full-form). Arrow shorthand `x -> x*2` planned (Next).
//   Swift closures: `{ x in x * 2 }`. The `in` separates params from body.
//   When a closure is the last argument, you can move it OUTSIDE the
//   parens — the "trailing closure" idiom.
// ============================================================

func section10() {
    let double: (Int) -> Int = { x in x * 2 }
    let addXY: (Int, Int) -> Int = { x, y in x + y }
    let constFn: () -> Int = { 42 }

    // Argument shorthands: $0, $1, …
    let triple: (Int) -> Int = { $0 * 3 }

    // Trailing closure: last-arg closure moves outside the parens.
    let nums = [1, 2, 3]
    let doubled = nums.map { $0 * 2 }                // no parens needed at all
    let r = nums.reduce(0) { acc, v in acc + v }     // first args parens, last trailing
    _ = (double, addXY, constFn, triple, doubled, r)
}


// ============================================================
// 11. Higher-order functions & method chains
//   LS: HOFs work today. Pipeline `|>` planned (Next) — Swift has no `|>`;
//   chained methods carry the same flow.
// ============================================================

func section11() {
    let nums = [1, 2, 3, 4, 5]
    let result = nums
        .filter { $0 > 0 }
        .map { $0 * 2 }
        .reduce(0, +)
    print(result)
}


// ============================================================
// 12. Arrays
//   LS: planned (Next). Swift: `Array<T>` (also `[T]` sugar). Value type
//   with copy-on-write — assignment LOGICALLY copies but doesn't pay
//   memory until you mutate. Same surface as LS's planned list.
// ============================================================

func section12() {
    var nums = [1, 2, 3, 4, 5]
    print(nums[0])
    print(nums.last ?? -1)
    print(Array(nums[1..<4]))
    nums.append(6)
    nums[0] = 100
    print(nums.count)
}


// ============================================================
// 13. Dictionaries
//   LS: planned (Next). Swift: `Dictionary<K, V>` (also `[K: V]` sugar).
//   Lookup returns `V?` — built-in "missing vs zero" handling.
// ============================================================

func section13() {
    var person: [String: Any] = ["name": "Alice", "age": 30]
    print(person["name"] as? String ?? "unknown")
    person["role"] = "admin"
    person.removeValue(forKey: "role")
    print(person.count)
}


// ============================================================
// 14. Sets
//   LS: planned (Later). Swift: `Set<T>` — needs `Hashable` element.
// ============================================================

func section14() {
    var primes: Set<Int> = [2, 3, 5, 7]
    primes.insert(11)
    print(primes.contains(2))
    primes.remove(3)
    print(primes.union([11, 13]))
    print(primes.intersection([3, 5, 9]))
}


// ============================================================
// 15. Pattern matching (switch + enum w/ associated values)
//   LS: planned (Next). Swift's `switch` is exhaustive, supports
//   tuple matching, value bindings, where-clauses, range patterns, and
//   enum-with-associated-values patterns. Closest cousin to Rust's match.
// ============================================================

enum Shape {
    case circle(radius: Double)
    case square(side: Double)
    case rect(w: Double, h: Double)
}

func area(_ s: Shape) -> Double {
    switch s {
    case .circle(let r): return .pi * r * r
    case .square(let side): return side * side
    case .rect(let w, let h): return w * h
    }
    // Exhaustive: compiler enforces all cases covered.
}

func describe(_ value: Any) -> String {
    switch value {
    case let n as Int where n == 0:
        return "zero"
    case let n as Int where n < 0:
        return "negative"
    case let xs as [Int] where xs.isEmpty:
        return "empty"
    case let xs as [Int] where xs.count == 1:
        return "one: \(xs[0])"
    case let xs as [Int]:
        return "first \(xs[0]), then \(xs.count - 1) more"
    case let d as [String: Any] where d["name"] != nil:
        return "named \(d["name"]!)"
    default:
        return "other"
    }
}

// Destructuring.
func section15() {
    let (a, b, c) = (1, 2, 3)
    let p = Shape.circle(radius: 5.0)
    if case .circle(let r) = p {
        print("circle r=\(r)")
    }
    _ = (a, b, c)
}


// ============================================================
// 16. Error handling (try / catch + Result + throws)
//   LS: planned (Later) — try/catch. Swift: TWO error-handling styles
//   shipped side-by-side. (1) Functions marked `throws` and called with
//   `try`. (2) `Result<Success, Failure>` value-type wrapper.
// ============================================================

enum AppError: Error {
    case notFound(String)
    case badInput(String)
}

func parseId(_ s: String) throws -> Int {
    guard let n = Int(s) else {
        throw AppError.badInput("not a number: \(s)")
    }
    guard n > 0 else {
        throw AppError.badInput("must be positive")
    }
    return n
}

func findUser(_ idStr: String) throws -> String {
    let id = try parseId(idStr)
    if id == 0 { throw AppError.notFound("no user 0") }
    return "user_\(id)"
}

func section16() {
    // Three styles of calling a throwing function:
    do {
        let n = try findUser("42")
        print(n)
    } catch AppError.notFound(let msg) {
        print("nope: \(msg)")
    } catch AppError.badInput(let msg) {
        print("bad: \(msg)")
    } catch {
        print("other: \(error)")
    }

    // try? — turns throws into Optional.
    let opt: String? = try? findUser("oops")
    _ = opt

    // try! — force, crashes on error.
    // let forced = try! findUser("42")

    // Result wrapper — when you want the error as a value.
    let r: Result<String, Error> = Result { try findUser("0") }
    switch r {
    case .success(let v): print(v)
    case .failure(let e): print(e)
    }
}


// ============================================================
// 17. Methods on types (extensions are the standout)
//   LS: planned (Later). Swift: rich method surface PLUS the ability to
//   add methods to existing types from outside via `extension`. Same
//   power as Kotlin's extension functions.
// ============================================================

extension String {
    func shout() -> String { self.uppercased() + "!" }
}

extension Array where Element == Int {
    func sumOfSquares() -> Int { self.map { $0 * $0 }.reduce(0, +) }
}

func section17() {
    print("hello".shout())
    print([1, 2, 3].sumOfSquares())
    print("  pad  ".trimmingCharacters(in: .whitespaces))
    print(["a", "b", "c"].joined(separator: ","))
}


// ============================================================
// 18. Inspect / debug (print, dump, Mirror)
//   LS: planned (Future). Swift: `print` for human output, `dump` for
//   tree-shape debug output, `Mirror` for runtime introspection.
// ============================================================

func section18() {
    let xs = [1, 2, 3]
    print(xs)                // [1, 2, 3]
    dump(xs)                 // ▿ 3 elements
                             //   - 0
                             //   - 1
                             //   - 2
    print(type(of: xs))       // Array<Int>
}


// ============================================================
// 19. Beyond Lucky Script — Swift gems
//   LS: not planned.
// ============================================================

// --- guard let: the LS-relevant design point, deeper ---
// `guard let` is the cleanest "happy-path" early-exit available.
// Bindings escape into the enclosing scope. The else-branch MUST
// terminate scope (return / throw / break / continue / fatalError).
// LS's roadmap guard-`if` is the same idea, restricted to `return`/
// `break`/`continue` and without the let-binding.

func guardLetDemo(_ raw: String?) -> Int {
    guard let s = raw,
          let n = Int(s),
          n > 0
    else { return -1 }
    // `s` is non-nil String; `n` is positive Int; both live in the rest of the function.
    return n * 2
}


// --- Protocols + protocol extensions: structural interfaces with defaults ---
// Like a Haskell typeclass, but with optional default implementations.
// Combined with `extension`, this is "protocol-oriented programming".

protocol Shoutable {
    func shout() -> String
}

extension Shoutable {
    // Default implementation.
    func shoutTwice() -> String { shout() + " " + shout() }
}

extension Int: Shoutable {
    func shout() -> String { "Number: \(self)!" }
}


// --- Trailing closures + result builders: DSL ergonomics ---
// When a function takes one trailing closure, parens vanish:
//     UIView.animate { ... }
// With @resultBuilder, the trailing closure can use a custom mini-language.
// SwiftUI's view DSL is built on this. LS could borrow trailing-closure
// syntax if it ever adopts dot-method calls.

func benchmark(_ label: String, _ body: () -> Void) {
    let start = Date()
    body()
    print("\(label): \(Date().timeIntervalSince(start))s")
}

func trailingClosureDemo() {
    benchmark("sum") {                           // no parens needed
        var s = 0
        for i in 0..<1000 { s += i }
        _ = s
    }
}


// --- Property wrappers: customizable storage and access ---
// `@propertyWrapper` lets a struct intercept all reads/writes of a
// property. SwiftUI's @State / @Binding, validation, lazy init, atomic
// access — all property wrappers. Nothing else in this set has this.

@propertyWrapper
struct Clamped {
    var value: Int
    let range: ClosedRange<Int>
    init(wrappedValue: Int, _ range: ClosedRange<Int>) {
        self.range = range
        self.value = min(max(wrappedValue, range.lowerBound), range.upperBound)
    }
    var wrappedValue: Int {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }
}

struct Player {
    @Clamped(0...100) var health: Int = 50
}

func propertyWrapperDemo() {
    var p = Player()
    p.health = 200                 // wrapper clamps to 100
    p.health = -50                 // wrapper clamps to 0
    print(p.health)
}


// ============================================================
// Top-level driver — Swift scripts run top-level statements directly.
// ============================================================

print("Lucky Script Inspirations — Swift")
section02()
section03()
section04()
section05()
section07()
section08()
section09()
section10()
section11()
section12()
section13()
section14()
section15()
section16()
section17()
section18()
print(classify(5))
print(classify2(-3))
print(absValue(-7))
print(area(.circle(radius: 2.0)))
print(describe([1, 2, 3]))
print(process(input: "21"))
print(guardLetDemo("42"))
print(42.shout())
trailingClosureDemo()
propertyWrapperDemo()
