// ============================================================
// Lucky Script Inspirations — Kotlin
// ============================================================
// Assumed: Kotlin 2.0+.
// See ../roadmap.md for Lucky Script's feature roadmap.
//
// Kotlin is the most pragmatic FP+OOP blend in this set. It's where
// many of your "Later" roadmap items live as first-class designed
// features: default & keyword args, named arguments, `when` (pattern
// matching), data/sealed classes (ADTs done well), extension functions,
// scope functions. If you ever wonder "what does an LS-Plus look like
// after roadmap is done?", Kotlin is the closest answer.
//
// Sections:
//   01. Comments & program structure
//   02. Variables & assignment (val/var)
//   03. Numbers, booleans, null
//   04. Strings (template syntax)
//   05. Operators
//   06. if / else if / else (statement + expression)
//   07. while, break, continue, labels
//   08. for-each (in iterables)
//   09. Functions, defaults, named args
//   10. Lambdas (LS's arrow shorthand cousin)
//   11. Higher-order functions & "pipelines"
//   12. Lists & arrays
//   13. Maps
//   14. Sets
//   15. Pattern matching: when + sealed classes + destructuring
//   16. Error handling
//   17. Methods on types (dot-call)
//   18. Inspect / debug
//   19. Beyond LS: scope functions, data/sealed classes, extensions, smart casts

@file:Suppress("UNUSED_VARIABLE", "UNUSED_PARAMETER", "unused")

// ============================================================
// 01. Comments & program structure
//   LS: shipped (# comments). Kotlin: //, /* */, /** */ KDoc.
//   No `package main` needed; top-level declarations are fine.
// ============================================================

// Line comments use //.
/* Block comments. */
/** KDoc with [links] and `code spans`. */


// ============================================================
// 02. Variables & assignment (val/var)
//   LS: shipped. Kotlin: `val` = read-only (LS's `let` is closest);
//   `var` = mutable. Parallel multi-assignment via destructuring (§15).
// ============================================================

private val PI = 3.14159
private var counterX = 10

fun section02() {
    val x: Int = 10         // explicit type
    var y = 20              // inferred Int
    y = 30                  // var can be reassigned
    // x = 11               // error: val is read-only

    y += 5
    y *= 2

    // No comma-list assignment shorthand; use destructuring (§15) or two lines.
    var a = 1; var b = 2
    val tmp = a; a = b; b = tmp
}


// ============================================================
// 03. Numbers, booleans, null
//   LS: shipped. Kotlin: nullable types are FIRST-CLASS. `String` and
//   `String?` are different types — `?.` and `?:` are the navigation tools.
// ============================================================

fun section03() {
    val n: Int = 1_000_000
    val pi: Double = 3.14159
    val big: Long = 1L shl 62
    val t: Boolean = true

    // Nullable vs non-nullable.
    var name: String = "Alice"
    // name = null              // compile error
    var maybeName: String? = "Alice"
    maybeName = null             // ok

    // Safe call `?.` and elvis `?:`.
    val len = maybeName?.length ?: 0
    println(len)

    // `!!` asserts non-null and throws NPE if wrong — last resort.
    // val forced = maybeName!!.length
}


// ============================================================
// 04. Strings (template syntax)
//   LS: shipped (escapes, concat). f-strings planned (Later);
//   multiline planned (Future). Kotlin has both natively.
// ============================================================

fun section04() {
    val greeting = "hello"
    val name = "world"
    println(greeting + " " + name)

    println("say \"hi\"")
    println("line1\nline2")

    // Template strings — $var or ${expr}.
    println("hello $name")
    println("sum is ${1 + 2}")

    // Raw string with """ ... """, multi-line, no escapes (use trimIndent).
    val multi = """
        line 1
        line 2
    """.trimIndent()
    println(multi)
}


// ============================================================
// 05. Operators
//   LS: shipped. Kotlin: `%` for modulo, no `**` (use Math.pow or
//   extension), bitwise via infix words (`and`, `or`, `shl`, `shr`).
// ============================================================

