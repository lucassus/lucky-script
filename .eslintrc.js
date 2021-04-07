module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  env: {
    node: true,
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
  ],
  rules: {
    "object-shorthand": "error",
    "import/order": [
      "error",
      {
        alphabetize: { order: "asc", caseInsensitive: true },
        groups: [["builtin", "external", "internal"]],
        "newlines-between": "always",
      },
    ],
    "@typescript-eslint/explicit-module-boundary-types": "off",
  },
};
