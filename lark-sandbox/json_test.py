import os
from lark import Lark

if __name__ == "__main__":
    grammar = open(os.path.join(os.path.dirname(__file__), "json.lark"), "r").read()
    parser = Lark(grammar, start="value")

    # json = """
    # {
    #   "key": ["item0", "item1", 3.14,
    #   { "foo": "bar", "bar": 123 }],
    #   "one": { "two": { "three": 3 } }
    # }
    # """
    json = open(os.path.join(os.path.dirname(__file__), "../package.json"), "r").read()
    ast = parser.parse(json)

    print(ast.pretty())
