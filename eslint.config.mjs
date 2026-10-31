import { defineConfig, globalIgnores } from "eslint/config";
import eslintReact from "@eslint-react/eslint-plugin";
import noAnonymousDefaultExport from "@edidi-hq/core/lint/no-anonymous-default-export";
import nextPlugin from "@next/eslint-plugin-next";
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

// eslint-react's preset repeats the React team's hooks rules under its own
// name. The React team's plugin stays the one source, so each overlapping
// eslint-react rule is switched off. The list comes from eslint-react's own
// overlap preset, not a copy.
const eslintReactHooksOverlapOff = Object.fromEntries(
  Object.keys(eslintReact.configs["disable-conflict-eslint-plugin-react-hooks"].rules).map(
    (rule) => [rule.replace(/^react-hooks\//, "@eslint-react/"), "off"],
  ),
);

const eslintConfig = defineConfig([
  // Base presets, composed directly (the same base as the app repo — its
  // docs/conventions/linting.md explains each piece). This used to be
  // `eslint-config-next`, which bundles unmaintained React, import and
  // accessibility plugins that pin a `minimatch` with a security advisory.
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
    },
  },
  {
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      local: { rules: { "no-anonymous-default-export": noAnonymousDefaultExport } },
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactHooks.configs.recommended.rules,
      "jsx-a11y/alt-text": ["warn", { elements: ["img"], img: ["Image"] }],
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
      "local/no-anonymous-default-export": "warn",
    },
  },
  {
    ...eslintReact.configs["recommended-typescript"],
    files: ["**/*.{jsx,tsx}"],
    rules: {
      ...eslintReact.configs["recommended-typescript"].rules,
      ...eslintReactHooksOverlapOff,
      // `react/display-name` ran under the old bundle; this is its successor.
      "@eslint-react/no-missing-component-display-name": "error",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude Code worktree checkouts (gitignored; ESLint flat config does not read .gitignore).
    ".claude/**",
  ]),
]);

export default eslintConfig;
