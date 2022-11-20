import type { IntlTextTemplates } from "./core/types";

export const en: IntlTextTemplates = {
  components: {
    parameterEditor: {
      configKey: {
        label: "Add new",
        new: {
          label: "config key",
          placeholder: "Input new key",
        },
      },
      description: {
        label: "script description",
        placeholder: "Input some description for this script",
      },
      fieldEditor: {
        defaultValue: {
          label: "default value",
        },
        description: {
          label: "description",
          placeholder: "A description for this config field",
        },
        enum: {
          delete: {
            tooltip: "Delete selected enum",
          },
          valueEditor: {
            add: {
              tooltip: "Add enum value definition",
            },
            display: {
              label: "enum display",
            },
            name: {
              label: "enum name",
            },
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
            value: {
              label: "enum value",
            },
          },
        },
        picker: {
          label: "config keys",
        },
        type: {
          label: "type",
        },
      },
      validate: {
        exist: '"{newFieldName}" already exist.',
      },
    },
    picker: {
      script: {
        empty: "No Script",
        label: "Script name",
      },
    },
    skeleton: {
      loading: "loading",
    },
  },
  manager: {
    module: {
      id: {
        label: "npm package/module name",
      },
      install: {
        apply: "Install",
        installing: "Installing",
      },
      options: {
        installTypes: "also install `{moduleId}` for typings",
      },
      scope: {
        label: "install scope",
        mapping: {
          global: "global",
          local: "extension",
        },
      },
      version: {
        label: "version",
      },
    },
    script: {
      delete: {
        tooltip: "delete",
      },
      edit: {
        tooltip: "edit",
      },
      explore: {
        rootFolder: "open folder of user scripts",
      },
      export: {
        tooltip: "export",
      },
      import: {
        tooltip: "import scripts",
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
  },
  menu: {
    manageModules: "Manage Modules",
    manageScript: "Manage Script",
    runScript: "Run Script",
  },
  runner: {
    cleanUp: {
      apply: "Clean Up",
      cleaning: "Cleaning",
    },
    console: {
      title: "Console",
    },
    mount: {
      button: "Mount",
      tooltip: "Mount your script to background for event listeners.",
    },
    preset: {
      auto: {
        description: "Add auto script parameter on startup.",
        name: {
          label: "the preset name",
          hint: " Leaving it empty means to save raw parameter.",
        },
        scope: "The settings scope.",
        title: "Save as Auto Run Parameter",
      },
      label: "Preset",
      load: {
        one: "Load Preset",
      },
      save: {
        as: "Save as new preset",
        help: "A unique name for the template parameter.",
        name: "Preset Template Name",
        title: "Save as Preset Template",
      },
    },
    run: {
      apply: "Run",
      cleaning: "Cleaning",
      running: "Running",
    },
  },
};
