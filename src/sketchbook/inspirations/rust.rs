// ============================================================
// Lucky Script Inspirations — Rust
// ============================================================
// Assumed: Rust 1.78+.
// See ../roadmap.md for Lucky Script's feature roadmap.
//
// Rust isn't LS-shaped — it's a systems language with ownership and
// strict types. Skip the ownership stuff when reading: the relevant
// design ideas for LS are (1) expression-orientation (everything is
// an expression), (2) exhaustive `match`, (3) `Option<T>` / `Result<T, E>`
// instead of null + exceptions, (4) the `?` operator for short-circuit
// error propagation, and (5) iterator chains.
//
// This file uses #![allow(...)] to silence dead-code and unused-var
// warnings since each section is meant as a standalone read.
//
// Sections:
//   01. Comments & program structure
//   02. Variables & assignment (let / let mut)
//   03. Numbers, booleans, Option (no null)
//   04. Strings (&str vs String)
//   05. Operators
//   06. if / else (expression-form is standard)
//   07. loop / while / break-with-value, no continue-if
//   08. for-each (over iterators)
//   09. Functions, no defaults, no kwargs
//   10. Closures (LS arrow shorthand cousin)
//   11. Iterator chains (Rust's "pipeline")
//   12. Vec & arrays
//   13. HashMap
//   14. HashSet
//   15. Pattern matching (exhaustive `match`)
//   16. Error handling: Result, `?`, panic
//   17. Methods on types (impl blocks)
//   18. Inspect / debug ({:?}, dbg!)
//   19. Beyond LS: ownership snapshot, traits, macros, iterator superpowers

#![allow(dead_code, unused_variables, unused_mut, unused_assignments, clippy::all)]

use std::collections::{HashMap, HashSet};
use std::fmt;


// ============================================================
// 01. Comments & program structure
//   LS: shipped (# comments). Rust: //, /* */, /// (doc), //! (inner doc).
// ============================================================

// Line comments use //.
/* Block comments. Can nest /* ! */ unlike most languages. */
/// Doc comment for the item below. Markdown-formatted; feeds `rustdoc`.
fn _documented() {}


// ============================================================
// 02. Variables & assignment (let / let mut)
//   LS: shipped. Rust: `let` is IMMUTABLE by default; `let mut`
//   opts into mutation. Variables can be *shadowed* (a new binding
//   with the same name) — handy for refining a value through stages.
// ============================================================

fn section02() {
    let x = 10;
    // x = 20;             // error: immutable
    let mut y = 10;
    y = 20;                // ok
    y += 5;
    y *= 2;

    // Shadowing — a NEW `x`, can change type.
    let x = "hello";
    let x = x.len();
    let x = x as i32;

    // Parallel binding via tuple destructure.
    let (a, b) = (1, 2);
    let (mut p, mut q) = (1, 2);
    let tmp = p; p = q; q = tmp;     // swap; or use std::mem::swap(&mut p, &mut q).
}


// ============================================================
// 03. Numbers, booleans, Option (no null)
//   LS: shipped. Rust has NO null. Absence is encoded as
//   `Option<T> = Some(T) | None`. The single most LS-relevant idea.
// ============================================================

fn section03() {
    let n: i64 = 1_000_000;            // underscores allowed
    let pi: f64 = 3.14159;
    let big: u128 = 1u128 << 120;
    let t: bool = true;

    // Optional value — must handle both arms.
    let maybe_name: Option<String> = Some(String::from("Alice"));
    let name_len = maybe_name.as_ref().map(|s| s.len()).unwrap_or(0);

    // `if let` is the "destructure a single variant" sugar.
    if let Some(name) = &maybe_name {
        println!("hello, {}", name);
    }
}


// ============================================================
// 04. Strings (&str vs String)
//   LS: shipped. Rust distinguishes &str (borrowed view) and String
//   (owned, growable). Both are UTF-8. f-strings planned for LS (Later);
//   Rust has format!/println!/write! with the same `{}` placeholders.
// ============================================================

fn section04() {
    let greeting: &str = "hello";       // string slice — borrowed
    let name: String = String::from("world");
    println!("{} {}", greeting, name);
    println!("say \"hi\"");
    println!("line1\nline2");

    // format! is the "f-string": returns a String. {var} captures locals.
    let msg = format!("hello {name}, you are {}", 30);
    println!("{msg}");

    // Raw string literal — no escape interpretation.
    let raw = r"raw: \n is literal";
    let raw_multi = r#"can contain "quotes""#;

    // Multi-line strings: just a regular literal with newlines.
    let multi = "
  line 1
  line 2
";
}


// ============================================================
// 05. Operators
//   LS: shipped (+/-*//**, comparison, boolean). Modulo `%` planned (Later).
//   Rust: no `**` (use .pow for ints, .powi/.powf for floats).
// ============================================================

