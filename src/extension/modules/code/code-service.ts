import * as babel from "@babel/core";
import * as babelPluginCommonJS from "@babel/plugin-transform-modules-commonjs";
import * as babelPluginTypeScript from "@babel/plugin-transform-typescript";
import * as esbuild from "esbuild";
import { tmpdir } from "os";
import { notSupported } from "../../errors/not-supported";
import { intl } from "../../i18n/core/locale";
import { TransformerKind } from "../../../models/configurations";
import type { ModuleImport, UserScript } from "../../../models/script";
import type { ConfigService } from "../../../types/public-api";
import type { AsyncResult } from "../../../common/types/promise";
import { path } from "../../utils/node-utils";
import { invalidUsage } from "../../errors/invalid-usage";
import * as b from "@babel/types";

export interface CodeService {
  transform(code: string, lang: UserScript["lang"]): Promise<TransformResult>;
  analyse(code: string, lang: UserScript["lang"]): Promise<ModuleImport[]>;
}

export interface TransformResult {
  code: string;
}

export interface Transformer {
  readonly type: TransformerKind;
  transform(code: string, lang: UserScript["lang"]): Promise<TransformResult>;
}

export interface ImportAnalyser {
  grabImports(
    lang: UserScript["lang"],
    contents: string
  ): AsyncResult<ModuleImport[]>;
}

const esbuildTransformer = ((): Transformer => {
  return {
    get type() {
      return TransformerKind.esbuild;
    },
    async transform(code, lang) {
      try {
        return await esbuild.transform(code, {
          format: "cjs",
          loader: lang,
        });
      } catch (error) {
        return notSupported(intl("code.transform.failed"));
      }
    },
  };
})();

const esbuildAnalyser: ImportAnalyser = {
  async grabImports(lang, contents) {
    const dependencies: ModuleImport[] = [];
    try {
      await esbuild.build({
        stdin: {
          contents,
          loader: lang,
        },
        bundle: true,
        platform: "node",
        outfile: path.resolve(tmpdir(), "script-plus-esbuild-temp.js"),
        plugins: [
          {
            name: "dependency-analyser-plugin",
            setup(build) {
              build.onResolve({ filter: /.*/ }, ({ path }) => {
                dependencies.push({ path });
                return {
                  external: true,
                };
              });
            },
          },
        ],
      });
    } catch (error) {
      return invalidUsage(intl("code.analyse.syntax.error"));
    }
    return dependencies;
  },
};

const babelAnalyser: ImportAnalyser = {
  async grabImports(lang, contents) {
    const imports: ModuleImport[] = [];
    const ast = await babel.parseAsync(contents, {
      plugins: getBabelLanguagePlugin(lang),
    });
    if (!ast) {
      return invalidUsage(intl("code.analyse.syntax.error"));
    }
    if (b.isFile(ast)) {
      for (const stat of ast.program.body) {
        if (b.isImportDeclaration(stat)) {
          imports.push({ path: stat.source.value });
        }
      }
    }
    return imports;
  },
};

const babelTransformer = ((): Transformer => {
  return {
    get type() {
      return TransformerKind.esbuild;
    },
    async transform(code, lang) {
      try {
        const result = await babel.transformAsync(code, {
          plugins: [...getBabelLanguagePlugin(lang), babelPluginCommonJS],
        });
        return {
          code: result!.code!,
        };
      } catch (error) {
        return notSupported(intl("code.transform.failed"));
      }
    },
  };
})();

const getBabelLanguagePlugin = (lang: string) => {
  return lang === "ts" ? [babelPluginTypeScript] : [];
};

export const createTransformService = (config: ConfigService): CodeService => {
  const transformerMapping: Record<TransformerKind, Transformer> = {
    [TransformerKind.esbuild]: esbuildTransformer,
    [TransformerKind.babel]: babelTransformer,
  };
  const transformerStrategy = async (): Promise<Transformer> => {
    const {
      script: { transformer },
    } = await config.getConfigs();
    return transformerMapping[transformer];
  };
  const analyserStrategy = async () => {
    const {
      script: { transformer },
    } = await config.getConfigs();
    if (transformer === TransformerKind.esbuild) {
      return esbuildAnalyser;
    }
    return babelAnalyser;
  };

  return {
    async transform(code, lang) {
      const transformer = await transformerStrategy();
      return transformer.transform(code, lang);
    },
    async analyse(code, lang) {
      const analyser = await analyserStrategy();
      return analyser.grabImports(lang, code);
    },
  };
};
