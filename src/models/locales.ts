import { die } from "taio/build/utils/internal/exceptions";
import { isEnumOf } from "taio/build/utils/validator/enum";

export enum Locales {
  English = "en",
  SimplifiedChinese = "zh-CN",
}

export const isLocales = isEnumOf(Locales);

export const normalizeLocale = (vscodeEnvLocale: string): Locales => {
  vscodeEnvLocale = vscodeEnvLocale.toLowerCase();
  if (vscodeEnvLocale === "zh-cn") {
    return Locales.SimplifiedChinese;
  }
  if (vscodeEnvLocale === "en") {
    return Locales.English;
  }
  return die("Not supported locale");
};
