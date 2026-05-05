export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, RuntimeError.prototype);
  }
}

export class NameError extends RuntimeError {
  constructor(name: string) {
    super(`Identifier ${name} is not defined`);
    Object.setPrototypeOf(this, NameError.prototype);
  }
}

export class ZeroDivisionError extends RuntimeError {
  constructor() {
    super("Division by zero");
    Object.setPrototypeOf(this, ZeroDivisionError.prototype);
  }
}

export class ScopeError extends RuntimeError {
  constructor(name: string) {
    super(`No enclosing binding found for '${name}'`);
    Object.setPrototypeOf(this, ScopeError.prototype);
  }
}