fun section05() {
    println(1 + 2 * 3)
    println(10 % 3)
    println(10 / 3)          // integer division for Int
    println(10.0 / 3)        // float division

    println(true && false)
    println(true || false)
    println(!true)

    // ranges + `in` operator.
    println(5 in 1..10)      // true
    println(5 in 1..<10)     // half-open range (Kotlin 1.7+)
}


// ============================================================
// 06. if / else if / else (statement + expression)
//   LS: shipped (statement). if-expression planned (Next) — Kotlin's `if`
//   IS an expression already; this is the design reference.
// ============================================================

fun classify(value: Int): Int {
    return if (value < 0) -1
    else if (value == 0) 0
    else 1
}

// Single-expression body — implicit return.
fun classify2(value: Int): Int =
    if (value < 0) -1
    else if (value == 0) 0
    else 1


// ============================================================
// 07. while, break, continue, labels
//   LS: shipped (while/break/continue). Guard-if planned (Later) — Kotlin
//   has no postfix `if`, but `return@label` + scope functions do similar.
// ============================================================

fun section07() {
    var i = 0
    while (i < 10) {
        i += 1
        if (i == 3) continue
        if (i == 7) break
        println(i)
    }

    // do-while runs the body at least once.
    var j = 0
    do { j += 1 } while (j < 3)

    // Labeled break/continue for nested loops.
    outer@ for (r in 0..2) {
        for (c in 0..2) {
            if (r == 1 && c == 1) break@outer
        }
    }
}


// ============================================================
// 08. for-each (in iterables)
//   LS: planned (Next). Kotlin `for (x in iterable)` is the for-each.
// ============================================================

fun section08() {
    var total = 0
    for (item in listOf(10, 20, 30)) {
        total += item
    }

    // Index + value via withIndex().
    for ((i, item) in listOf("a", "b", "c").withIndex()) {
        println("$i: $item")
    }

    // Numeric ranges.
    for (i in 0..<5) println(i)        // 0..4
    for (i in 10 downTo 0 step 2) println(i)
}


// ============================================================
// 09. Functions, defaults, named args
//   LS: shipped (functions, closures). Defaults & kwargs planned (Later) —
//   Kotlin is the design reference for both.
// ============================================================

fun add(a: Int, b: Int): Int = a + b

// Default arguments. Evaluated at call time.
fun greet(name: String, greeting: String = "Hello") {
    println("$greeting, $name")
}

// Variadic with `vararg`. Spread with `*` at the call site.
fun variadic(vararg args: Int): Int = args.sum()

fun section09() {
    greet("Alice")
    greet("Alice", greeting = "Hi")             // named argument
    greet(name = "Alice", greeting = "Hi")      // all named (any order)

    val xs = intArrayOf(1, 2, 3)
    println(variadic(*xs))                       // spread

    // Closure.
    val counter = makeCounter()
    println(counter())                            // 1
    println(counter())                            // 2
}

fun makeCounter(): () -> Int {
    var count = 0
    return { count += 1; count }
}


// ============================================================
// 10. Lambdas (LS's arrow shorthand cousin)
//   LS: shipped (full-form). Arrow shorthand `x -> x*2` planned (Next) —
//   Kotlin lambdas are `{ x -> x * 2 }`. Single-arg lambdas use `it`.
// ============================================================

val double: (Int) -> Int = { x -> x * 2 }
val addXY: (Int, Int) -> Int = { x, y -> x + y }
val constFn: () -> Int = { 42 }

// `it` is the implicit name for the single-parameter lambda.
val triple: (Int) -> Int = { it * 3 }

// Trailing lambda: if a function's last arg is a lambda, it can move
// outside the parens — central to Kotlin's DSL-friendly style.
// listOf(1, 2, 3).map { it * 2 }


// ============================================================
// 11. Higher-order functions & "pipelines"
//   LS: HOFs work today. Pipeline `|>` planned (Next) — Kotlin has no `|>`
//   but `let` + method chains achieve the same flow.
// ============================================================

