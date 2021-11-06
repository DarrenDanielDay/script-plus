// @ts-check
// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration
/** @type {import("snowpack").SnowpackUserConfig } */
const config = {
  mount: {
    src: { url: "/" },
    "../models": { url: "/" },
    "../common": { url: "/" },
  },
  plugins: ["@snowpack/plugin-react-refresh"],
  packageOptions: {
    /* ... */
  },
  optimize: {
    sourcemap: "both",
    minify: true,
    treeshake: true,
  },
  devOptions: {
    open: "none",
    output: "stream",
    hmr: true,
  },
  buildOptions: {
    clean: true,
    out: "../../out/ui",
    baseUrl: "./",
  },
};

export default config;
