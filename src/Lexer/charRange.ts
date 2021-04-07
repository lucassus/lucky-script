function* range(from: number, to: number): Generator<number> {
  for (let n = from; n <= to; n = n + 1) {
    yield n;
  }
}

export function charRange(from: string, to: string): string[] {
  const fromCharCode = from.charCodeAt(0);
  const toCharCode = to.charCodeAt(0);

  return [...range(fromCharCode, toCharCode)].map((code) =>
    String.fromCharCode(code)
  );
}
