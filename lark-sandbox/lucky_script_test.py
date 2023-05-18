import pytest
from lark import Lark, UnexpectedCharacters

parser = Lark.open("lucky_script.lark", rel_to=__file__, start="program")


@pytest.mark.parametrize(
    "script",
    (
        "",
        "\n\n",
        "\n1\n",
        "123",
        "-123",
        "----+++123",
        "(1 + 2) * 3",
        "function foo() {}",
        "function foo() { 1 + 2 +3 }",
        "function foo() { return 123 }",
        "function () { return 123 }",
        "function () {}",
        "function (x, y) {}",
        "x = function (x) { return 123 }",
        "foo()",
        "foo(123)",
        "foo(1, 2, 1+2+3+4)",
        "x = 123",
        "if(123) {}",
        "if(x < 1) {}",
        "if(x <= 1) {}",
        "if(x == 1) {}",
        "if(x > 1) {}",
        "if(x >= 1) {}",
        "if(x < 1 < 2) {}",
        "return 1234",
    ),
)
def test_lucky_script_valid_syntax(script):
    ast = parser.parse(script)
    assert ast


@pytest.mark.parametrize(
    "script",
    (
        "1 2 3",
        "function foo(1+2) {}",
        "x = function bar() {}",
        "function bar(,y) {}",
        "x = function(, x, y) {}",
        "x = function bar(, x, y) {}",
        "function foo(function(bar) {}) {}",
    ),
)
def test_lucky_script_invalid_syntax(script):
    with pytest.raises(UnexpectedCharacters):
        parser.parse(script)


def test_lucky_script():
    script = """
    x = 1

    1 + 2 * 3

    2 ** -(3 / 2) + 1

    y = -1 + 0.9999 * (3.5 + --+-4) ** 2 + x

    function add() { x+y }

    function foo() {
      x = 1
      y = 2

      return 1 + 2 * 3 + -y ** -x
    }

    function bar() {}

    function(){}

    bar = function () {}

    add()

    function curry(x) {
      z = 2

      return function (y) {
        return x + y * z
      }
    }

    if (x < 0) {
      x = 0
    }

    curry(123)
    """

    ast = parser.parse(script)
    assert ast