fn section05() {
    println!("{}", 1 + 2 * 3i32.pow(2));
    println!("{}", 10 % 3);
    println!("{}", 10 / 3);             // integer division between ints
    println!("{}", 10.0 / 3.0);         // float division between floats

    println!("{}", true && false);
    println!("{}", true || false);
    println!("{}", !true);
}


// ============================================================
// 06. if / else (expression-form is standard)
//   LS: shipped (statement). if-expression planned (Next) — Rust's
//   `if` IS an expression; both arms must have the same type.
// ============================================================

fn classify(value: i32) -> i32 {
    if value < 0 {
        -1
    } else if value == 0 {
        0
    } else {
        1
    }
}

fn abs_value(x: i32) -> i32 {
    if x < 0 { -x } else { x }
}


// ============================================================
// 07. loop / while / break-with-value, no continue-if
//   LS: shipped (while/break/continue). Rust has THREE loops:
//     - `loop { }` — infinite, `break value` returns a value.
//     - `while cond { }` — like LS.
//     - `for x in iter { }` — for-each (§08).
//   Guard-if planned for LS (Later) — Rust has no postfix `if`,
//   but `break`/`continue` with labels is rich.
// ============================================================

fn section07() {
    let mut i = 0;
    while i < 10 {
        i += 1;
        if i == 3 { continue; }
        if i == 7 { break; }
        println!("{i}");
    }

    // `loop` + `break value` — the only "expression loop".
    let found: i32 = loop {
        i += 1;
        if i > 100 { break i; }
    };

    // Labeled break/continue.
    'outer: for r in 0..3 {
        for c in 0..3 {
            if r == 1 && c == 1 { break 'outer; }
        }
    }
}


// ============================================================
// 08. for-each (over iterators)
//   LS: planned (Next). Rust's `for x in iter` works on anything
//   implementing IntoIterator. There's no C-style `for` at all.
// ============================================================

fn section08() {
    let mut total = 0;
    for item in [10, 20, 30] {
        total += item;
    }

    // enumerate gives (index, value).
    for (i, item) in ["a", "b", "c"].iter().enumerate() {
        println!("{i}: {item}");
    }

    // Numeric ranges.
    for i in 0..5 { println!("{i}"); }
    for i in (0..10).step_by(2) { println!("{i}"); }
}


// ============================================================
// 09. Functions, no defaults, no kwargs
//   LS: shipped (functions, closures). Defaults & kwargs planned (Later) —
//   Rust has NEITHER. The idiomatic substitute is the builder pattern
//   or struct-with-defaults via `..Default::default()`.
// ============================================================

fn add(a: i32, b: i32) -> i32 {
    a + b
}

// "Default args" via a config struct + Default impl.
#[derive(Default)]
struct ConnectOpts {
    port: Option<u16>,
    secure: bool,
}

fn connect(host: &str, opts: ConnectOpts) {
    let port = opts.port.unwrap_or(80);
    println!("{host}:{port} secure={}", opts.secure);
}

fn section09() {
    connect("example.com", ConnectOpts::default());
    connect("example.com", ConnectOpts { secure: true, ..Default::default() });
}

// Closures (named to make them readable as functions).
fn make_counter() -> impl FnMut() -> i32 {
    let mut count = 0;
    move || {
        count += 1;
        count
    }
}


// ============================================================
// 10. Closures (LS arrow shorthand cousin)
//   LS: shipped (full-form). Arrow shorthand `x -> x*2` planned (Next) —
//   Rust closures: `|x| x * 2`. Same idea, different brackets.
// ============================================================

fn section10() {
    let double = |x: i32| x * 2;
    let add_xy = |x, y| x + y;
    let const_fn = || 42;

    // Multi-statement closure with braces and an explicit final expression.
    let fib = |n: i32| -> i32 {
        if n < 2 { return n; }
        n - 1   // (placeholder; real fib needs a non-recursive form for closures)
    };
}


// ============================================================
// 11. Iterator chains (Rust's "pipeline")
//   LS: HOFs work today. Pipeline `|>` planned (Next) — Rust has no `|>`
//   but iterator chains read as one.
// ============================================================

fn section11() {
    let nums = vec![1, 2, 3, 4, 5];

    let doubled: Vec<i32> = nums.iter().map(|v| v * 2).collect();
    let positives: Vec<&i32> = nums.iter().filter(|&&v| v > 2).collect();
    let total: i32 = nums.iter().sum();

    // The chain.
    let result: i32 = nums
        .iter()
        .filter(|&&v| v > 0)
        .map(|v| v * 2)
        .sum();
    println!("{result}");
}


// ============================================================
// 12. Vec & arrays
//   LS: planned (Next). Rust distinguishes:
//     - [T; N] : fixed-size array (stack)
//     - Vec<T> : growable vector (heap)
//     - &[T]   : slice (borrowed view into either)
// ============================================================

