import os
from lark import Lark

if __name__ == "__main__":
    grammar = open(os.path.join(os.path.dirname(__file__), "lucky_script.lark"), "r").read()
    parser = Lark(grammar, start="program", parser="lalr")

    script = """
    x = 1

    1 + 2 * 3

    y = -1 + 0.9999 * (3.5 + --+-4) ** 2 + x
    
    function add(x, y) { return x+y }
    
    add(1, add(1,2)+3)
    
    function foo() { 
      x = 1
      y = 2
      return 1 + 2 * 3 + -y ** -x
    }
    
    function bar() {}
    
    add()
    
    x = function(x,y) { return x+y }
    
    function curry(x, y = 1) {
      return function(x) {
        return x + y
      }
    }
    
    curry(2)
    """

    ast = parser.parse(script)

    print(ast.pretty())
