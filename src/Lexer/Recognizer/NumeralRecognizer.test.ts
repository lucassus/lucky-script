import { NumeralRecognizer } from "./NumeralRecognizer";

describe("NumeralRecognizer", () => {
  it.each`
    input
    ${"0"}
    ${"1"}
    ${"123"}
    ${"1_000"}
    ${"1_000_000"}
    ${"0.1"}
    ${".1"}
    ${"0.1"}
    ${"1_000.1"}
    ${"1.1_000"}
  `("recognizes a valid numeral, like $input", ({ input }) => {
    const recognizer = new NumeralRecognizer();
    const { recognized, value } = recognizer.recognize(input);

    expect(recognized).toBe(true);
    expect(value).toBe(input);
  });

  it.each`
    input
    ${"0123"}
    ${"1__0"}
    ${"1."}
    ${"1..2"}
    ${"1.2.3"}
  `("does not recognize invalid numeral, like $input", ({ input }) => {
    const recognizer = new NumeralRecognizer();
    const { recognized } = recognizer.recognize(input);

    expect(recognized).toBe(false);
  });
});
