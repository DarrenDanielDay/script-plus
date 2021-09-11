import type { IntlTextTemplates } from "./core/types";

export const zhCN: IntlTextTemplates = {
  api: {
    invalidParam: "调用“{api}”的第{index}个参数类型不正确",
  },
  actions: {
    module: {
      install: {
        moduleId: {
          placeholder: "例如 semver",
          promote: "输入模块名（npm 包名）",
        },
        version: {
          search: {
            searching: '正在搜索模块"{moduleId}"的版本……',
            canceled: '已取消搜索"{moduleId}"的版本。',
          },
          pick: {
            title: '选择模块"{moduleId}"的一个版本以安装',
          },
        },
      },
    },
    script: {
      ask: {
        script: {
          placeholder: "输入搜索",
          title: "选择一个脚本",
        },
        parameter: {
          title: '提供参数字段"{fieldKey}"的值',
          enum: {
            description: `{display}(枚举值 = {value})`,
          },
          validate: {
            shouldBeNumber: "必须为数字",
          },
        },
        task: {
          label: "{taskName}(任务ID={taskId}, 开始运行于{startTime})",
          title: "选择任务",
        },
      },
    },
  },
  common: {
    promote: {
      reportIssue: "请上报错误。",
    },
    ask: {
      yes: "是",
      no: "否",
    },
  },
  config: {
    check: {
      maybeCrashed: "配置可能崩溃了。请上报错误。",
    },
  },
  script: {
    delete: {
      confirm: "您确定要删除“{scriptName}”吗？它将永远丢失！",
      notFound: "找不到脚本“{scriptName}”。",
      done: "“{scriptName}”已删除",
    },
    check: {
      progress: {
        title: "Script Plus启动检查",
        checkingStorageFolder: "正在检查内部存储文件夹……",
        checkingVersions: "正在检查vscode版本与node版本……",
      },
    },
    create: {
      code: {
        generate: {
          unexpectedArgumentType: "意料外的参数类型",
          unexpectedEnumType: "意料外的枚举值类型",
        },
      },
      validate: {
        name: `脚本的名称不可包含以下特殊符号和空格（建议使用烤肉串命名）
{special}`,
      },
    },
    execute: {
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
    import: {
      invalid: {
        bundle: "文件“{fileName}”不是正确格式的script plus脚本包。",
      },
      title: "导入脚本",
    },
    export: {
      title: "导出脚本“{scriptName}”",
      dependencies: {
        unresolved: `以下导入路径对应包的版本无法解析，作为latest处理：
{dependencies}`,
      },
    },
    logging: {
      createPackageJson: "正在创建package.json",
      installModule: "安装模块{moduleName}",
      installDependencies: "安装脚本“{scriptName}”的依赖项",
      invalidPackageJson: "发现了不正确的package.json：{fileName}",
    },
    invalid: {
      scriptObject: "不正确的script对象",
    },
    install: {
      abort: { message: "已放弃安装“{scriptName}”" },
      dependencies: {
        promote: `脚本“{scriptName}”有如下依赖：
{dependencies}
您希望安装他们吗？`,
      },
      exists: {
        promote: "脚本名称“{scriptName}”已存在，是否覆盖或使用其他名称？",
        overwrite: "覆盖",
        rename: "重命名",
      },
      rename: {
        promote: "输入一个新的脚本名称代替原有名称“{scriptName}”",
        validate: {
          exists: "名称“{value}”已存在",
        },
      },
    },
    meta: {
      invalidFile: "不正确格式的元数据文件",
    },
  },
  module: {
    notFound: "找不到模块“{moduleId}”，是否在插件内或全局安装过？",
    install: { done: { message: "模块{moduleName}安装完成。" } },
  },
  node: {
    packageManager: {
      noManager: `找不到包管理工具。你需要为此插件安装npm或者yarn。
如果你安装过，请确保它的位置能在环境变量内找到。`,
      useNpmInstead: "找不到包管理工具`yarn`，是否使用`npm`代替？",
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
