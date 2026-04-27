import type { Preview } from "@storybook/react-vite";
import { initialize, mswLoader } from "msw-storybook-addon";

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
