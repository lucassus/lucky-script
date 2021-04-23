from lark import Lark

parser = Lark.open("lucky_script.lark", start="program",  rel_to=__file__)


def test_lucky_script_grammar():

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
