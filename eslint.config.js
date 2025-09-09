import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      globals: globals.browser,
    },
    ignores: ["node_modules", "dist"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error", // Disallow the use of `any`
      camelcase: "off", // Enforce camelCase naming convention
      quotes: ["error", "double"], // Enforce the consistent use of double quotes
      semi: ["error", "always"], // Require semicolons at the end of statements
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }], // Ignore unused variables prefixed with _
      "no-console": ["error", { allow: ["error", "info"] }], // Warn about console usage
      "no-else-return": "error", // Disallow `else` blocks after `return` statements
      "no-use-before-define": "error", // Disallow the use of variables before they are defined

      // Best Practices
      eqeqeq: "error", // Require the use of `===` and `!==`

      // Stylistic Issues
      "array-bracket-spacing": ["error", "never"], // Disallow spaces inside array brackets
      "comma-spacing": "error", // Enforce consistent spacing after commas
      "key-spacing": "error", // Enforce consistent spacing between keys and values in object literals
      "object-curly-spacing": ["error", "always"], // Enforce consistent spacing inside curly braces of object literals
      "arrow-spacing": "error", // Enforce consistent spacing before and after the arrow in arrow functions

      // ES6 Specific
      "arrow-parens": ["error", "always"], // Require parentheses around arrow function parameters
      "no-var": "error", // Require `let` or `const` instead of `var`
      "prefer-const": "error", // Require `const` declarations for variables that are never reassigned
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
