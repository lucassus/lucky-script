import * as ohm from "ohm-js";
import { describe, expect, it } from "vitest";

describe("grammar", () => {
  it("MyGrammar", () => {
    const grammar = ohm.grammar(String.raw`
      MyGrammar {
        greeting = "Hello" | "Hola"
      }
    `);

    let result = grammar.match("Hello");
    expect(result.succeeded()).toBe(true);

    result = grammar.match("Hola");
    expect(result.succeeded()).toBe(true);

    result = grammar.match("Hi");
    expect(result.succeeded()).toBe(false);
  });

  it("Arithmetics", () => {
    const grammar = ohm.grammar(`
      Arithmetic {
        Exp = AddExp
        
        /* 
          Handles low-precedence operations
          The rule is defined "above" multiplication, because it call MulExp, 
          the parser ensures that multiplication is grouped more tightly than addition
        */
        AddExp = AddExp "+" MulExp -- plus
          | AddExp "-" MulExp -- minus
          | MulExp

        // Handles high-precedence operations
        MulExp = MulExp "*" number -- times
          | MulExp "/" number -- div
          | PriExp
          
        PriExp = "(" Exp ")" -- paren
         | number

        number = digit*
      }
    `);

    let result = grammar.match("42");
    expect(result.succeeded()).toBe(true);

    result = grammar.match("1");
    expect(result.succeeded()).toBe(true);

    result = grammar.match("1 + 2 * 3");
    expect(result.succeeded()).toBe(true);

    result = grammar.match("99 - 2 + 1");
    expect(result.succeeded()).toBe(true);

    result = grammar.match("(99 - 2) / 2");
    expect(result.succeeded()).toBe(true);
  });
});
