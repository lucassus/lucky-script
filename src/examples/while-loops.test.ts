import { expect, it } from "vitest";
import { run } from "./utils";

it.each`
  max   | expected
  ${5}  | ${15}
  ${10} | ${55}
`("Sum of range: sumRange($max) = $expected", ({ max, expected }) => {
  const script = `
    function sumRange(max) {
      sum = 0
      i = 1
      while (i <= max) {
        sum = sum + i
        i = i + 1
      }
      return sum
    }
    sumRange(${max})
  `;

  expect(run(script)).toBe(expected);
});

it.each`
  n    | expected
  ${0} | ${1}
  ${1} | ${1}
  ${3} | ${6}
  ${5} | ${120}
`("Factorial: factorial($n) = $expected", ({ n, expected }) => {
  const script = `
    function factorial(n) {
      result = 1
      while (n > 1) {
        result = result * n
        n = n - 1
      }
      return result
    }
    factorial(${n})
  `;

  expect(run(script)).toBe(expected);
});

it.each`
  n     | expected
  ${0}  | ${0}
  ${1}  | ${1}
  ${2}  | ${1}
  ${6}  | ${8}
  ${10} | ${55}
`("Fibonacci iterative: fib($n) = $expected", ({ n, expected }) => {
  const script = `
    function fib(n) {
      if (n < 2) {
        return n
      }

      prev = 0
      curr = 1
      while (n > 1) {
        next = prev + curr
        prev = curr
        curr = next
        n = n - 1
      }
      return curr
    }
    fib(${n})
  `;

  expect(run(script)).toBe(expected);
});

it("Find first match (early return from loop)", () => {
  const script = `
    function findFirst(target) {
      i = 1
      while (i <= 100) {
        if (i * i == target) {
          return i
        }
        i = i + 1
      }
      return -1
    }
    findFirst(49)
  `;

  expect(run(script)).toBe(7);
});

it("Find not found returns -1", () => {
  const script = `
    function findFirst(target) {
      i = 1
      while (i <= 10) {
        if (i * i == target) {
          return i
        }
        i = i + 1
      }
      return -1
    }
    findFirst(123)
  `;

  expect(run(script)).toBe(-1);
});
