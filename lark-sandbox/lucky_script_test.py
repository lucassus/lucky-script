import os
from lark import Lark

if __name__ == "__main__":
    grammar = open(os.path.join(os.path.dirname(__file__), "lucky_script.lark"), "r").read()
    parser = Lark(grammar, start="expression", parser="lalr")

    # TODO: Build a simple calculator
    # TODO: Figure how to build a pretty AST
    script = """
    x = y = -1 + 0.9999 * (3.5 + --+-4) ** 2
    """
    ast = parser.parse(script)

    print(ast.pretty())