fun section11() {
    val nums = listOf(1, 2, 3, 4, 5)

    val doubled = nums.map { it * 2 }
    val positives = nums.filter { it > 2 }
    val total = nums.fold(0) { acc, v -> acc + v }

    // Method chain is Kotlin's "pipeline".
    val result = nums
        .filter { it > 0 }
        .map { it * 2 }
        .sum()
    println(result)

    // `.let` flips the order — value-first then operation.
    val x = 5
    val r = x.let { it * 2 }.let { it + 1 }
    println(r)
}


// ============================================================
// 12. Lists & arrays
//   LS: planned (Next). Kotlin: immutable List vs mutable MutableList;
//   IntArray etc. are primitive-backed (perf).
// ============================================================

fun section12() {
    val nums = listOf(1, 2, 3, 4, 5)             // immutable
    println(nums[0])
    println(nums.last())
    println(nums.subList(1, 4))                  // half-open slice

    val mutable = mutableListOf(1, 2, 3)
    mutable.add(4)
    mutable[0] = 100
}


// ============================================================
// 13. Maps
//   LS: planned (Next). Kotlin: immutable Map vs mutable MutableMap;
//   `mapOf("k" to 1)` uses the `to` infix to build pairs.
// ============================================================

fun section13() {
    val person = mapOf("name" to "Alice", "age" to 30)
    println(person["name"])
    println(person.getOrDefault("missing", "default"))

    val mutable = mutableMapOf("a" to 1)
    mutable["b"] = 2
    mutable.remove("a")
}


// ============================================================
// 14. Sets
//   LS: planned (Later). Kotlin: setOf / mutableSetOf. No literal syntax.
// ============================================================

fun section14() {
    val primes = setOf(2, 3, 5, 7)
    println(2 in primes)

    val mutable = mutableSetOf(1, 2, 3)
    mutable.add(4)
    mutable.remove(1)

    println(setOf(1, 2, 3) union setOf(3, 4))
    println(setOf(1, 2, 3) intersect setOf(2, 3, 4))
    println(setOf(1, 2, 3) subtract setOf(2))
}


// ============================================================
// 15. Pattern matching: when + sealed classes + destructuring
//   LS: planned (Next). Kotlin `when` is the pattern-matching primitive.
//   With sealed classes, the compiler enforces exhaustiveness.
// ============================================================

// Sealed class = closed set of subtypes — Kotlin's ADT.
sealed class Shape
data class Circle(val radius: Double) : Shape()
data class Square(val side: Double) : Shape()
data class Rect(val w: Double, val h: Double) : Shape()

fun area(s: Shape): Double = when (s) {
    is Circle -> Math.PI * s.radius * s.radius
    is Square -> s.side * s.side
    is Rect   -> s.w * s.h
    // No `else` needed: compiler verifies exhaustiveness over the sealed hierarchy.
}

fun describe(value: Any?): String = when (value) {
    null         -> "nothing"
    0            -> "zero"
    is Int       -> if (value < 0) "negative" else "positive"
    is List<*>   -> when {
        value.isEmpty() -> "empty"
        value.size == 1 -> "one: ${value[0]}"
        else            -> "first ${value[0]}, then ${value.size - 1} more"
    }
    is Map<*, *> -> {
        val name = value["name"]
        if (name != null) "named $name" else "anonymous map"
    }
    else         -> "other"
}

// Destructuring — works for data classes, Pair, Triple, Map entries.
fun section15() {
    val p = Circle(5.0)
    val (r) = p                                  // destructures Circle
    val person = mapOf("name" to "Alice", "age" to 30)
    for ((key, value) in person) {
        println("$key=$value")
    }
}


// ============================================================
// 16. Error handling
//   LS: planned (Later) — try/catch. Kotlin: try/catch/finally; try is
//   also an EXPRESSION. Runtime.Result<T> for non-throwing alt.
// ============================================================

class AppError(message: String) : Exception(message)

fun mustBePositive(v: Int): Int {
    if (v < 0) throw AppError("negative: $v")
    return v
}

fun section16() {
    val result: Int = try {
        mustBePositive(-1)
    } catch (e: AppError) {
        println("caught: ${e.message}")
        0
    } finally {
        println("always runs")
    }
    println(result)

    // kotlin.Result wraps success/failure as a value — Result-style.
    val r: Result<Int> = runCatching { mustBePositive(-1) }
    r.fold(
        onSuccess = { println("ok: $it") },
        onFailure = { println("err: ${it.message}") }
    )
}


