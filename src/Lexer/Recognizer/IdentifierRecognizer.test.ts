import { IdentifierRecognizer } from "./IdentifierRecognizer";

describe("IdentifierRecognizer", () => {
  it.each`
    input
    ${"x"}
    ${"someVar"}
    ${"test123"}
  `("recognizes a valid identifier, like $input", ({ input }) => {
    const recognizer = new IdentifierRecognizer();

    for (const symbol of input.split("")) {
      recognizer.next(symbol);
    }

    const { recognized, value } = recognizer.result;
    expect(recognized).toBe(true);
    expect(value).toBe(input);
  });
});
