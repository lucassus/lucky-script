// ============================================================
// Lucky Script Inspirations — JavaScript
// ============================================================
// Assumed: Node 22+, ES2024.
// See ../roadmap.md for Lucky Script's feature roadmap.
//
// This file uses CommonJS (no top-level import/export) so it parses
// with `node --check` without a package.json "type":"module". ESM
// syntax is demonstrated in §19 commentary.
//
// Sections:
//   01. Comments & program structure
//   02. Variables & assignment
//   03. Numbers, booleans, null/undefined
//   04. Strings
//   05. Operators
//   06. if / else if / else
//   07. while, break, continue, label
//   08. for-each
//   09. Functions, closures, default & rest args
//   10. Arrow functions (LS's planned shorthand reference)
//   11. Higher-order functions & method chains
//   12. Arrays
//   13. Objects & Maps
//   14. Sets
//   15. Pattern matching & destructuring
//   16. Error handling
//   17. Methods on types (dot-call)
//   18. Inspect / debug
//   19. Beyond LS: async/await, generators, prototype chain, modules
// ============================================================


// ============================================================
// 01. Comments & program structure
//   LS: shipped (# comments). LS has no modules; JS uses ESM or CJS.
// ============================================================

// Line comments use //.
/* Block comments use /* ... */ — must not nest. */
/**
 * JSDoc comments document declarations. Tooling reads `@param`/`@returns`.
 */


// ============================================================
// 02. Variables & assignment
//   LS: shipped. Parallel multi-assignment planned (Later) — JS has
//   destructuring; comma-as-operator is not the same thing.
// ============================================================

// `let` is mutable, block-scoped. `const` is read-only, block-scoped.
// `var` is function-scoped (legacy; avoid in modern code).
let x = 10;
x = 20;
const PI = 3.14159;

x += 5;
x *= 2;

// Parallel binding via array destructuring. RHS fully evaluated first.
let [a, b] = [1, 2];
[a, b] = [b, a];                    // idiomatic swap

const [first, ...rest] = [1, 2, 3, 4];   // first=1, rest=[2, 3, 4]


// ============================================================
// 03. Numbers, booleans, null/undefined
//   LS: shipped. JS has TWO "nothings": `null` (intentional) and
//   `undefined` (uninitialized). LS gets to pick one — the right call.
// ============================================================

const n = 1_000_000;
const pi = 3.14159;
const big = 10n ** 100n;            // BigInt literal — separate type from Number

const t = true;
const f = false;
const nothing = null;
let notSet;                          // undefined

// `==` does type coercion (avoid); `===` is strict equality.
console.log(null == undefined);      // true  — surprise!
console.log(null === undefined);     // false — strict
console.log(0 == "");                // true  — coercion landmine

// Optional chaining `?.` and nullish coalescing `??`. These are JS's answer
// to the "what if it's null" question — LS has no equivalent planned.
const user = { profile: null };
console.log(user.profile?.name);     // undefined, no error
console.log(user.profile?.name ?? "guest");

// Truthiness: 0, "", null, undefined, NaN are falsy. Empty array [] is TRUTHY.


// ============================================================
// 04. Strings
//   LS: shipped (escapes, concat). f-strings planned (Later);
//   multiline planned (Future). JS has template literals — both at once.
// ============================================================

const greeting = "hello";
const name = "world";
console.log(greeting + " " + name);

console.log("say \"hi\"");
console.log("line1\nline2");

// Template literals: backticks, ${expr} for interpolation, multi-line built in.
console.log(`hello ${name}`);
console.log(`sum is ${1 + 2}`);
console.log(`
  line 1
  line 2
`);

// Tagged templates: a function processes the parts and interpolations.
const html = (strings, ...values) =>
  strings.reduce((acc, s, i) => acc + s + (values[i] ?? ""), "");
console.log(html`<b>${name}</b>`);


// ============================================================
// 05. Operators
//   LS: shipped (+/-*//**, comparison, boolean). Modulo `%` planned (Later).
// ============================================================

console.log(1 + 2 * 3 ** 2);
console.log(10 % 3);
console.log(10 / 3);                 // always float; JS has no integer type
console.log(Math.floor(10 / 3));     // explicit floor

// No chained comparisons.
console.log(1 < 2 && 2 <= 3);

console.log(true && false);
console.log(true || false);
console.log(!true);


// ============================================================
// 06. if / else if / else
//   LS: shipped (statement). if-expression planned (Next) — JS has the
//   ternary `cond ? x : y` but no full if-expression.
// ============================================================

function classify(value) {
  if (value < 0) {
    return -1;
  } else if (value === 0) {
    return 0;
  } else {
    return 1;
  }
}

const absValue = x < 0 ? -x : x;


