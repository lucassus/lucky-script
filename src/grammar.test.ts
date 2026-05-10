import * as ohm from "ohm-js";
import { describe, expect, it } from "vitest";


describe("grammar", ()=> {
  it("test", ()=> {
    const grammar = ohm.grammar(String.raw`
          MyGrammar {
            greeting = "Hello" | "Hola"
          }
    `);

    let m = grammar.match("Hello");
    expect(m.succeeded()).toBe(true);

    m = grammar.match("Hola");
    expect(m.succeeded()).toBe(true);

    m = grammar.match("Hi");
    expect(m.succeeded()).toBe(false);
  });
});