fn section12() {
    let nums: Vec<i32> = vec![1, 2, 3, 4, 5];
    println!("{}", nums[0]);
    println!("{}", nums[nums.len() - 1]);
    println!("{:?}", &nums[1..4]);          // slice

    let mut owned: Vec<i32> = vec![1, 2, 3];
    owned.push(4);
    owned[0] = 100;
    println!("{}", owned.len());

    let fixed: [i32; 3] = [1, 2, 3];        // fixed-size array
}


// ============================================================
// 13. HashMap
//   LS: planned (Next). Rust: HashMap<K, V>. `.get` returns Option<&V>,
//   so missing-vs-present is type-encoded. `entry` API is the
//   "get-or-insert" pattern done well.
// ============================================================

fn section13() {
    let mut person: HashMap<&str, &str> = HashMap::new();
    person.insert("name", "Alice");
    person.insert("age", "30");

    if let Some(name) = person.get("name") {
        println!("name = {name}");
    }

    // entry API.
    *person.entry("role").or_insert("guest") = "admin";

    person.remove("role");
    println!("{}", person.len());
}


// ============================================================
// 14. HashSet
//   LS: planned (Later). Rust: HashSet<T>; no literal — use HashSet::from.
// ============================================================

fn section14() {
    let mut primes: HashSet<i32> = HashSet::from([2, 3, 5, 7]);
    primes.insert(11);
    println!("{}", primes.contains(&2));
    primes.remove(&3);
    println!("{}", primes.len());
}


// ============================================================
// 15. Pattern matching (exhaustive `match`)
//   LS: planned (Next). Rust's `match` is exhaustive — the compiler
//   refuses to compile if you miss a variant. This is the most rigorous
//   pattern-matching in the set after Haskell.
// ============================================================

enum Shape {
    Circle { radius: f64 },
    Square { side: f64 },
    Rect { w: f64, h: f64 },
}

fn area(s: &Shape) -> f64 {
    match s {
        Shape::Circle { radius } => std::f64::consts::PI * radius * radius,
        Shape::Square { side } => side * side,
        Shape::Rect { w, h } => w * h,
    }
}

fn describe(value: &serde_json::Value) -> String {
    // (omitted — using a contrived example without external crates)
    String::from("see below")
}

// A simpler example using std types.
fn describe_simple(value: i32, list: &[i32]) -> String {
    match (value, list) {
        (0, _) => String::from("zero"),
        (n, _) if n < 0 => String::from("negative"),
        (_, []) => String::from("empty list"),
        (_, [x]) => format!("one: {x}"),
        (_, [x, rest @ ..]) => format!("first {x}, then {} more", rest.len()),
    }
}

// Destructuring in `let`.
fn section15() {
    let (a, b, c) = (1, 2, 3);
    let [head, ..] = [1, 2, 3, 4];

    let p = Shape::Circle { radius: 5.0 };
    if let Shape::Circle { radius } = p {
        println!("radius = {radius}");
    }
}


// ============================================================
// 16. Error handling: Result, `?`, panic
//   LS: planned (Later) — try/catch. Rust: NO exceptions in normal flow.
//   `Result<T, E> = Ok(T) | Err(E)`. The `?` operator early-returns the
//   error — that's effectively LS's planned guard-if specialized to errors.
// ============================================================

#[derive(Debug)]
struct AppError(String);

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "AppError({})", self.0)
    }
}

fn parse_id(s: &str) -> Result<u32, AppError> {
    s.parse::<u32>().map_err(|e| AppError(format!("bad id: {e}")))
}

fn find_user(id_str: &str) -> Result<String, AppError> {
    let id = parse_id(id_str)?;          // `?` short-circuits on Err
    if id == 0 {
        return Err(AppError(String::from("no user 0")));
    }
    Ok(format!("user_{id}"))
}

fn section16() {
    match find_user("42") {
        Ok(name) => println!("ok: {name}"),
        Err(e) => println!("err: {e}"),
    }

    // `panic!` is for unrecoverable bugs — closest analog to "throw".
    // panic!("unreachable: this should never happen");
}


// ============================================================
// 17. Methods on types (impl blocks)
//   LS: planned (Later). Rust: a type's methods live in `impl` blocks;
//   `self`, `&self`, `&mut self` express ownership intent.
// ============================================================

struct Point { x: f64, y: f64 }

impl Point {
    // Associated function — called as `Point::origin()`.
    fn origin() -> Self {
        Point { x: 0.0, y: 0.0 }
    }

    // Method — called as `p.distance_to(&q)`.
    fn distance_to(&self, other: &Point) -> f64 {
        ((self.x - other.x).powi(2) + (self.y - other.y).powi(2)).sqrt()
    }

