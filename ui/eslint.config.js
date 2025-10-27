// eslint.config.js — TS + React Hooks + import sort + unused imports
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  // 1) Ignore non-app folders to keep the “tree-shake” pass focused
  {
    ignores: [
      "dist/**",
      "build/**",
      "node_modules/**",
      "public/**",
      // ignore tooling / data scripts, etc.
      "scripts/**",
      "etl/**",
      "api/**",
      "plugins/**",
    ],
  },

  // 2) JS base rules
  js.configs.recommended,

  // 3) TS rules with type-aware checks
  ...tseslint.configs.recommendedTypeChecked,

  // 4) Our project rules
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: new URL(".", import.meta.url),
      },
    },
    plugins: {
      import: importPlugin,
      "unused-imports": unusedImports,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    settings: {
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
      },
    },
    rules: {
      // ---- import sort
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"], "object", "type"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
          pathGroups: [{ pattern: "@/**", group: "internal", position: "after" }],
          pathGroupsExcludedImportTypes: ["builtin"],
        },
      ],

      // ---- tree shake helpers
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" },
      ],

      // React
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // Keep noise down for now (tighten later if you want)
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-empty": "warn",
    },
  },
];
