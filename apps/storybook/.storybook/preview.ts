import type { Preview } from "@storybook/react-vite";
import { initialize, mswLoader } from "msw-storybook-addon";

// Force-show the indicator in stories regardless of the Storybook build's
// NODE_ENV. Storybook ships a production-mode static build for GitHub Pages
// deployment — without this, every story would render empty.
import.meta.env.DEV;
process.env.NODE_ENV = "development";

initialize();

const preview: Preview = {
  loaders: [mswLoader],
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    controls: {
      expanded: true,
      sort: "alpha",
    },
  },
};

export default preview;