    // Mutating method — `&mut self`.
    fn translate(&mut self, dx: f64, dy: f64) {
        self.x += dx;
        self.y += dy;
    }
}

fn section17() {
    let mut p = Point::origin();
    let q = Point { x: 3.0, y: 4.0 };
    println!("{}", p.distance_to(&q));     // 5.0
    p.translate(1.0, 1.0);

    // Builtin methods on collections.
    println!("{}", "hello".to_uppercase());
    println!("{:?}", "a,b,c".split(',').collect::<Vec<_>>());
    println!("{}", vec![1, 2, 3].iter().sum::<i32>());
}


// ============================================================
// 18. Inspect / debug ({:?}, dbg!)
//   LS: planned (Future). Rust: `Debug` trait + `{:?}` formatter
//   gives readable dumps; `dbg!(expr)` PRINTS AND RETURNS its argument —
//   identical in spirit to Elixir's IO.inspect.
// ============================================================

fn section18() {
    let xs = vec![1, 2, 3];
    println!("{xs:?}");                   // [1, 2, 3]
    println!("{xs:#?}");                  // pretty-printed
    let _ = dbg!(xs.iter().sum::<i32>()); // prints "[file:line] xs.iter().sum::<i32>() = 6"
}


// ============================================================
// 19. Beyond Lucky Script — Rust gems
//   LS: not planned.
// ============================================================

// --- Ownership at a glance (skip the rules; note the IDEAS) ---
// Each value has a single OWNER. Passing it MOVES ownership unless you
// pass a reference (&) or it's `Copy`. The compiler enforces no
// aliased mutation. LS won't borrow this directly, but understanding
// "moves vs borrows" frames why Rust has no GC and no null.

fn ownership_demo() {
    let s = String::from("hello");
    let t = s;                       // MOVE: s is no longer valid.
    // println!("{s}");              // error: value used after move
    println!("{t}");

    let s = String::from("hello");
    let t = &s;                       // BORROW: s still valid.
    println!("{s} {t}");
}


// --- Traits: typeclass-like polymorphism, plus operator overloading ---
// A trait declares methods; types `impl Trait for Type` to satisfy it.
// Generic functions take `T: Trait` constraints.

trait Shoutable {
    fn shout(&self) -> String;
}

impl Shoutable for String {
    fn shout(&self) -> String {
        self.to_uppercase() + "!"
    }
}

impl Shoutable for i32 {
    fn shout(&self) -> String {
        format!("Number: {self}!")
    }
}

fn shout_anything<T: Shoutable>(x: T) -> String {
    x.shout()
}

fn traits_demo() {
    println!("{}", shout_anything(String::from("hello")));
    println!("{}", shout_anything(42));
}


// --- Macros: declarative metaprogramming (macro_rules!) ---
// Macros take token trees and produce token trees at compile time.
// `println!`, `vec!`, `dbg!` are all macros. The `!` syntax denotes them.

macro_rules! say_hi {
    () => {
        println!("hi");
    };
    ($name:expr) => {
        println!("hi, {}", $name);
    };
}

fn macros_demo() {
    say_hi!();
    say_hi!("Alice");

    let v: Vec<i32> = vec![1, 2, 3];
    let _ = dbg!(v.len());
}


// --- Iterator superpowers: lazy, zero-cost abstractions ---
// Iterators chain without intermediate allocations. The Iterator trait
// has DOZENS of methods (map, filter, fold, scan, zip, chain, take_while...).
// All compile down to tight loops.

fn iterator_powers() {
    // Lazy: nothing runs until `collect`/`sum`/etc. forces it.
    let big: Vec<i32> = (1..)
        .filter(|n| n % 2 == 0)
        .map(|n| n * n)
        .take(5)
        .collect();
    println!("{big:?}");       // [4, 16, 36, 64, 100]

    // fold = reduce.
    let sum: i32 = (1..=10).fold(0, |acc, x| acc + x);
    println!("{sum}");          // 55
}


// ============================================================
// main — minimal driver so the file is a valid Rust program.
// ============================================================

// Tiny stub for the describe example that referenced serde_json (skipped).
mod serde_json { pub struct Value; }

fn main() {
    println!("Lucky Script Inspirations — Rust");
    section02();
    section03();
    section04();
    section05();
    section07();
    section08();
    section09();
    section10();
    section11();
    section12();
    section13();
    section14();
    section15();
    section16();
    section17();
    section18();
    println!("{}", classify(5));
    println!("{}", abs_value(-7));
    println!("{}", area(&Shape::Circle { radius: 2.0 }));
    println!("{}", describe_simple(3, &[1, 2, 3, 4]));
    ownership_demo();
    traits_demo();
    macros_demo();
    iterator_powers();
    let mut c = make_counter();
    println!("{} {}", c(), c());
}
