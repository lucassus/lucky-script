export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class NameError extends RuntimeError {
  constructor(name: string) {
    super(`Identifier ${name} is not defined`);
  }
}

export class ZeroDivisionError extends RuntimeError {
  constructor() {
    super("Division by zero");
  }
}
