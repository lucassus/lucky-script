import pytest
from lark import Lark, UnexpectedCharacters

parser = Lark.open("lucky_script_future.lark", start="program", rel_to=__file__)


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
        "function foo(x) {}",
        "function foo(x, y = 1) {}",
        "x = 123",
        "y = function() { return 123 }",
        "y = function() {\n\treturn 123\n}",
        "foo(1, 2, 3 + 4)",
        "if (x > 2) {}"
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
        "function foo(function(bar) {}) {}"
    ),
)
def test_lucky_script_invalid_syntax(script):
    with pytest.raises(UnexpectedCharacters):
        parser.parse(script)


def test_lucky_script_example():
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
    
    x = function(x,y) { 
      return x+y 
    }
    
    function curry(x, y = 1) {
      if (x < 0) {
        return 0 
      }
      
      if (x > 10) {
        return 10
      } elseif (x == 1000) {
      } elseif (x == 1001) {
      } else {
        x = 2
      }
    
      z = 2
      
      return function(x) {
        return x + y * z
      }
    }
    
    curry(2)
    """

    ast = parser.parse(script)
    assert ast
