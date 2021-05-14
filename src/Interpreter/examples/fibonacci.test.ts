import { Lexer } from "../../Lexer";
import { Parser } from "../../Parser";
import { Interpreter } from "../Interpreter";

it.each`
  n    | expected
  ${0} | ${0}
  ${1} | ${1}
  ${2} | ${1}
  ${3} | ${2}
  ${4} | ${3}
  ${5} | ${5}
  ${6} | ${8}
  ${7} | ${13}
  ${8} | ${21}
  ${9} | ${34}
`("calculates fibonacci number for $n", ({ n, expected }) => {
  const script = `
    function fib(n) {
      if (n < 2) {
        return n
      }
      
      return fib(n - 2) + fib(n - 1)
    }
    
    fib(${n})
  `;

  const lexer = new Lexer(script).tokenize();
  const ast = new Parser(lexer).parse();
  const result = new Interpreter(ast).run();

  expect(result).toBe(expected);
});
