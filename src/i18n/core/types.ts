import type { ExecutionTask } from "../../models/execution-task";
import type {
  CreateIntlTextKeys,
  CreateTemplateType,
  GetTemplateValue,
} from "../../utils/types/intl-types";

export type IntlTextKeys = CreateIntlTextKeys<IntlTextTemplates>;
export type IntlTextTemplates = CreateTemplateType<IntlTextFields>;
export type TemplateValues<K extends IntlTextKeys> = GetTemplateValue<
  IntlTextFields,
  K
>;
export interface IntlTextFields {
  api: {
    invalidParam: [{ index: number; api: string }];
  };
  common: {
    promote: {
      reportIssue: [];
    };
    ask: {
      yes: [];
      no: [];
    };
  };
  actions: {
    script: {
      ask: {
        script: {
          placeholder: [];
          title: [];
        };
        parameter: {
          title: [{ fieldKey: string }];
          enum: {
            description: [{ displayName: string; value: string }];
          };
          validate: {
            shouldBeNumber: [];
          };
        };
        task: {
          label: [ExecutionTask];
          title: [];
        };
      };
    };
    module: {
      install: {
        moduleId: {
          promote: [];
          placeholder: [];
        };
        version: {
          search: {
            searching: [{ moduleId: string }];
            canceled: [{ moduleId: string }];
          };
          pick: {
            title: [{ moduleId: string }];
          };
        };
      };
    };
  };
  config: {
    check: {
      maybeCrashed: [];
    };
  };
  script: {
    logging: {
      createPackageJson: [];
      installModule: [{ moduleName: string }];
      invalidPackageJson: [{ fileName: string }];
      installDependencies: [{ scriptName: string }];
    };
    invalid: {
      scriptObject: [];
    };
    check: {
      progress: {
        title: [];
        checkingStorageFolder: [];
        checkingVersions: [];
      };
    };
    create: {
      code: {
        generate: {
          unexpectedEnumType: [];
          unexpectedArgumentType: [];
        };
      };
      validate: {
        name: [{ special: string }];
      };
    };
    delete: {
      confirm: [{ scriptName: string }];
      notFound: [{ scriptName: string }];
      done: [{ scriptName: string }];
    };
    meta: {
      invalidFile: [];
    };
    execute: {
      consoleMethodHasToBeFunction: [{ methodName: string }];
      invalid: {
        script: {
          format: [{ scriptName: string }];
          returnValue: [];
        };
      };
      task: {
        invalid: {
          notFound: [{ taskId: string }];
          running: [{ taskId: string }];
        };
      };
    };
    executeCurrent: {
      cleanUpNow: {
        promote: [ExecutionTask];
      };
    };
    import: {
      title: [];
      invalid: {
        bundle: [{ fileName: string }];
      };
    };
    export: {
      title: [{ scriptName: string }];
      dependencies: {
        unresolved: [{ dependencies: string }];
      };
    };
    install: {
      exists: {
        promote: [{ scriptName: string }];
        overwrite: [];
        rename: [];
      };
      rename: {
        promote: [{ scriptName: string }];
        validate: {
          exists: [{ value: string }];
        };
      };
      abort: {
        message: [{ scriptName: string }];
      };
      dependencies: {
        promote: [{ scriptName: string; dependencies: string }];
      };
    };
  };
  module: {
    notFound: [{ moduleId: string }];
    install: {
      done: {
        message: [{ moduleName: string }];
      };
    };
  };
  node: {
    packageManager: {
      noManager: [];
      useNpmInstead: [];
    };
  };
  webview: {
    reload: {
      beforeOpen: [];
      dev: {
        serverNotReady: [];
      };
    };
    attach: {
      moreThanOnce: [];
      noPanel: [];
    };
  };
}
