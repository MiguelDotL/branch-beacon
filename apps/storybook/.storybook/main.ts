import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../stories/**/*.stories.@(ts|tsx|mdx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
  ],
  // public/ holds mockServiceWorker.js — generated once via `npx msw init public/ --save`
  staticDirs: ["../public"],
  typescript: {
    // Enables TS literal-union types to drive Storybook control options.
    reactDocgen: "react-docgen-typescript",
  },
};

export default config;
