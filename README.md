# script-plus

[简体中文](./docs/README.zh-CN.md)

A simple JS/TS script runner with the ability of calling vscode API.

In short, this extension is a [`Tempermonkey`](https://www.tampermonkey.net/) of `vscode`.

## Requirements

- [`Nodejs`](https://nodejs.org/) >= 14.15, higher versions are recommended.
- [`Yarn`](https://yarnpkg.org) >= 1.22, < 2.0, if you want to use yarn as package manager
- [`Visual Studio Code`](https://code.visualstudio.com) `@latest`

## Usage

Click icon on side bar (known as activity bar) to open webview UI and explore the features.

You can also use [`commands`](https://code.visualstudio.com/api/references/contribution-points#contributes.commands) to access all features of this extension.

In the scripts you can use global modules managed by `npm` and `yarn`.

Be sure your code is written in **ONE SINGLE SCRIPT FILE**. This means that relative module imports (except type-only imports) are not allowed.

**Enjoy!**
