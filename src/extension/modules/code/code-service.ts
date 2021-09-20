import babel from "@babel/core";
import babelPluginCommonJS from "@babel/plugin-transform-modules-commonjs";
import babelPluginTypeScript from "@babel/plugin-transform-typescript";
import esbuild from "esbuild";
import { notSupported } from "../../errors/not-supported";
import { intl } from "../../i18n/core/locale";
import { TransformerKind } from "../../../models/configurations";
import type { UserScript } from "../../../models/script";
import type { ConfigService } from "../../../types/public-api";

export interface CodeService {
  transform(code: string, lang: UserScript["lang"]): Promise<TransformResult>;
}

export interface TransformResult {
  code: string;
}

export interface Transformer {
  readonly type: TransformerKind;
  transform(code: string, lang: UserScript["lang"]): Promise<TransformResult>;
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
const babelTransformer = ((): Transformer => {
  return {
    get type() {
      return TransformerKind.esbuild;
    },
    async transform(code, lang) {
      try {
        const result = await babel.transformAsync(code, {
          plugins: [
            ...(lang === "ts" ? [babelPluginTypeScript] : []),
            babelPluginCommonJS,
          ],
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

export function createTransformService(config: ConfigService): CodeService {
  const mapping: Record<TransformerKind, Transformer> = {
    [TransformerKind.esbuild]: esbuildTransformer,
    [TransformerKind.babel]: babelTransformer,
  };
  async function determine(): Promise<Transformer> {
    const {
      script: { transformer },
    } = await config.getConfigs();
    return mapping[transformer];
  }
  return {
    async transform(code, lang) {
      const transformer = await determine();
      return transformer.transform(code, lang);
    },
  };
}
