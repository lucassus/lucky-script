-- ============================================================
-- Lucky Script Inspirations — Haskell
-- ============================================================
-- Assumed: GHC 9.x.
-- See ../roadmap.md for Lucky Script's feature roadmap.
--
-- Haskell is the most idiomatically distant language in this set.
-- It's the gold-standard reference for pattern matching, ADTs, and
-- expression-orientation. Several LS concepts have no native Haskell
-- form — `while`, mutable variables, `return`-from-imperative-style.
-- Haskell *replaces* those with recursion, immutability, and monads.
--
-- This file is meant as a tour; not all snippets sit at top-level
-- (`do { ... }` examples assume IO context). Read each section as a
-- self-contained idea, not as a runnable program.
--
-- Sections:
--   01. Comments & program structure
--   02. Variables & assignment (immutable bindings only)
--   03. Numbers, booleans, Maybe (Haskell has no null)
--   04. Strings
--   05. Operators
--   06. if / else (always an expression)
--   07. while / break / continue — not native; recursion + when/unless
--   08. for-each (mapM_, forM_)
--   09. Functions: curried by default, pattern matching, guards
--   10. Lambdas
--   11. Higher-order functions & function composition (.)
--   12. Lists (linked, lazy)
--   13. "Dicts" via Data.Map
--   14. "Sets" via Data.Set
--   15. Pattern matching (THE language for this)
--   16. Error handling: Either, Maybe, exceptions
--   17. "Methods on types" — typeclass methods (very different)
--   18. Inspect / debug (Show, Debug.Trace)
--   19. Beyond LS: typeclasses, lazy evaluation, do-notation, composition

