/** @type {import('@storybook/nextjs-vite').StorybookConfig} */
const config = {
  stories: ["./docs/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
}

module.exports = config
