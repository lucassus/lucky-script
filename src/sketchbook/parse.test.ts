import { describe, expect, it } from "vitest";

import { parse, type Program } from "./parse";

describe("parse", () => {
  it("parses a kitchen-sink script into an AST", () => {
    const source = `
      // setup
      let initial = 10.5e-1
      let offset = -2.5

      fun clamp(value, lo, hi) do
        if value < lo then
          return lo
        elseif value > hi then
          return hi
        else
          return value
        end
      end

      let factor = 3
      let adjusted = initial + offset
      let scaled = adjusted * factor

      if scaled > 0 and not false then
        scaled = clamp(scaled, 0, 100)
      elseif scaled == 0 then
        scaled = 1
      else
        scaled = -1
      end

      add(scaled, 2 ^ 3 % 5) // inline comment
    `.trim();

    const expected: Program = {
      kind: "Program",
      body: [
        {
          kind: "Let",
          name: "initial",
          init: { kind: "Literal", value: 1.05 },
        },
        {
          kind: "Let",
          name: "offset",
          init: {
            kind: "Unary",
            op: "-",
            operand: { kind: "Literal", value: 2.5 },
          },
        },
        {
          kind: "FunDef",
          name: "clamp",
          params: ["value", "lo", "hi"],
          body: [
            {
              kind: "If",
              test: {
                kind: "Binary",
                op: "<",
                left: { kind: "Var", name: "value" },
                right: { kind: "Var", name: "lo" },
              },
              then: [{ kind: "Return", value: { kind: "Var", name: "lo" } }],
              elseif: [
                {
                  test: {
                    kind: "Binary",
                    op: ">",
                    left: { kind: "Var", name: "value" },
                    right: { kind: "Var", name: "hi" },
                  },
                  body: [
                    { kind: "Return", value: { kind: "Var", name: "hi" } },
                  ],
                },
              ],
              else: [{ kind: "Return", value: { kind: "Var", name: "value" } }],
            },
          ],
        },
        {
          kind: "Let",
          name: "factor",
          init: { kind: "Literal", value: 3 },
        },
        {
          kind: "Let",
          name: "adjusted",
          init: {
            kind: "Binary",
            op: "+",
            left: { kind: "Var", name: "initial" },
            right: { kind: "Var", name: "offset" },
          },
        },
        {
          kind: "Let",
          name: "scaled",
          init: {
            kind: "Binary",
            op: "*",
            left: { kind: "Var", name: "adjusted" },
            right: { kind: "Var", name: "factor" },
          },
        },
        {
          kind: "If",
          test: {
            kind: "Binary",
            op: "and",
            left: {
              kind: "Binary",
              op: ">",
              left: { kind: "Var", name: "scaled" },
              right: { kind: "Literal", value: 0 },
            },
            right: {
              kind: "Unary",
              op: "not",
              operand: { kind: "Literal", value: false },
            },
          },
          then: [
            {
              kind: "Assign",
              name: "scaled",
              value: {
                kind: "Call",
                callee: "clamp",
                args: [
                  { kind: "Var", name: "scaled" },
                  { kind: "Literal", value: 0 },
                  { kind: "Literal", value: 100 },
                ],
              },
            },
          ],
          elseif: [
            {
              test: {
                kind: "Binary",
                op: "==",
                left: { kind: "Var", name: "scaled" },
                right: { kind: "Literal", value: 0 },
              },
              body: [
                {
                  kind: "Assign",
                  name: "scaled",
                  value: { kind: "Literal", value: 1 },
                },
              ],
            },
          ],
          else: [
            {
              kind: "Assign",
              name: "scaled",
              value: {
                kind: "Unary",
                op: "-",
                operand: { kind: "Literal", value: 1 },
              },
            },
          ],
        },
        {
          kind: "ExprStmt",
          expr: {
            kind: "Call",
            callee: "add",
            args: [
              { kind: "Var", name: "scaled" },
              {
                kind: "Binary",
                op: "%",
                left: {
                  kind: "Binary",
                  op: "^",
                  left: { kind: "Literal", value: 2 },
                  right: { kind: "Literal", value: 3 },
                },
                right: { kind: "Literal", value: 5 },
              },
            ],
          },
        },
      ],
    };

    expect(parse(source)).toEqual(expected);
  });
});
