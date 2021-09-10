import type { IntlTextTemplates } from "./core/types";

export const en: IntlTextTemplates = {
  components: {
    picker: {
      script: {
        empty: "No Script",
        label: "Script name",
      },
    },
    parameterEditor: {
      description: {
        label: "script description",
        placeholder: "Input some description for this script",
      },
      configKey: {
        label: "Add new",
        new: {
          label: "config key",
          placeholder: "Input new key",
        },
      },
      validate: {
        exist: '"{newFieldName}" already exist.',
      },
      fieldEditor: {
        type: {
          label: "type",
        },
        picker: {
          label: "config keys",
        },
        defaultValue: {
          label: "default value",
        },
        enum: {
          delete: {
            tooltip: "Delete selected enum",
          },
          valueEditor: {
            validate: {
              name: {
                exists: 'name "{enumKey}" already exists',
                startWithWords: "name should start with words",
              },
              value: {
                exists: "value {enumValue} already exists",
                notEmpty: "value should not be empty",
              },
            },
            name: {
              label: "enum name",
            },
            value: {
              label: "enum value",
            },
            display: {
              label: "enum display",
            },
            add: {
              tooltip: "Add enum value definition",
            },
          },
        },
        description: {
          label: "description",
          placeholder: "A description for this config field",
        },
      },
    },
    skeleton: {
      loading: "loading",
    },
  },
  menu: {
    manageModules: "Manage Modules",
    manageScript: "Manage Script",
    runScript: "Run Script",
  },
  runner: {
    console: {
      title: "Console",
    },
    mount: {
      button: "Mount",
      tooltip: "Mount your script to background for event listeners.",
    },
    run: {
      cleaning: "Cleaning",
      running: "Running",
      apply: "Run",
    },
    cleanUp: {
      apply: "Clean Up",
      cleaning: "Cleaning",
    },
  },
  manager: {
    script: {
      import: {
        tooltip: "import scripts",
      },
      delete: {
        tooltip: "delete",
      },
      edit: {
        tooltip: "edit",
      },
      export: {
        tooltip: "export",
      },
      new: {
        language: {
          label: "language",
        },
        name: {
          label: "new script name",
        },
      },
      params: {
        title: 'Edit config of script "{scriptName}"',
      },
      picker: {
        label: "script name",
      },
      refresh: {
        tooltip: "refresh list",
      },
    },
    module: {
      id: {
        label: "npm package/module name",
      },
      version: {
        label: "version",
      },
      install: {
        installing: "Installing",
        apply: "Install",
      },
      scope: {
        label: "install scope",
        mapping: {
          global: "global",
          local: "extension",
        },
      },
      options: {
        installTypes: "also install `{moduleId}` for typings",
      },
    },
  },
};