// ============================================================
// 07. while, break, continue, label
//   LS: shipped (while/break/continue). Guard-if planned (Later) —
//   JS has no postfix `if`; explicit if+continue is the idiom.
// ============================================================

let i = 0;
while (i < 10) {
  i += 1;
  if (i === 3) continue;
  if (i === 7) break;
  console.log(i);
}

// `do { ... } while (cond)` runs the body at least once.
let j = 0;
do { j += 1; } while (j < 3);

// Labeled break/continue — useful for nested loops. LS doesn't plan this.
outer: for (let r = 0; r < 3; r += 1) {
  for (let c = 0; c < 3; c += 1) {
    if (r === 1 && c === 1) break outer;
  }
}


// ============================================================
// 08. for-each
//   LS: planned (Next). JS has THREE iteration forms; `for...of` is the
//   modern for-each.
// ============================================================

const nums = [1, 2, 3, 4, 5];

// `for...of` iterates values. This is the LS-style for-each.
let total = 0;
for (const item of [10, 20, 30]) {
  total += item;
}

// `for...in` iterates KEYS of an object — easy footgun for arrays.
const obj = { name: "Alice", age: 30 };
for (const key in obj) {
  console.log(key, obj[key]);
}

// `Array.prototype.forEach` — block-style, no break/continue.
nums.forEach((v, idx) => console.log(idx, v));


// ============================================================
// 09. Functions, closures, default & rest args
//   LS: shipped (functions, closures). Defaults planned (Later);
//   JS has no keyword args — you destructure an options object instead.
// ============================================================

function add(aa, bb) {
  return aa + bb;
}

function greet(person, greeting = "Hello") {
  console.log(`${greeting}, ${person}`);
}
greet("Alice");
greet("Alice", "Hi");

// Pseudo-kwargs via object destructuring with defaults — the JS idiom.
function connect({ host, port = 80, secure = false } = {}) {
  console.log(host, port, secure);
}
connect({ host: "example.com", secure: true });

// Rest parameters collect variadic positional args.
function sum(...vs) {
  return vs.reduce((acc, v) => acc + v, 0);
}

// Closures.
function makeCounter() {
  let count = 0;
  return function inc() {
    count += 1;
    return count;
  };
}
const counter = makeCounter();
console.log(counter(), counter());   // 1 2


// ============================================================
// 10. Arrow functions
//   LS: shipped (full-form `fun(x) x*2`). Arrow shorthand `x -> x*2`
//   planned (Next) — JS's `x => x * 2` is the closest sibling.
// ============================================================

const double = x => x * 2;
const addXY = (xx, yy) => xx + yy;
const constFn = () => 42;

// Multi-statement arrow needs braces and explicit `return`.
const fib = n => {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
};

// LS chose `->` (no `=`); JS uses `=>`. Different bindings of `this`:
// arrow inherits enclosing `this`, function defines its own.


// ============================================================
// 11. Higher-order functions & method chains
//   LS: HOFs work today via lambdas. Pipeline `|>` planned (Next) —
//   JS chains methods on Array prototype; no `|>` yet (TC39 proposal).
// ============================================================

const doubled = nums.map(v => v * 2);
const positives = nums.filter(v => v > 2);
const total2 = nums.reduce((acc, v) => acc + v, 0);

const result = nums
  .filter(v => v > 0)
  .map(v => v * 2)
  .reduce((acc, v) => acc + v, 0);
console.log(result);


// ============================================================
// 12. Arrays
//   LS: planned (Next). JS arrays are dynamic, indexed from 0, mixed-type.
// ============================================================

const arr = [1, 2, 3, 4, 5];
console.log(arr[0]);
console.log(arr.at(-1));            // negative indexing via .at()
console.log(arr.slice(1, 4));       // non-mutating slice
arr.push(6);
arr[0] = 100;
console.log(arr.length);


// ============================================================
// 13. Objects & Maps
//   LS: planned (Next). JS has two dict-like things:
//     - object literal {} — keys are strings/symbols, prototype-linked.
//     - Map — true key/value, any key type, preserves insertion order.
// ============================================================

const person = { name: "Alice", age: 30 };
console.log(person.name);
console.log(person["name"]);
person.role = "admin";
delete person.role;

// Computed keys.
const key = "x";
const obj2 = { [key]: 1 };

// Map — preferred when keys aren't string-y.
const m = new Map();
m.set("name", "Alice");
m.set(42, "answer");
console.log(m.get("name"));
console.log(m.size);


// ============================================================
// 14. Sets
//   LS: planned (Later). JS Set has no literal — design lesson.
// ============================================================

const primes = new Set([2, 3, 5, 7]);
primes.add(11);
console.log(primes.has(2));
console.log(primes.size);


// ============================================================
// 15. Pattern matching & destructuring
//   LS: planned (Next). JS has destructuring everywhere but NO match
//   statement (TC39 proposal pending). Use switch + early return.
// ============================================================

