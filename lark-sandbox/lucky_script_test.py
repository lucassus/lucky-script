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
        "fn foo()\nend",
        "fn foo()\n  1 + 2 + 3\nend",
        "fn foo()\n  return 123\nend",
        "fn ()\n  return 123\nend",
        "fn ()\nend",
        "fn (x, y)\nend",
        "x = fn (x)\n  return 123\nend",
        "fn(x) 123",
        "fn(x, y) x + y",
        "foo()",
        "foo(123)",
        "foo(1, 2, 1+2+3+4)",
        "x = 123",
        "if 123\nend",
        "if x < 1\nend",
        "if x <= 1\nend",
        "if x == 1\nend",
        "if x != 1\nend",
        "if x > 1\nend",
        "if x >= 1\nend",
        "if x < 1 < 2\nend",
        "if x < 1 then print(x) end",
        "if x < 1\n  print(x)\nelseif x == 1\n  print(1)\nelse\n  print(0)\nend",
        "return 1234",
        '"hello"',
        '""',
        '"hello" + " world"',
        '"a" == "b"',
        '"a" != "b"',
        r'"say \"hi\""',
        r'"line1\nline2"',
        r'"back\\slash"',
        "true",
        "false",
        "not true",
        "not false",
        "not 0",
        "not 1",
        "not -1",
        "true and true",
        "true and false",
        "false and true",
        "1 and 2",
        "0 and true",
        "false and undeclaredFn()",
        "false or true",
        "false or false",
        "0 or false",
        "-1 or 0",
        "true or undeclaredFn()",
        "true and false == false",
        "local x = 1",
        "local x = 1 + 2",
        "outer x = 1",
        "outer x = 1 + 2",
        "while true\n  1\nend",
        "while i < 3\n  i = i + 1\nend",
        "while false\nend",
        "while true\n  while false\n    1\n  end\nend",
        "while true\n  break\nend",
        "while i < 10\n  if i == 3\n    continue\n  end\n  i = i + 1\nend",
        "while true\n  while false\n    break\n  end\nend",
        "while true\n  if x > 0\n    break\n  else\n    continue\n  end\nend",
        "while true\n  i = i + 1\n  break\nend",
        "while true\n  break\n  continue\nend",
        "while true then break end",
        "x += 1",
        "x -= 1",
        "x *= 1",
        "x /= 1",
        "local x += 1",
        "local x -= 1",
        "local x *= 1",
        "local x /= 1",
        "outer x += 1",
        "outer x -= 1",
        "outer x *= 1",
        "outer x /= 1",
        "x += 1 + 2",
        "counter -= 1",
        "total *= 2",
        "value /= 10",
    ),
)
def test_lucky_script_valid_syntax(script):
    ast = parser.parse(script)
    assert ast


@pytest.mark.parametrize(
    "script",
    (
        "1 2 3",
        "fn foo(1+2)\nend",
        "x = fn bar()\nend",
        "fn bar(,y)\nend",
        "x = fn(, x, y)\nend",
        "x = fn bar(, x, y)\nend",
        "fn foo(fn(bar)\nend)\nend",
        "while true 1 end",
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

    fn add()
      x + y
    end

    fn foo()
      x = 1
      y = 2

      return 1 + 2 * 3 + -y ** -x
    end

    fn bar()
    end

    fn()
      return nothing
    end

    bar = fn ()
      return nothing
    end

    add()

    fn curry(x)
      z = 2

      return fn (y)
        return x + y * z
      end
    end

    if x < 0
      x = 0
    end

    curry(123)

    greeting = "hello"
    message = greeting + " world"
    """

    ast = parser.parse(script)
    assert ast