// ============================================================
// 17. Methods on types (dot-call)
//   LS: planned (Later). Kotlin: rich method surface on every type;
//   extension functions let you ADD methods from outside (see §19).
// ============================================================

fun section17() {
    println("hello".uppercase())
    println("hello".replace("l", "L"))
    println("  pad  ".trim())
    println(listOf("a", "b", "c").joinToString(","))
    println("a,b,c".split(","))
    println(listOf(1, 2, 3).count { it == 1 })
}


// ============================================================
// 18. Inspect / debug
//   LS: planned (Future). Kotlin: data classes auto-generate readable
//   toString(); println uses it. `.also { println(it) }` for inline trace.
// ============================================================

data class Point(val x: Double, val y: Double)

fun section18() {
    val p = Point(1.0, 2.0)
    println(p)                                  // Point(x=1.0, y=2.0)
    println(p::class.simpleName)                // "Point"

    // Inline debug trace via .also.
    val r = listOf(1, 2, 3)
        .also { println("before map: $it") }
        .map { it * 2 }
        .also { println("after map:  $it") }
        .sum()
    println(r)
}


// ============================================================
// 19. Beyond Lucky Script — Kotlin gems
//   LS: not planned.
// ============================================================

// --- Scope functions: let / run / also / apply / with ---
// Five small higher-order functions that change WHAT `this`/`it` is
// and WHAT is returned. Tiny but produce a distinctive style of code.

class User(var name: String, var age: Int)

fun scopeFunctionsDemo() {
    val u = User("anon", 0)

    // .let { it -> ... } : it = receiver, returns lambda result.
    val nameLen = u.let { it.name.length }

    // .also { it -> ... } : it = receiver, returns receiver (side-effect).
    val u2 = u.also { println("logging: ${it.name}") }

    // .apply { ... } : this = receiver, returns receiver (config block).
    val u3 = User("anon", 0).apply {
        name = "Alice"
        age = 30
    }

    // .run { ... } : this = receiver, returns lambda result.
    val len = "hello".run { length * 2 }

    // with(x) { ... } : same as run but called as a function.
    val info = with(u) { "$name aged $age" }
}


// --- Data classes: structural records with equals/hashCode/copy/toString ---
// Three lines do the work of dozens in Java.

data class Person(val name: String, val age: Int)

fun dataClassesDemo() {
    val a = Person("Alice", 30)
    val b = a.copy(age = 31)         // copy with modifications
    val (name, age) = a              // destructuring
    println(a == Person("Alice", 30)) // true — structural equality
}


// --- Sealed classes & sealed interfaces: closed hierarchies = ADTs ---
// (Sealed Shape is already defined in §15 — that's the canonical use.)

sealed interface Tree<out T>
data class Leaf<T>(val value: T) : Tree<T>
data class Node<T>(val left: Tree<T>, val right: Tree<T>) : Tree<T>

fun <T> size(t: Tree<T>): Int = when (t) {
    is Leaf -> 1
    is Node -> size(t.left) + size(t.right)
}


// --- Extension functions: add methods to existing types from outside ---
// LS could borrow this for dot-method calls without exhaustive intrinsics.

fun String.shout(): String = this.uppercase() + "!"
fun List<Int>.sumOfSquares(): Int = this.sumOf { it * it }

fun extensionsDemo() {
    println("hello".shout())
    println(listOf(1, 2, 3).sumOfSquares())
}


// --- Smart casts: the compiler narrows types after `is` checks ---

fun smartCastsDemo(x: Any) {
    if (x is String) {
        // Inside this block, x is treated as String.
        println(x.uppercase())
    }
}


// --- Coroutines (mentioned, not demoed in depth): structured concurrency ---
// `suspend fun` declares an async-capable function; `launch`/`async` start
// coroutines; `runBlocking` is the bridge from blocking code. Skipped
// in detail — see kotlinx.coroutines.
