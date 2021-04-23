import os

from lark import Lark

grammar = open(os.path.join(os.path.dirname(__file__), "json.lark"), "r").read()
parser = Lark(grammar, start="value")


def test_json():
    json = """
    {
      "key": ["item0", "item1", 3.14,
      { "foo": "bar", "bar": 123 }],
      "one": { "two": { "three": 3 } },
      "empty object": {},
      "empty list": []
    }
    """

    ast = parser.parse(json)
    assert ast


def test_package_json():
    json = open(os.path.join(os.path.dirname(__file__), "../package.json"), "r").read()

    ast = parser.parse(json)
    assert ast
