import { Lookahead } from "./Lookahead";

describe("Lookahead", () => {
  function* makeGenerator() {
    yield "first";
    yield "second";

    while (true) {
      yield "done";
    }
  }

  // TODO: Refactor this test to be more descriptive
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
