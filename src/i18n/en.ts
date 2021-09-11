import type { IntlTextTemplates } from "./core/types";

export const en: IntlTextTemplates = {
  api: {
    invalidParam:
      'API "{api}" invoked with invalid parameter at position {index}.',
  },
  actions: {
    module: {
      install: {
        moduleId: {
          placeholder: "e.g. semver",
          promote: "Input the module ID (npm package name)",
        },
        version: {
          search: {
            searching: 'Searching versions of package "{moduleId}"...',
            canceled: 'Canceled searching version of "{moduleId}".',
          },
          pick: {
            title: 'pick a version of package "{moduleId}" to install',
          },
        },
      },
    },
    script: {
      ask: {
        script: {
          placeholder: "Input to search",
          title: "Select a script",
        },
        parameter: {
          title: 'Give the value of "{fieldKey}"',
          enum: {
            description: `{display}(value = {value})`,
          },
          validate: {
            shouldBeNumber: "Must be a valid number",
          },
        },
        task: {
          label: "{taskName} (taskId={taskId}, startTime={startTime})",
          title: "Select tasks",
        },
      },
    },
  },
  common: {
    promote: {
      reportIssue: "Please report an issue.",
    },
    ask: {
      yes: "Yes",
      no: "No",
    },
  },
  config: {
    check: {
      maybeCrashed: "Configuration may be crashed. Please report an issue.",
    },
  },
  script: {
    check: {
      progress: {
        title: "Script Plus Start Up check",
        checkingStorageFolder: "Checking script plus storage folder...",
        checkingVersions: "Checking vscode version and node version...",
      },
    },
    import: {
      title: "Import script",
      invalid: {
        bundle: 'File "{fileName}" is not a valid script plus bundle.',
      },
    },
    export: {
      title: 'Export script "{scriptName}"',
      dependencies: {
        unresolved: `Versions for the following import path can not be resolved, marked as \"latest\":
{dependencies}`,
      },
    },
    logging: {
      createPackageJson: "Creating package.json",
      installModule: "install {moduleName}",
      installDependencies: 'dependencies of script "{scriptName}"',
      invalidPackageJson: "Invalid package.json found: {fileName}",
    },
    invalid: {
      scriptObject: "Invalid script object",
    },
    create: {
      code: {
        generate: {
          unexpectedEnumType: "Unexpected enum type",
          unexpectedArgumentType: "Unexpected string type",
        },
      },
      validate: {
        name: `Script name should not include the following symbols and white spaces (kebab-case is recommended):
{special}`,
      },
    },
    delete: {
      confirm:
        'Are you sure to delete script "{scriptname}" ? It will be permanently lost!',
      notFound: 'Script "{script.name}" not found!',
      done: 'Script "{scriptName}" Removed.',
    },
    meta: {
      invalidFile: "Invalid meta file",
    },
    execute: {
      consoleMethodHasToBeFunction:
        "console method {methodName} is not a function.",
      invalid: {
        script: {
          format:
            'Script "{scriptName}" is not written in expected format, expected an exported function `main`.',
          returnValue: "Invalid script return value!",
        },
      },
      task: {
        invalid: {
          notFound: "Task id {taskId} does not exist!",
          running: "Task id {taskId} is still running!",
        },
      },
    },
    executeCurrent: {
      cleanUpNow: {
        promote:
          'Do you want to clean up side effect of task "{taskName}" (taskId={taskId}) now?',
      },
    },
    install: {
      exists: {
        promote:
          'Script "{scriptName}" already exists, overwrite or use another name?',
        overwrite: "overwrite",
        rename: "rename",
      },
      rename: {
        promote: 'Input a new script name instead of "${scriptName}"',
        validate: {
          exists: 'Script "{value}" already exists',
        },
      },
      abort: {
        message: 'Install script "{scriptName}" aborted.',
      },
      dependencies: {
        promote: `Script "{scriptName}" has the following dependencies:
{dependencies}
Do you want to install them?`,
      },
    },
  },
  module: {
    notFound:
      'Cannot find module "{moduleId}", have you installed it in extension or globally?',
    install: {
      done: { message: "Module {moduleName} installed." },
    },
  },
  node: {
    packageManager: {
      noManager: `No package manager can be found. You need to install npm or yarn for this extension.
If you have installed one of them, please ensure its location can be found in your environment variables.`,
      useNpmInstead:
        "Package manager `yarn` cannot be found, use `npm` instead?",
    },
  },
  webview: {
    attach: {
      moreThanOnce: "Cannot attach handler more than once!",
      noPanel: "Please open webview first!",
    },
    reload: {
      beforeOpen: "Please open panel first!",
      dev: {
        serverNotReady: "Development Server is not ready currently",
      },
    },
  },
};
