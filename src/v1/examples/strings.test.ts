import { describe, expect, it } from "vitest";

import { run } from "../testingUtils";

describe("string literals", () => {
  it("evaluates a simple string literal", () => {
    expect(run('"hello"')).toBe("hello");
  });

  it("evaluates an empty string literal", () => {
    expect(run('""')).toBe("");
  });

  it("decodes escaped quote", () => {
    expect(run('"say \\"hi\\""')).toBe('say "hi"');
  });

  it("decodes escaped backslash", () => {
    expect(run('"back\\\\slash"')).toBe("back\\slash");
  });

  it("decodes \\n escape as actual newline character", () => {
    expect(run('"line1\\nline2"')).toBe("line1\nline2");
  });

  it("does not double-decode: \\\\n stays as backslash+n", () => {
    expect(run('"\\\\n"')).toBe("\\n");
  });
});

describe("string concatenation", () => {
  it("concatenates two strings with +", () => {
    expect(run('"hello" + " world"')).toBe("hello world");
  });

  it("concatenates string variables", () => {
    expect(
      run(`
      let a = "foo"
      let b = "bar"
      a + b
    `),
    ).toBe("foobar");
  });

  it("throws RuntimeError when adding string and number", () => {
    expect(() => run('"x" + 1')).toThrow();
  });
});

describe("string comparison", () => {
  it("== returns true for equal strings", () => {
    expect(run('"a" == "a"')).toBe(true);
  });

  it("== returns false for unequal strings", () => {
    expect(run('"a" == "b"')).toBe(false);
  });

  it("!= returns true for unequal strings", () => {
    expect(run('"a" != "b"')).toBe(true);
  });

  it("!= returns false for equal strings", () => {
    expect(run('"a" != "a"')).toBe(false);
  });
});

describe("string in boolean context", () => {
  it("empty string is falsy — takes else branch", () => {
    expect(
      run(`
      let result = 0
      if "" then
        let result = 1
      else
        let result = 2
      end
      result
    `),
    ).toBe(2);
  });

  it("non-empty string is truthy — takes then branch", () => {
    expect(
      run(`
      let result = 0
      if "hello" then
        let result = 1
      end
      result
    `),
    ).toBe(1);
  });
});
