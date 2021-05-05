import os

from lark import Lark

grammar = open(os.path.join(os.path.dirname(__file__), "calculator.lark"), "r").read()
parser = Lark(grammar, start="expression")


def test_calculator():
    ast = parser.parse("(1 + 2) * 3 - -4 ** 5")
    assert ast
    print(ast.pretty())
