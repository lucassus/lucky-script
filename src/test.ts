import { Interpreter } from "./Interpreter";
import { parse } from "./testingUtils";

test("the script", () => {
  const ast = parse(`
  function foo() {
    function bar() { 3 }
    
    bar
  }
  
  a = foo()
  a()
  `);

  const interpreter = new Interpreter(ast);
  expect(interpreter.run()).toBe(3);
});
