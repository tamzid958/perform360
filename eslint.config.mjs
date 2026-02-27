import nextConfig from "eslint-config-next";
import tseslint from "typescript-eslint";

const eslintConfig = [
  ...nextConfig,
  {
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default eslintConfig;
