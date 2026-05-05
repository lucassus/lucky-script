import { describe, expect, it } from "vitest";

import { Lookahead } from "./Lookahead";

describe("Lookahead", () => {
  function* makeGenerator() {
    yield "first";
    yield "second";
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) yield "done";
  }

  it("wraps the generator", () => {
    const lookahead = new Lookahead(makeGenerator());
    expect(lookahead.current).toEqual("first");
    expect(lookahead.next).toEqual("second");

    lookahead.advance();
    expect(lookahead.current).toEqual("second");
    expect(lookahead.next).toEqual("done");

    lookahead.advance();
    expect(lookahead.current).toEqual("done");
    expect(lookahead.next).toEqual("done");
  });
});
