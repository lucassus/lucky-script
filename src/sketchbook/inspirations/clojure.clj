;; ============================================================
;; Lucky Script Inspirations — Clojure
;; ============================================================
;; Assumed: Clojure 1.12+.
;; See ../roadmap.md for Lucky Script's feature roadmap.
;;
;; Clojure is structurally the most-different language in this set:
;; a Lisp on the JVM. Parentheses everywhere, code is data (homoiconic),
;; macros are first-class. Despite the alien surface syntax, several
;; design lessons are LS-relevant:
;;
;;   1. Threading macros `->` and `->>`: two flavors of pipeline that
;;      differ in WHERE the value is inserted (first arg vs last arg).
;;      LS's roadmap picked the "first arg" flavor — Clojure shows why
;;      a second variant might be wanted.
;;   2. Persistent (immutable) data structures by default with O(log32)
;;      structural sharing.
;;   3. Macros + homoiconicity: language extension as a first-class power.
;;   4. State management via atoms/refs/agents — explicit and contained.
;;
;; Comments are `;;` (or `;`); the rest is s-expressions: `(operator arg1 arg2 ...)`.
;;
;; Sections:
;;   01. Comments & program structure
;;   02. Variables & assignment (let / def — immutable bindings)
;;   03. Numbers, booleans, nil
;;   04. Strings
;;   05. Operators (all are functions)
;;   06. if / cond / when / when-not
;;   07. while-style: there isn't one — recursion + loop/recur
;;   08. for-each (doseq)
;;   09. Functions (defn)
;;   10. Anonymous functions: fn and #() shorthand
;;   11. Pipelines — Clojure's two threading macros
;;   12. Lists, vectors, sequences
;;   13. Maps
;;   14. Sets
;;   15. Pattern matching (limited — uses core.match or case/cond)
;;   16. Error handling (try/catch + ex-info)
;;   17. "Methods on types" — protocols + dispatch
;;   18. Inspect / debug (prn, println, tap>)
;;   19. Beyond LS: macros, persistent data, atoms/refs, transducers

(ns inspirations.clojure
  "Lucky Script inspirations file — see /roadmap.md.")


