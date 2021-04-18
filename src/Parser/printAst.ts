import {
  AstNode,
  BinaryOperation,
  Numeral,
  Program,
  UnaryOperation,
} from "./AstNode";

const PREFIX_BRANCH = "│  ";
const PREFIX_EMPTY = "   ";
const PREFIX_RIGHT = "┌──";
const PREFIX_LEFT = "└──";

type Branch = "left" | "right";

function getValue(node: AstNode): string {
  if (node instanceof BinaryOperation) {
    return `binary: ${node.operator}`;
  }

  if (node instanceof UnaryOperation) {
    return `unary: ${node.operator}`;
  }

  if (node instanceof Numeral) {
    return `numeral: ${node.value}`;
  }

  return "";
}

export function printAst(root: AstNode) {
  function print(node: AstNode, branch: Branch = "left", prefix = ""): string {
    const result = [];

    if (node instanceof BinaryOperation) {
      const newPrefix =
        prefix + (branch === "left" ? PREFIX_BRANCH : PREFIX_EMPTY);
      result.push(print(node.left, "right", newPrefix));
    }

    result.push(
      [
        prefix,
        branch === "left" ? PREFIX_LEFT : PREFIX_RIGHT,
        getValue(node),
      ].join("")
    );

    if (node instanceof BinaryOperation) {
      const newPrefix =
        prefix + (branch === "left" ? PREFIX_EMPTY : PREFIX_BRANCH);
      result.push(print(node.right, "left", newPrefix));
    }

    if (node instanceof UnaryOperation) {
      const newPrefix = prefix + PREFIX_EMPTY;
      result.push(print(node.child, "left", newPrefix));
    }

    return result.join("\n");
  }

  if (root instanceof Program) {
    return root.instructions
      .map((instruction) => print(instruction))
      .join("\n");
  }

  return print(root);
}
