import type { IntlTextTemplates } from "./core/types";

export const en: IntlTextTemplates = {
  actions: {
    module: {
      install: {
        moduleId: {
          placeholder: "e.g. semver",
          promote: "Input the module ID (npm package name)",
        },
        version: {
          pick: {
            title: 'pick a version of package "{moduleId}" to install',
          },
          search: {
            canceled: 'Canceled searching version of "{moduleId}".',
            searching: 'Searching versions of package "{moduleId}"...',
          },
        },
      },
    },
    script: {
      ask: {
        parameter: {
          enum: {
            description: "{display}(value = {value})",
          },
          title: 'Give the value of "{fieldKey}"',
          validate: {
            shouldBeNumber: "Must be a valid number",
          },
        },
        script: {
          placeholder: "Input to search",
          title: "Select a script",
        },
        task: {
          label: "{taskName} (taskId={taskId}, startTime={startTime})",
          title: "Select tasks",
        },
      },
    },
  },
  api: {
    invalidParam:
      'API "{api}" invoked with invalid parameter at position {index}.',
  },
  common: {
    ask: {
      no: "No",
      yes: "Yes",
    },
    promote: {
      maybeCorrupted:
        "This extension may be corrupted, please try to reinstall.",
      reportIssue: "Please report an issue.",
    },
  },
  config: {
    check: {
      maybeCrashed: "Configuration may be crashed. Please report an issue.",
    },
  },
  module: {
    install: {
      canceled: {
        message:
          "Module installation of the following module(s) has been canceled:\n{moduleNames}",
      },
      done: {
        message:
          "Successfully installed the following module(s):\n{moduleNames}",
      },
      installing: {
        message: "Installing the following module(s):\n{moduleNames}",
      },
    },
    notFound:
      'Cannot find module "{moduleId}", have you installed it in extension or globally?',
  },
  node: {
    packageManager: {
      noManager:
        "No package manager can be found. You need to install npm or yarn for this extension.\n  If you have installed one of them, please ensure its location can be found in your environment variables.",
      useNpmInstead:
        "Package manager `yarn` cannot be found, use `npm` instead?",
    },
  },
  script: {
    check: {
      cancel: {
        doNotCheckAgain:
          "Do you want to disable start up check? You can enable it in settings.",
        message: "Start up check canceled.",
      },
      progress: {
        checkingStorageFolder: "Checking script plus storage folder...",
        checkingVersions: "Checking vscode version and node version...",
        title: "Script Plus Start Up check",
      },
    },
    create: {
      code: {
        generate: {
          unexpectedArgumentType: "Unexpected string type",
          unexpectedEnumType: "Unexpected enum type",
        },
      },
      validate: {
        name: "Script name should not include the following symbols and white spaces (kebab-case is recommended):\n  {special}",
      },
    },
    delete: {
      confirm:
        'Are you sure to delete script "{scriptname}" ? It will be permanently lost!',
      done: 'Script "{scriptName}" Removed.',
      notFound: 'Script "{script.name}" not found!',
    },
    execute: {
      console: {
        name: "Script Plus script execution output console",
      },
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
    export: {
      dependencies: {
        unresolved:
          'Versions for the following import path can not be resolved, marked as "latest":\n          {dependencies}',
      },
      title: 'Export script "{scriptName}"',
    },
    import: {
      invalid: {
        bundle: 'File "{fileName}" is not a valid script plus bundle.',
      },
      title: "Import script",
    },
    install: {
      abort: {
        message: 'Install script "{scriptName}" aborted.',
      },
      dependencies: {
        promote:
          'Script "{scriptName}" has the following dependencies:\n  {dependencies}\n  Do you want to install them?',
      },
      exists: {
        overwrite: "overwrite",
        promote:
          'Script "{scriptName}" already exists, overwrite or use another name?',
        rename: "rename",
      },
      rename: {
        promote: 'Input a new script name instead of "${scriptName}"',
        validate: {
          exists: 'Script "{value}" already exists',
        },
      },
    },
    invalid: {
      scriptObject: "Invalid script object",
    },
    logging: {
      createPackageJson: "Creating package.json",
      installDependencies: 'dependencies of script "{scriptName}"',
      installModule: "install {moduleName}",
      invalidPackageJson: "Invalid package.json found: {fileName}",
    },
    meta: {
      invalidFile: "Invalid meta file",
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
