type BabelPlugin = (...args: unknown[]) => unknown;
declare module "@babel/plugin-transform-typescript" {
  const plugin: BabelPlugin;
  export default plugin;
}

declare module "@babel/plugin-transform-modules-commonjs" {
  const plugin: BabelPlugin;
  export default plugin;
}
