from lark import Lark

parser = Lark.open("grammars/lucky_script.lark", start="program", rel_to=__file__)


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
