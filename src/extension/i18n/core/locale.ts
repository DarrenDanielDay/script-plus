import * as vscode from "vscode";
import { createIntl } from "@formatjs/intl";
import type { Assertion } from "taio/build/utils/validator/common";
import { isString } from "taio/build/utils/validator/primitive";
import { assertThat, record } from "taio/build/utils/validator/utils";
import type { IntlTextKeys, TemplateValues } from "./types";
import { Locales, normalizeLocale } from "../../../models/locales";
import { createMessages } from "../../../common/i18n-factory";
import { en } from "../en";
import { zhCN } from "../zh-CN";
import {
  askForOptions,
  getConfigs,
  updateConfig,
} from "../../utils/vscode-utils";

export const getLocale = (() => {
  let warned = false;
  return () => {
    const language = vscode.env.language;
    try {
      return normalizeLocale(language);
    } catch (error) {
      if (!warned && getConfigs().startUp.warnLocale) {
        askForOptions(
          `Locale "${language}" is currently not surpported. [Help for translation](https://github.com/DarrenDanielDay/script-plus)`,
          false,
          "Don't show again"
        ).then((value) => {
          if (value === "Don't show again") {
            updateConfig({ startUp: { warnLocale: false } });
          }
        });
        warned = true;
      }
      return Locales.English;
    }
  };
})();

export const intl = (() => {
  const messages: Record<Locales, Record<IntlTextKeys, string>> = {
    [Locales.English]: createMessages(en),
    [Locales.SimplifiedChinese]: createMessages(zhCN),
  };
  const locale = getLocale();
  const intl = createIntl({
    locale,
    messages: messages[locale],
  });
  const assertIsStringRecord: Assertion<Record<string, string>> = assertThat(
    record(isString)
  );
  const typedIntl = <K extends IntlTextKeys>(
    id: K,
    ...values: TemplateValues<K>
  ) => {
    const fillValues = values[0] ?? {};
    assertIsStringRecord(fillValues);
    return intl.formatMessage({ id }, fillValues);
  };
  return typedIntl;
})();
