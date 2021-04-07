import { IdentifierRecognizer } from "./IdentifierRecognizer";

describe("IdentifierRecognizer", () => {
  it.each`
    input
    ${"x"}
    ${"someVar"}
    ${"test123"}
  `("recognizes a valid identifier, like $input", ({ input }) => {
    const recognizer = new IdentifierRecognizer();
    const { recognized, value } = recognizer.recognize(input);

    expect(recognized).toBe(true);
    expect(value).toBe(input);
  });
});
