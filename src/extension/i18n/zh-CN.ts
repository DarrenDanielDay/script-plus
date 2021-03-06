import type { IntlTextTemplates } from "./core/types";

export const zhCN: IntlTextTemplates = {
  actions: {
    module: {
      install: {
        moduleId: {
          placeholder: "例如 semver",
          promote: "输入模块名（npm 包名）",
        },
        version: {
          pick: {
            title: '选择模块"{moduleId}"的一个版本以安装',
          },
          search: {
            canceled: '已取消搜索"{moduleId}"的版本。',
            searching: '正在搜索模块"{moduleId}"的版本……',
          },
        },
      },
    },
    script: {
      ask: {
        parameter: {
          enum: {
            description: "{displayName}(枚举值 = {value})",
          },
          title: '提供参数字段"{fieldKey}"的值',
          validate: {
            shouldBeNumber: "必须为数字",
          },
        },
        script: {
          new: {
            lang: {
              promote: "选择新脚本的编程语言",
            },
            name: {
              duplicate: "脚本名称“{scriptName}”已存在",
              promote: "输入新脚本的名称",
            },
          },
          placeholder: "输入搜索",
          suggestion: {
            lastExecuted: "最近一次执行",
          },
          title: "选择一个脚本",
        },

        task: {
          label: "{taskName}(任务ID={taskId}, 开始运行于{startTime})",
          title: "选择任务",
        },
      },
    },
  },
  api: {
    invalidParam: "调用“{api}”的第{index}个参数类型不正确",
  },
  code: {
    analyse: {
      syntax: {
        error: "脚本可能有语法错误。",
      },
    },
    transform: {
      failed: "代码转译失败。代码中可能有语法错误或不支持的语法。",
    },
  },
  common: {
    ask: {
      no: "否",
      yes: "是",
    },
    promote: {
      maybeCorrupted: "插件可能损坏，请尝试重新安装。",
      reportIssue: "请上报错误。",
    },
  },
  config: {
    check: {
      maybeCrashed: "配置可能崩溃了。请上报错误。",
    },
  },
  module: {
    install: {
      canceled: {
        message: "已取消安装以下模块：\n{moduleNames}",
      },
      done: {
        message: "已成功安装以下模块：\n{moduleNames}",
      },
      installing: {
        message: "正在安装以下模块：\n{moduleNames}",
      },
    },
    notFound: "找不到模块“{moduleId}”，是否在插件内或全局安装过？",
  },
  node: {
    packageManager: {
      noManager:
        "找不到包管理工具。你需要为此插件安装npm或者yarn。\n  如果你安装过，请确保它的位置能在环境变量内找到。",
      useNpmInstead: "找不到包管理工具`yarn`，是否使用`npm`代替？",
    },
  },
  startUp: {
    check: {
      cancel: {
        doNotCheckAgain: "是否要禁用启动检查？您可以在设置中重新启用它。",
        message: "已取消启动检查。",
      },
      progress: {
        checkingStorageFolder: "正在检查内部存储文件夹……",
        checkingVersions: "正在检查vscode版本与node版本……",
        title: "Script Plus启动检查",
      },
    },
    dependency: {
      cancel: {
        problem:
          "已取消安装Script Plus的依赖项。一些功能（例如JavaScript/TypeScript的esbuild转译）可能不可用。",
      },
      install: {
        title: "正在安装Script Plus的依赖项……",
      },
    },
  },
  script: {
    create: {
      code: {
        generate: {
          unexpectedArgumentType: "意料外的参数类型",
          unexpectedEnumType: "意料外的枚举值类型",
        },
      },
      validate: {
        name: "脚本的名称不可包含以下特殊符号和空格（建议使用烤肉串命名）\n  {special}",
      },
    },
    delete: {
      confirm: "您确定要删除“{scriptName}”吗？它将永远丢失！",
      done: "“{scriptName}”已删除",
      notFound: "找不到脚本“{scriptName}”。",
    },
    execute: {
      console: {
        name: "Script Plus脚本执行输出控制台",
      },
      consoleMethodHasToBeFunction: "控制台方法 {methodName} 不是一个函数",
      invalid: {
        script: {
          format: "脚本“{scriptName}”格式不正确，应当导出一个`main`函数。",
          returnValue: "脚本返回值格式不正确",
        },
      },
      task: {
        invalid: {
          notFound: "任务id“{taskId}”不存在！",
          running: "任务id“{taskId}”仍在运行！",
        },
      },
    },
    executeCurrent: {
      cleanUpNow: {
        promote: "是否需要现在清除“{taskName}”（任务ID={taskId}）的副作用？",
      },
    },
    export: {
      dependencies: {
        unresolved:
          "以下导入路径对应包的版本无法解析，作为latest处理：\n  {dependencies}",
      },
      done: "已成功导出脚本“{scriptName}”。",
      title: "导出脚本“{scriptName}”",
    },
    import: {
      invalid: {
        bundle: "文件“{fileName}”不是正确格式的script plus脚本包。",
      },
      title: "导入脚本",
    },
    install: {
      abort: {
        message: "已放弃安装“{scriptName}”",
      },
      dependencies: {
        promote:
          "脚本“{scriptName}”有如下依赖：\n  {dependencies}\n  您希望安装他们吗？",
      },
      exists: {
        overwrite: "覆盖",
        promote: "脚本名称“{scriptName}”已存在，是否覆盖或使用其他名称？",
        rename: "重命名",
      },
      rename: {
        promote: "输入一个新的脚本名称代替原有名称“{scriptName}”",
        validate: {
          exists: "名称“{value}”已存在",
        },
      },
    },
    invalid: {
      scriptObject: "不正确的script对象",
    },
    logging: {
      createPackageJson: "正在创建package.json",
      installDependencies: "安装脚本“{scriptName}”的依赖项",
      installModule: "安装模块{moduleName}",
      invalidPackageJson: "发现了不正确的package.json：{fileName}",
    },
    meta: {
      invalidFile: "不正确格式的元数据文件",
    },
  },
  webview: {
    attach: {
      moreThanOnce: "不能多次连接事件处理器",
      noPanel: "请先打开webview！",
    },
    reload: {
      beforeOpen: "请先打开面板！",
      dev: {
        serverNotReady: "当前开发服务器未就绪",
      },
    },
  },
};
