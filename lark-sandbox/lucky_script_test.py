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
        "x = 123",
    ),
)
def test_lucky_script_valid_syntax(script):
    ast = parser.parse(script)
    assert ast


@pytest.mark.parametrize(
    "script",
    (
        "1 2 3",
        "function foo(x, y) {}",
        "function foo(1+2) {}",
        "function foo() { return 123 }",
        "x = function bar() {}",
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
      
      1 + 2 * 3 + -y ** -x
    }
    
    function bar() {}
    
    add()
    
    function curry() {
      z = 2
      
      function add() {
        x + y * z
      }
      
      add
    }
    
    curry()
    """

    ast = parser.parse(script)
    assert ast
