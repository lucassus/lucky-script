import { parse } from "../testingUtils";
import { printAst } from "./printAst";

test(".printAst", () => {
  const ast = parse("1 + 2 * (3 + -+1) / .5");

  expect(printAst(ast)).toMatchInlineSnapshot(`
    "│  ┌──numeral: 1
    └──binary: +
       │     ┌──numeral: 2
       │  ┌──binary: *
       │  │  │  ┌──numeral: 3
       │  │  └──binary: +
       │  │     └──unary: -
       │  │        └──unary: +
       │  │           └──numeral: 1
       └──binary: /
          └──numeral: .5"
  `);
});