;; ============================================================
;; 01. Comments & program structure
;;   LS: shipped (# comments). Clojure: `;`/`;;`/`;;;` (count = level).
;;   `#_` discards the next form (sometimes called "form comment").
;; ============================================================

;; Line comment.
;;; Section-level comment (conventional).
;; #_(this-form-is-skipped 1 2 3)
;; (comment ...) at the top level is also idiomatic — see below.


;; ============================================================
;; 02. Variables & assignment (let / def — immutable bindings)
;;   LS: shipped (mutable). Clojure: bindings are IMMUTABLE. `def` creates
;;   a top-level var; `let` creates lexical bindings inside an expression.
;;   No rebinding — for state, use atoms/refs (see §19).
;; ============================================================

(def pi 3.14159)
(def greeting "hello")

(defn section02 []
  (let [x 10
        y (+ x 5)
        z (* y 2)
        ;; Destructuring in let — vector pattern.
        [a b c] [1 2 3]
        ;; Map destructuring — :keys shorthand.
        {:keys [name age]} {:name "Alice" :age 30}]
    [x y z a b c name age]))


;; ============================================================
;; 03. Numbers, booleans, nil
;;   LS: shipped. Clojure: arbitrary-precision integers by default
;;   (with auto-promote on overflow). `nil` is the nothing.
;; ============================================================

(defn section03 []
  (let [n 1000000        ;; Clojure has no _ digit separator (use 1e6 for shorthand)
        pi 3.14159
        big (Math/pow 2 100)
        ratio 1/3        ;; Clojure has rational literals!
        t true
        f false
        nada nil]
    [n pi big ratio t f nada]))

;; Only `nil` and `false` are falsy. 0, "", [], {}, #{} are all truthy.


;; ============================================================
;; 04. Strings
;;   LS: shipped (escapes, concat). f-strings planned (Later). Clojure:
;;   `str` concatenates anything; `format` is C-printf style.
;; ============================================================

(defn section04 []
  (let [greeting "hello"
        name "world"]
    (println (str greeting " " name))
    (println "say \"hi\"")
    (println "line1\nline2")
    (println (format "hello %s, you are %d" name 30))
    ;; No native interpolation. Libraries like clojure.core/format or
    ;; cuerdas/format-str are the idiom.
    (println (str "hello " name))))


;; ============================================================
;; 05. Operators (all are functions)
;;   LS: shipped. In Clojure, "operators" are just regular functions:
;;   `(+ 1 2)`, `(< 1 2)`, `(and a b)`. Prefix notation, n-ary by default.
;; ============================================================

(defn section05 []
  [(+ 1 (* 2 (Math/pow 3 2)))   ;; ≈ 19.0
   (mod 10 3)                    ;; modulo as a function
   (quot 10 3)                   ;; integer division
   (/ 10 3)                      ;; rational result: 10/3
   (and true false)
   (or true false)
   (not true)
   (= 1 1)                       ;; equality
   (< 1 2 3)])                   ;; chained comparisons! (1 < 2 < 3)


;; ============================================================
;; 06. if / cond / when / when-not
;;   LS: shipped (statement). if-expression planned (Next) — Clojure's
;;   `if` IS an expression. `cond` for multi-way; `when` is `if` without
;;   `else` (used for side-effects).
;; ============================================================

(defn classify [value]
  (cond
    (neg? value) -1
    (zero? value) 0
    :else 1))

(defn abs-value [x]
  (if (neg? x) (- x) x))

;; `when` runs body only when cond is truthy; returns nil otherwise.
;; Idiomatic for side-effect-only branches.
(defn maybe-log [debug? msg]
  (when debug? (println msg)))


;; ============================================================
;; 07. while-style: there isn't one — recursion + loop/recur
;;   LS: shipped (while/break/continue). Clojure has `while` for side
;;   effects (no break/continue, no return value) and `loop`/`recur`
;;   for tail-recursive iteration. Idiomatic Clojure prefers reduce.
;; ============================================================

(defn section07 []
  ;; loop/recur — explicit tail call.
  (loop [i 0
         acc []]
    (if (>= i 5)
      acc
      (recur (inc i) (conj acc i)))))

;; `while` is side-effects only.
(defn count-up [n]
  (let [counter (atom 0)]
    (while (< @counter n)
      (println @counter)
      (swap! counter inc))))


;; ============================================================
;; 08. for-each (doseq)
;;   LS: planned (Next). Clojure: `doseq` is the side-effecting iterator;
;;   `for` is a list comprehension that BUILDS a sequence.
;; ============================================================

(defn section08 []
  ;; doseq — like Python's for: runs body for side effects.
  (doseq [item [10 20 30]]
    (println item))

  ;; doseq with index via map-indexed.
  (doseq [[i s] (map-indexed vector ["a" "b" "c"])]
    (println i s))

  ;; `for` is a comprehension, NOT a loop — it returns a lazy seq.
  (for [x [1 2 3]
        y [10 20]]
    [x y]))


;; ============================================================
;; 09. Functions (defn)
;;   LS: shipped. Defaults & kwargs planned (Later). Clojure has both:
;;   multi-arity functions cover "default args"; `:keys` destructuring +
;;   `& {:keys [...]}` covers "kwargs".
;; ============================================================

(defn add [a b] (+ a b))

;; Multi-arity: dispatch on argument count = de-facto default args.
(defn greet
  ([name] (greet name "Hello"))
  ([name greeting] (println (str greeting ", " name))))

;; Variadic with `& rest`.
(defn variadic [first & rest]
  [first rest])

;; "Keyword args" idiom: a single map argument, destructured.
(defn connect [{:keys [host port secure]
                :or {port 80 secure false}}]
  (println host port secure))

(defn section09 []
  (greet "Alice")
  (greet "Alice" "Hi")
  (connect {:host "example.com" :secure true})
  (variadic 1 2 3 4))


;; ============================================================
;; 10. Anonymous functions: fn and #() shorthand
;;   LS: shipped. Arrow shorthand `x -> x*2` planned (Next).
;;   Clojure has TWO anonymous-fn syntaxes:
;;     - `(fn [x] (* x 2))`    — full form, named-arg version
;;     - `#(* % 2)`            — reader macro, % is the first arg, %1/%2/...
;; ============================================================

(def double (fn [x] (* x 2)))
(def double2 #(* % 2))                  ;; same thing
(def add-xy #(+ %1 %2))
(def const-fn (constantly 42))


;; ============================================================
;; 11. Pipelines — Clojure's two threading macros
;;   LS: planned (Next) — pipeline. Clojure has TWO:
;;     `->`  inserts the value as the SECOND form's FIRST argument.
;;     `->>` inserts the value as the SECOND form's LAST argument.
;;   This split exists because some functions take "data first"
;;   (->) and others take "data last" (->>). LS's roadmap chose only
;;   `->` (first-arg) — worth knowing about the trade-off.
;; ============================================================

(defn section11 []
  ;; ->> — "data last" — works with seq fns like map/filter that take coll last.
  (->> [1 2 3 4 5]
       (filter pos?)
       (map #(* % 2))
       (reduce +))

  ;; -> — "data first" — works with map/keyword/method-call style.
  (-> {:name "Alice" :age 30}
      (assoc :role "admin")
      (update :age inc)
      :name))

;; `some->` short-circuits on nil; `cond->` applies steps conditionally.
;; These are macros LS could imagine for its own `|>`.


;; ============================================================
;; 12. Lists, vectors, sequences
;;   LS: planned (Next, vector-like). Clojure distinguishes:
;;     - list `(1 2 3)` or `(list 1 2 3)` — linked, O(1) front
;;     - vector `[1 2 3]` — indexed, O(log32) random access
;;     - lazy seq from `range`, `iterate`, `map`, etc.
;;   For LS-mapping purposes, vectors are the "lists" you want.
;; ============================================================

(defn section12 []
  (let [nums [1 2 3 4 5]
        head (first nums)
        tail (rest nums)
        last-el (last nums)
        prepended (cons 0 nums)
        appended (conj nums 6)        ;; conj on a vector appends; on a list prepends
        slice (subvec nums 1 4)]
    [head tail last-el prepended appended slice]))


;; ============================================================
;; 13. Maps
;;   LS: planned (Next). Clojure maps are persistent. Keyword keys
;;   (`:name`) are idiomatic and act as functions: `(:name person)`
;;   ≡ `(get person :name)`.
;; ============================================================

(defn section13 []
  (let [person {:name "Alice" :age 30}
        name1 (:name person)              ;; keyword-as-function
        name2 (get person :name)          ;; explicit get
        with-role (assoc person :role :admin)
        without-age (dissoc with-role :age)
        bumped (update person :age inc)]
    [name1 name2 with-role without-age bumped]))


;; ============================================================
;; 14. Sets
;;   LS: planned (Later). Clojure: literal `#{...}`. Sets ARE functions
;;   of their elements: `(primes 7)` returns 7 if 7 is in primes, nil otherwise.
;; ============================================================

(defn section14 []
  (let [primes #{2 3 5 7}
        more (conj primes 11)
        smaller (disj primes 3)
        member-check (primes 2)]          ;; sets are functions of their elements!
    [primes more smaller member-check]))


;; ============================================================
;; 15. Pattern matching (limited — uses core.match or case/cond)
;;   LS: planned (Next). Clojure has NO native pattern matching.
;;   `case` matches on equality only. `condp` allows custom predicates.
;;   The `core.match` library provides full pattern matching.
;; ============================================================

(defn describe [value]
  (cond
    (= value 0) "zero"
    (and (number? value) (neg? value)) "negative"
    (and (vector? value) (empty? value)) "empty"
    (and (vector? value) (= 1 (count value))) (str "one: " (first value))
    (vector? value) (str "first " (first value) ", then " (dec (count value)) " more")
    (and (map? value) (:name value)) (str "named " (:name value))
    :else "other"))

;; With core.match (commented — would require require):
;; (require '[clojure.core.match :refer [match]])
;; (defn describe-m [value]
;;   (match value
;;     0 "zero"
;;     (n :guard neg?) "negative"
;;     [] "empty"
;;     [x] (str "one: " x)
;;     [x & rest] (str "first " x ", then " (count rest) " more")
;;     {:name name} (str "named " name)
;;     :else "other"))


;; ============================================================
;; 16. Error handling (try/catch + ex-info)
;;   LS: planned (Later) — try/catch. Clojure: try/catch/finally,
;;   `ex-info` for structured errors with data attached.
;; ============================================================

(defn parse-id [s]
  (try
    (let [n (Long/parseLong s)]
      (when (neg? n)
        (throw (ex-info "negative not allowed"
                        {:type :bad-input :input s})))
      n)
    (catch NumberFormatException _
      (throw (ex-info "not a number" {:type :bad-input :input s})))))

(defn section16 []
  (try
    (parse-id "abc")
    (catch clojure.lang.ExceptionInfo e
      (let [data (ex-data e)]
        (println "caught:" (.getMessage e) data)))
    (finally
      (println "always runs"))))


;; ============================================================
;; 17. "Methods on types" — protocols + dispatch
;;   LS: planned (Later). Clojure has NO classes natively. `defprotocol`
;;   defines an abstract interface; `extend-protocol`/`extend-type`
;;   provides implementations. Multimethods (`defmulti`/`defmethod`)
;;   dispatch on a custom function — even more flexible.
;; ============================================================

(defprotocol Shoutable
  (shout [this]))

(extend-protocol Shoutable
  String
  (shout [s] (str (.toUpperCase s) "!"))

  Long
  (shout [n] (str "Number: " n "!"))

  clojure.lang.IPersistentVector
  (shout [v] (mapv shout v)))

(defn section17 []
  [(shout "hello")
   (shout 42)
   (shout ["hi" "yo"])])

;; Multimethods: dispatch by arbitrary function.
(defmulti area :shape)
(defmethod area :circle [s] (* Math/PI (:r s) (:r s)))
(defmethod area :square [s] (* (:side s) (:side s)))


;; ============================================================
;; 18. Inspect / debug (prn, println, tap>)
;;   LS: planned (Future). Clojure: `prn` prints data-readable form,
;;   `println` is human-readable, `tap>` posts to taps (REPL pipeline).
;; ============================================================

(defn section18 []
  (let [x [1 2 3]]
    (prn x)                         ;; [1 2 3]
    (println x)                     ;; [1 2 3]
    (println (type x))              ;; clojure.lang.PersistentVector
    ;; tap> is a side-effecting "trace" that can be subscribed-to from a REPL.
    (tap> {:where 'section18 :value x})
    x))


;; ============================================================
;; 19. Beyond Lucky Script — Clojure gems
;;   LS: not planned.
;; ============================================================

;; --- Macros & homoiconicity: code is data ---
;; Because Clojure code is literally a Clojure data structure, you can
;; write functions that take code and return code. `defmacro` defines
;; one. They run at COMPILE time and produce expressions.

(defmacro unless [cond & body]
  `(if (not ~cond) (do ~@body)))     ;; ~ unquotes, ~@ splices

;; Usage: (unless (zero? x) (println "nonzero"))
;; Expands to: (if (not (zero? x)) (do (println "nonzero")))

;; Macros can introduce NEW control flow keywords. LS's lambda-shorthand
;; `x -> x * 2` could be implemented as a macro in Clojure-land.


;; --- Persistent data structures + structural sharing ---
;; Every "modification" returns a NEW value sharing most of its memory
;; with the old. Operations are effectively O(log32 n). LS could borrow
;; this for the list/dict design.

(defn persistent-demo []
  (let [v1 [1 2 3 4 5]
        v2 (conj v1 6)              ;; v1 still [1 2 3 4 5], v2 is [1..6]
        v3 (assoc v1 0 100)         ;; v1 unchanged, v3 is [100 2 3 4 5]
        m1 {:a 1 :b 2}
        m2 (assoc m1 :c 3)]
    [v1 v2 v3 m1 m2]))


;; --- State management: atoms, refs, agents ---
;; Clojure isolates mutation into TYPED REFERENCE CELLS:
;;   atom  — synchronous, uncoordinated, retry on conflict (CAS)
;;   ref   — synchronous, coordinated (software transactional memory)
;;   agent — asynchronous, uncoordinated
;; The data inside is still immutable; only the cell can swap value.

(defn atoms-demo []
  (let [counter (atom 0)]
    (swap! counter inc)              ;; atomic CAS update
    (swap! counter + 10)
    (reset! counter 0)               ;; outright set
    @counter))                       ;; @ dereferences


;; --- Transducers: composable transformations independent of source ---
;; A transducer represents a transformation (map, filter, take, …) as
;; a value, decoupled from the input source. The SAME transducer works
;; over vectors, channels, streams, eduction.

(defn transducers-demo []
  (let [xf (comp
            (filter pos?)
            (map #(* % 2))
            (take 3))]
    [(into [] xf [-1 2 -3 4 5 6 7])      ;; into a vector
     (transduce xf + 0 [1 2 3 4 5 6])]))  ;; reduce with a transducer


;; ============================================================
;; -main — entry point. `clj -M -m inspirations.clojure`.
;; ============================================================

(defn -main [& _args]
  (println "Lucky Script Inspirations — Clojure")
  (prn (section02))
  (prn (section03))
  (section04)
  (prn (section05))
  (prn (section07))
  (section08)
  (section09)
  (prn (section11))
  (prn (section12))
  (prn (section13))
  (prn (section14))
  (prn (describe [1 2 3]))
  (section16)
  (prn (section17))
  (section18)
  (prn (persistent-demo))
  (prn (atoms-demo))
  (prn (transducers-demo)))