function describe(value) {
  if (value === 0) return "zero";
  if (typeof value === "number" && value < 0) return "negative";
  if (Array.isArray(value)) {
    if (value.length === 0) return "empty";
    if (value.length === 1) return `one: ${value[0]}`;
    const [head, ...tail] = value;
    return `first ${head}, then ${tail.length} more`;
  }
  if (value && typeof value === "object" && "name" in value) {
    return `named ${value.name}`;
  }
  return "other";
}

// Destructuring in assignment.
const [aa, bb, cc] = [1, 2, 3];
const { name: personName, age } = { name: "Alice", age: 30 };
const { x: xx = 0, y: yy = 0 } = { x: 5 };

// Destructuring in function parameters — JS's "keyword arg" idiom.
function greet2({ name, greeting = "Hello" }) {
  console.log(`${greeting}, ${name}`);
}


// ============================================================
// 16. Error handling
//   LS: planned (Later) — try/catch. JS: try/catch/finally; only one catch
//   per try, so you `instanceof`-dispatch inside it.
// ============================================================

try {
  const r = nums[99];
  if (r === undefined) throw new RangeError("out of bounds");
} catch (e) {
  if (e instanceof RangeError) {
    console.log(`range: ${e.message}`);
  } else if (e instanceof TypeError) {
    console.log("type");
  } else {
    console.log("other");
  }
} finally {
  console.log("always runs");
}

class AppError extends Error {
  constructor(message) {
    super(message);
    this.name = "AppError";
  }
}

function mustBePositive(value) {
  if (value < 0) throw new AppError(`negative: ${value}`);
  return value;
}


// ============================================================
// 17. Methods on types (dot-call)
//   LS: planned (Later). JS objects are method-rich via prototypes.
// ============================================================

console.log("hello".toUpperCase());
console.log("hello".replaceAll("l", "L"));
console.log("  pad  ".trim());
console.log(["a", "b", "c"].join(","));
console.log("a,b,c".split(","));
console.log([1, 2, 3].includes(2));
console.log(Object.entries({ a: 1 }));


// ============================================================
// 18. Inspect / debug
//   LS: planned (Future). JS: console.log auto-formats; util.inspect for depth.
// ============================================================

const xx = [1, 2, 3];
console.log(xx);
console.log(JSON.stringify(xx));
console.log(typeof xx);              // 'object'
console.log(xx.constructor.name);    // 'Array'
console.dir(xx, { depth: 3 });
// `debugger;` triggers the debugger when devtools are attached.


// ============================================================
// 19. Beyond Lucky Script — JavaScript gems
//   LS: not planned.
// ============================================================

// --- async / await: structured concurrency over Promises ---
// `async fn` returns a Promise. `await p` suspends until `p` resolves.
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  await delay(10);
  const a1 = await Promise.resolve(1);
  const a2 = await Promise.resolve(2);
  return a1 + a2;
}

// Run concurrent work with Promise.all.
async function parallel() {
  const [r1, r2] = await Promise.all([
    Promise.resolve(1),
    Promise.resolve(2),
  ]);
  return r1 + r2;
}

void main;
void parallel;


// --- Generators: lazy iterators via function* and yield ---
function* fibGen() {
  let a = 0, b = 1;
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

const take = (it, n) => {
  const out = [];
  for (const v of it) {
    if (out.length >= n) break;
    out.push(v);
  }
  return out;
};
console.log(take(fibGen(), 10));

// async generators combine the two: `async function* () { yield await ...; }`.


// --- Prototype chain & classes ---
// Classes are sugar over prototype linking.
class Point {
  #internal = "private field with #";
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  distanceTo(other) {
    return Math.hypot(this.x - other.x, this.y - other.y);
  }
  static origin() {
    return new Point(0, 0);
  }
}

class ColorPoint extends Point {
  constructor(x, y, color) {
    super(x, y);
    this.color = color;
  }
}

const p = new ColorPoint(1, 2, "red");
console.log(p.distanceTo(Point.origin()));
console.log(Object.getPrototypeOf(p) === ColorPoint.prototype);


// --- Modules: ESM syntax (commented because this file is CJS) ---
// In a `.mjs` file or with package.json "type":"module":
//   import { add } from "./math.js";
//   import * as Math from "./math.js";
//   import math from "./math.js";   // default import
//   export function add(a, b) { return a + b; }
//   export default class App { }
//   export { add as plus };
// Top-level await is allowed in ESM only.


// --- Iterators protocol: any object with [Symbol.iterator]() is iterable ---
const counter2 = {
  [Symbol.iterator]() {
    let n = 0;
    return {
      next() {
        n += 1;
        return n > 3 ? { done: true } : { value: n, done: false };
      },
    };
  },
};
for (const v of counter2) console.log(v);
