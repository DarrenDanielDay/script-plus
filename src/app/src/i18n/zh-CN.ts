import type { IntlTextTemplates } from "./core/types";

export const zhCN: IntlTextTemplates = {
  components: {
    parameterEditor: {
      configKey: {
        label: "添加新的",
        new: {
          label: "配置键",
          placeholder: "输入新的键名",
        },
      },
      description: {
        label: "脚本描述",
        placeholder: "输入一些文本来描述该脚本",
      },
      fieldEditor: {
        defaultValue: {
          label: "默认值",
        },
        description: {
          label: "描述",
          placeholder: "描述此配置参数项",
        },
        enum: {
          delete: {
            tooltip: "删除选中的枚举项",
          },
          valueEditor: {
            add: {
              tooltip: "添加枚举值定义",
            },
            display: {
              label: "枚举显示名称",
            },
            name: {
              label: "枚举名称",
            },
            validate: {
              name: {
                exists: "名称“{enumName}”已存在",
                startWithWords: "名称应当以字母开头",
              },
              value: {
                exists: "枚举值“{enumValue}”已存在",
                notEmpty: "枚举值不能为空",
              },
            },
            value: {
              label: "枚举值",
            },
          },
        },
        picker: {
          label: "配置键",
        },
        type: {
          label: "类型",
        },
      },
      validate: {
        exist: "“{newFieldName}”已存在",
      },
    },
    picker: {
      script: {
        empty: "暂无脚本",
        label: "脚本名称",
      },
    },
    skeleton: {
      loading: "加载中",
    },
  },
  manager: {
    module: {
      id: {
        label: "npm 包/模块名",
      },
      install: {
        apply: "安装",
        installing: "正在安装",
      },
      options: {
        installTypes: "同时安装类型库`{moduleId}`",
      },
      scope: {
        label: "安装位置",
        mapping: {
          global: "全局",
          local: "插件内",
        },
      },
      version: {
        label: "版本",
      },
    },
    script: {
      delete: {
        tooltip: "删除",
      },
      edit: {
        tooltip: "修改",
      },
      export: {
        tooltip: "导出",
      },
      import: {
        tooltip: "导入脚本",
      },
      new: {
        language: {
          label: "语言",
        },
        name: {
          label: "新脚本名称",
        },
      },
      params: {
        title: "修改脚本“{scriptName}”配置",
      },
      picker: {
        label: "脚本名称",
      },
      refresh: {
        tooltip: "刷新列表",
      },
    },
  },
  menu: {
    manageModules: "管理模块",
    manageScript: "管理脚本",
    runScript: "运行脚本",
  },
  runner: {
    cleanUp: {
      apply: "清理",
      cleaning: "清理中",
    },
    console: {
      title: "控制台",
    },
    mount: {
      button: "挂载",
      tooltip: "将你的脚本挂载到后台，使事件监听持续生效。",
    },
    run: {
      apply: "运行",
      cleaning: "清理中",
      running: "运行中",
    },
  },
};