{-# LANGUAGE OverloadedStrings #-}
{-# OPTIONS_GHC -Wno-unused-imports -Wno-unused-top-binds -Wno-unused-local-binds -Wno-name-shadowing #-}

module Main where

import           Control.Monad      (forM_, unless, when)
import           Data.List          (sort)
import qualified Data.Map.Strict    as Map
import           Data.Maybe         (fromMaybe)
import qualified Data.Set           as Set
import           Debug.Trace        (trace)
import           Text.Printf        (printf)


-- ============================================================
-- 01. Comments & program structure
--   LS: shipped (# comments). Haskell uses `--` and `{- ... -}`.
--   Every file is a *module*; `import` brings in names.
-- ============================================================

-- Single-line: --
{- Block comments. Nest freely.
   {- inner -}
-}


-- ============================================================
-- 02. Variables & assignment (immutable bindings only)
--   LS: shipped (mutable). Haskell: NO mutable variables at the value
--   level. `let x = 10` binds `x` to a value, period. No rebinding,
--   no `+=`. "Updates" produce a new value — pure FP.
-- ============================================================

-- Top-level bindings.
piApprox :: Double
piApprox = 3.14159

greetingTop :: String
greetingTop = "hello"

-- Local bindings inside a function use `let ... in ...` or `where`.
section02 :: Int
section02 =
  let x = 10
      y = x + 5    -- not "x += 5"; a NEW binding
  in y * 2

section02b :: Int
section02b = result
  where
    result = base * 2
    base   = 10 + 5

-- Parallel bindings in `let` are mutually visible (Haskell's let is recursive).
mutual :: (Int, Int)
mutual =
  let a = b + 1
      b = 41
  in (a, b)


-- ============================================================
-- 03. Numbers, booleans, Maybe (Haskell has no null)
--   LS: shipped (has `nothing`). Haskell: NO null. Absence is
--   encoded in the *type system* with `Maybe a = Nothing | Just a`.
--   This is the design lesson LS could borrow most directly.
-- ============================================================

n :: Int
n = 1000000          -- Haskell has no _ digit separators

piVal :: Double
piVal = 3.14159

big :: Integer       -- arbitrary precision
big = 10 ^ (100 :: Int)

t, fv :: Bool
t  = True
fv = False

-- "Nothing" is a value of type `Maybe a`. You must handle both cases.
maybeName :: Maybe String
maybeName = Just "Alice"

-- Pattern match to destructure a Maybe.
greetMaybe :: Maybe String -> String
greetMaybe Nothing     = "Hello, stranger"
greetMaybe (Just name) = "Hello, " ++ name


-- ============================================================
-- 04. Strings
--   LS: shipped (escapes, concat). f-strings planned (Later);
--   multiline planned (Future). Haskell: String = [Char] (linked list),
--   `++` for concat, `Text.Printf.printf` for formatted output.
-- ============================================================

stringDemo :: IO ()
stringDemo = do
  let greeting = "hello"
      name     = "world"
  putStrLn (greeting ++ " " ++ name)
  putStrLn "say \"hi\""
  putStrLn "line1\nline2"
  printf "hello %s, you are %d\n" name (30 :: Int)


-- ============================================================
-- 05. Operators
--   LS: shipped. Haskell: `^` (Int power), `**` (Floating power),
--   `mod`/`div` for integer arithmetic (infix as `x `mod` y`).
-- ============================================================

operatorsDemo :: (Int, Int, Int, Double)
operatorsDemo =
  ( 1 + 2 * 3 ^ (2 :: Int)
  , 10 `mod` 3
  , 10 `div` 3
  , 10.0 / 3.0
  )


-- ============================================================
-- 06. if / else (always an expression)
--   LS: shipped (statement). if-expression planned (Next) — Haskell's
--   `if cond then x else y` IS an expression. `else` is mandatory.
-- ============================================================

classify :: Int -> Int
classify value =
  if value < 0
    then -1
    else if value == 0
      then 0
      else 1

-- Idiomatic alternative: guards on a function clause (see §09).


-- ============================================================
-- 07. while / break / continue — not native; recursion + when/unless
--   LS: shipped (while/break/continue). Haskell has NO loop statements.
--   Use explicit recursion (with a base case) or Control.Monad helpers.
-- ============================================================

-- "while-like" via tail-recursive helper.
countDown :: Int -> IO ()
countDown 0 = pure ()
countDown n = do
  print n
  countDown (n - 1)

-- `when` and `unless` are guards on monadic actions — closest to
-- imperative "if X then do Y, otherwise skip". No early `break` though.
sometimesPrint :: Int -> IO ()
sometimesPrint x = do
  when (x > 0) (putStrLn "positive")
  unless (x > 0) (putStrLn "non-positive")


-- ============================================================
-- 08. for-each (mapM_, forM_)
--   LS: planned (Next). Haskell: `mapM_` (or `forM_` with flipped args)
--   runs an action over each element. No `for` keyword.
-- ============================================================

forEachDemo :: IO ()
forEachDemo = do
  forM_ [10, 20, 30] print
  forM_ (zip [(0 :: Int) ..] ["a", "b", "c"]) $ \(i, s) ->
    printf "%d: %s\n" i s


-- ============================================================
-- 09. Functions: curried by default, pattern matching, guards
--   LS: shipped (multi-arg). Defaults & kwargs planned (Later) —
--   Haskell has NEITHER, but currying + records cover similar ground.
--
--   Every Haskell function is curried: `add :: Int -> Int -> Int`
--   means `add :: Int -> (Int -> Int)`. Partial application is free.
-- ============================================================

add :: Int -> Int -> Int
add a b = a + b

-- Partial application.
inc :: Int -> Int
inc = add 1

-- Multiple-clause function — dispatched by pattern.
factorial :: Integer -> Integer
factorial 0 = 1
factorial n = n * factorial (n - 1)

-- Guards on a single clause — when patterns aren't enough.
classifyGuarded :: Int -> String
classifyGuarded value
  | value < 0  = "negative"
  | value == 0 = "zero"
  | otherwise  = "positive"


-- ============================================================
-- 10. Lambdas
--   LS: shipped (full-form). Arrow shorthand `x -> x*2` planned (Next) —
--   Haskell's `\x -> x * 2` is the design ancestor. The leading `\`
--   is meant to evoke a lambda.
-- ============================================================

doubleFn :: Int -> Int
doubleFn = \x -> x * 2

addXY :: Int -> Int -> Int
addXY = \x y -> x + y

-- Section syntax — partially-applied operators.
inc2 :: Int -> Int
inc2 = (+ 1)

halve :: Double -> Double
halve = (/ 2)


-- ============================================================
-- 11. Higher-order functions & function composition (.)
--   LS: HOFs work today. Pipeline `|>` planned (Next) — Haskell's
--   `f . g` (composition) and `$` (function application) play similar
--   roles. The community is starting to adopt `&` for left-to-right
--   pipelines (`x & f & g` = `g (f x)`).
-- ============================================================

import_pipeline :: Int
import_pipeline =
  sum
    . map (* 2)
    . filter (> 0)
    $ [1 .. 5]

-- Same, left-to-right with Data.Function.(&):
-- import Data.Function ((&))
-- xs & filter (> 0) & map (*2) & sum


-- ============================================================
-- 12. Lists (linked, lazy)
--   LS: planned (Next). Haskell lists are LAZY linked lists — they
--   can be infinite. `:` prepends, `++` concatenates, `!!` indexes.
-- ============================================================

listDemo :: ([Int], Int)
listDemo =
  let xs       = [1, 2, 3, 4, 5]
      headEl   = head xs        -- 1
      lastEl   = last xs        -- 5
      slice    = take 3 (drop 1 xs)  -- [2,3,4]
      prepended = 0 : xs        -- [0,1,2,3,4,5]
  in (slice, headEl + lastEl)

-- Infinite list — only evaluated as far as needed.
naturals :: [Int]
naturals = [0 ..]

firstTen :: [Int]
firstTen = take 10 naturals


-- ============================================================
-- 13. "Dicts" via Data.Map
--   LS: planned (Next). Haskell: no built-in literal — Data.Map is
--   the standard, with `fromList [(k, v), ...]`.
-- ============================================================

person :: Map.Map String String
person = Map.fromList [("name", "Alice"), ("age", "30")]

personDemo :: (Maybe String, String)
personDemo =
  ( Map.lookup "name" person                                    -- Just "Alice"
  , fromMaybe "default" (Map.lookup "missing" person)           -- "default"
  )


-- ============================================================
-- 14. "Sets" via Data.Set
--   LS: planned (Later). Haskell: Data.Set, no literal syntax.
-- ============================================================

primes :: Set.Set Int
primes = Set.fromList [2, 3, 5, 7]

setDemo :: (Bool, Int)
setDemo =
  ( Set.member 2 primes
  , Set.size primes
  )


-- ============================================================
-- 15. Pattern matching (THE language for this)
--   LS: planned (Next). Haskell has pattern matching in:
--     - function-clause heads (§09)
--     - `case ... of` expressions
--     - `let` and `where` bindings
--     - lambda heads (\(Just x) -> ...)
--   This is the canonical reference for LS's planned `match` / `case`.
-- ============================================================

describe :: (Show a) => Maybe [a] -> String
describe Nothing            = "nothing"
describe (Just [])          = "empty"
describe (Just [x])         = "one: " ++ show x
describe (Just (x : rest))  = "first " ++ show x ++ ", then " ++ show (length rest) ++ " more"

-- `case ... of` is the expression form.
describeNum :: Int -> String
describeNum value = case value of
  0                  -> "zero"
  n | n < 0          -> "negative"
  _                  -> "positive"

-- Destructuring in `let` and lambdas.
destructureDemo :: (Int, Int, Int)
destructureDemo =
  let (a, b, c) = (1, 2, 3)        -- tuple destructure
      [x, _, _] = [10, 20, 30]     -- list destructure (partial — beware!)
  in (a + b + c, x, 0)


-- ============================================================
-- 16. Error handling: Either, Maybe, exceptions
--   LS: planned (Later) — try/catch. Haskell's preferred style: encode
--   failure in the type. `Maybe` for "missing", `Either e a` for "errored".
-- ============================================================

safeDiv :: Int -> Int -> Either String Int
safeDiv _ 0 = Left "divide by zero"
safeDiv a b = Right (a `div` b)

safeDivDemo :: String
safeDivDemo = case safeDiv 10 0 of
  Left e  -> "error: " ++ e
  Right r -> "ok: " ++ show r

-- Exceptions exist (`error`, `throwIO`, `catch` from Control.Exception)
-- but are reserved for *bugs* and *external failures*, not normal flow.


-- ============================================================
-- 17. "Methods on types" — typeclass methods (very different)
--   LS: planned (Later) — dot-method calls. Haskell has NO dot-syntax;
--   methods live in typeclasses and dispatch on the argument's type.
--   `length xs` works because `[a]` has `length` available (via Foldable).
-- ============================================================

methodsDemo :: IO ()
methodsDemo = do
  putStrLn (map (\c -> if c == 'l' then 'L' else c) "hello")   -- replace
  putStrLn (show (length [1, 2, 3]))
  putStrLn (show (sort [3, 1, 2]))


-- ============================================================
-- 18. Inspect / debug (Show, Debug.Trace)
--   LS: planned (Future). Haskell: `Show` typeclass provides `show`
--   for textual representation; Debug.Trace.trace prints during
--   evaluation. Sparingly used — types do most of the work.
-- ============================================================

inspectDemo :: IO ()
inspectDemo = do
  let xs = [1, 2, 3]
  print xs                       -- [1,2,3]
  putStrLn (show xs)              -- "[1,2,3]"
  let traced = trace ("evaluating xs = " ++ show xs) xs
  print traced


-- ============================================================
-- 19. Beyond Lucky Script — Haskell gems
--   LS: not planned (any of these).
-- ============================================================

-- --- Typeclasses: ad-hoc polymorphism over types ---
-- A typeclass declares functions; instances provide them per type.
-- LS could borrow this if it ever needs protocol-style dispatch
-- (Elixir Protocols, Rust Traits, Kotlin sealed-class dispatch).

class Shoutable a where
  shout :: a -> String

instance Shoutable String where
  shout s = map (\c -> if c >= 'a' && c <= 'z' then toEnum (fromEnum c - 32) else c) s ++ "!"

instance Shoutable Int where
  shout n = "Number: " ++ show n ++ "!"

shoutDemo :: IO ()
shoutDemo = do
  putStrLn (shout ("hello" :: String))
  putStrLn (shout (42 :: Int))


-- --- Lazy evaluation: nothing is computed until needed ---
-- All values are thunks until forced. Enables infinite data structures,
-- expressive control flow without complex constructs, and unique pitfalls.

fibs :: [Integer]
fibs = 0 : 1 : zipWith (+) fibs (tail fibs)
-- The first 10 Fibonacci numbers — laziness lets the definition reference itself.

lazinessDemo :: [Integer]
lazinessDemo = take 10 fibs


-- --- do-notation + IO monad: sequencing effects ---
-- `do` notation is syntactic sugar over `>>=` (bind). It looks imperative
-- but is pure-FP underneath. The IO monad threads "the world" implicitly.

ioDemo :: IO ()
ioDemo = do
  putStrLn "what's your name?"
  -- name <- getLine     -- bind the result of an IO action
  let name = "Alice"     -- (kept pure for snippet purposes)
  putStrLn ("hello, " ++ name)


-- --- Currying & function composition: the algebra of functions ---
-- `f . g` is composition: `(f . g) x = f (g x)`.
-- `$` is low-precedence application: `f $ g x = f (g x)` without parens.

doubleThenInc :: Int -> Int
doubleThenInc = (+ 1) . (* 2)

-- Pointfree style: define functions without naming the argument.
sumOfSquares :: [Int] -> Int
sumOfSquares = sum . map (^ (2 :: Int))


-- ============================================================
-- main — minimal driver to make the module valid Haskell.
-- ============================================================

main :: IO ()
main = do
  putStrLn "Lucky Script Inspirations — Haskell"
  print (classify 5)
  print (factorial 5)
  print firstTen
  print setDemo
