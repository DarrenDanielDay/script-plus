# script-plus

一个可以简单的可通过运行 JS/TS 脚本调用 vscode API 的插件。

简单来说，此插件是`vscode`的[`油猴脚本`](https://www.tampermonkey.net/).

## 环境要求

- [`Nodejs`](https://nodejs.org/) >= 14.15, 建议使用更高的版本。
- [`Yarn`](https://yarnpkg.org) >= 1.22, < 2.0, 如果你希望使用 yarn 作为包管理工具
- [`Visual Studio Code`](https://code.visualstudio.com) `@latest` 最新

## 使用

点击侧边栏的图标 (也叫 activity bar) 来打开 webview 界面，然后您可以自行探索功能。

您也可以通过[`命令`](https://code.visualstudio.com/api/references/contribution-points#contributes.commands)来使用此插件的所有的功能。

在脚本中，您可以使用通过`npm`或者`yarn`安装的全局模块。

请确保您脚本的所有代码写在**单个脚本文件内**。这意味着相对模块导入（除了仅类型导入）是不允许的。

**尽情享受吧！**
