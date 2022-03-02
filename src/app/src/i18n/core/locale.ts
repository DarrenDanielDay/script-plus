import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { BehaviorSubject } from "rxjs";
import type { Assertion } from "taio/build/utils/validator/common";
import { isString } from "taio/build/utils/validator/primitive";
import { assertThat, record } from "taio/build/utils/validator/utils";
import { createCleanUp, setStateEffect } from "../../utils/well-typed";
import { createMessages } from "../../../../common/shared-utils";
import type { IntlTextKeys, IntlTextTemplates, TemplateValues } from "./types";
import { isLocales, Locales } from "../../../../models/locales";
import { die } from "taio/build/utils/internal/exceptions";

const defaultLocale = document.querySelector("html")?.lang;
const locale$ = (window.$locale = new BehaviorSubject<Locales>(
  isLocales(defaultLocale) ? defaultLocale : Locales.English
));
export const useLocale = () => {
  const [locale, setLocale] = useState<Locales>(locale$.value);
  useEffect(
    () => createCleanUp(locale$.subscribe(setStateEffect(setLocale))),
    []
  );
  return locale;
};

type Messages = Record<IntlTextKeys, string>;
type MessagesOfLocales = Record<Locales, Messages>;
const lazyLoadLocaleMessages = (() => {
  const loadedLocale: Partial<MessagesOfLocales> = {};
  const load = async (locale: Locales): Promise<IntlTextTemplates> => {
    switch (locale) {
      case Locales.English:
        const en = await import("../en");
        return en.en;
      case Locales.SimplifiedChinese:
        const zhCN = await import("../zh-CN");
        return zhCN.zhCN;
      default:
        return die();
    }
  };
  return async (locale: Locales) => {
    const loaded = loadedLocale[locale];
    if (loaded) {
      return loaded;
    }
    return (loadedLocale[locale] = createMessages(await load(locale)));
  };
})();

export const useLazyLoadLocaleMessages = (locale: Locales) => {
  const [messages, setMessages] = useState<Messages>();
  useEffect(() => {
    lazyLoadLocaleMessages(locale).then(setMessages);
  }, [locale]);
  return messages;
};

const assertIsStringRecord: Assertion<Record<string, string>> = assertThat(
  record(isString)
);
export const useTypedIntl = () => {
  const intl = useIntl();
  const typedIntl = <K extends IntlTextKeys>(
    id: K,
    ...values: TemplateValues<K>
  ) => {
    const fillValues = values[0] ?? {};
    assertIsStringRecord(fillValues);
    return intl.formatMessage({ id }, fillValues);
  };
  return typedIntl;
};
