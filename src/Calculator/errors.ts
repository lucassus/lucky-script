class RuntimeError extends Error {}

export class UndefinedVariableError extends RuntimeError {
  constructor(name: string) {
    super(`Variable ${name} is not defined`);
  }
}

export class ZeroDivisionError extends RuntimeError {
  constructor() {
    super("Division by zero");
  }
}
