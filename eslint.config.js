import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage", "kanban-save-worker"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
  // Disable react-refresh rule for files where mixed exports are intentional
  {
    files: [
      "src/components/ui/**/*.tsx",     // shadcn/ui exports variants alongside components
      "src/context/**/*.tsx",           // Context files export providers + hooks
      "src/hooks/**/*.tsx",             // Hook files may export related utilities
      "src/components/blog/MDXComponents.tsx", // MDX component mappings
      "src/App.tsx",                    // App exports router config
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  }
);
