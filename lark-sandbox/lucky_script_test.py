import os
from lark import Lark

if __name__ == "__main__":
    grammar = open(os.path.join(os.path.dirname(__file__), "lucky_script.lark"), "r").read()
    parser = Lark(grammar, start="block", parser="lalr")

    script = """
    x = 1

    1 + 2 * 3

    y = -1 + 0.9999 * (3.5 + --+-4) ** 2 + x
    
    function add() { 1 + 2 }
    
    function foo() { 
      x = 1
      y = 2
      1 + 2 * 3 + -y ** -x
    }
    
    function bar() {}
    
    add()
    """

    ast = parser.parse(script)

    print(ast.pretty())
