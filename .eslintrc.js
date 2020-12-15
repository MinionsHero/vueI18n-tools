module.exports = {
  root: true,
  env: {
    node: true
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "@typescript-eslint/ban-ts-ignore": "off",
    "semi": 0,
    "indent": "off",
    "prefer-const": 0,
    "space-before-function-paren": [2, { anonymous: "always", named: "never" }],
    "operator-linebreak": [2, "before"],
    "comma-dangle": ["error", "never"],
    "@typescript-eslint/explicit-module-boundary-types": "off"
  },
  parserOptions: {
    "ecmaVersion": 2020,
    "parser": "@typescript-eslint/parser"
  },
  overrides: [
    {
      "files": [
        "**/__tests__/*.{j,t}s?(x)",
        "**/tests/unit/**/*.spec.{j,t}s?(x)"
      ],
      "env": {
        "jest": true
      }
    }
  ],
  extends: [
    "plugin:vue/essential",
    "@vue/typescript/recommended",
    "@vue/prettier",
    "@vue/typescript"
  ]
};
