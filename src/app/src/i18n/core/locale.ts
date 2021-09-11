import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { BehaviorSubject } from "rxjs";
import type { Assertion } from "taio/build/utils/validator/common";
import { isString } from "taio/build/utils/validator/primitive";
import { assertThat, record } from "taio/build/utils/validator/utils";
import { createCleanUp, setStateEffect } from "../../utils/well-typed";
import { en } from "../en";
import { zhCN } from "../zh-CN";
import { createMessages } from "../../../../common/i18n-factory";
import type { IntlTextKeys, TemplateValues } from "./types";
import { isLocales, Locales } from "../../../../models/locales";

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

export const messages: Record<Locales, Record<IntlTextKeys, string>> = {
  [Locales.English]: createMessages(en),
  [Locales.SimplifiedChinese]: createMessages(zhCN),
};
const assertIsStringRecord: Assertion<Record<string, string>> = assertThat(
  record(isString)
);
export const useTypedIntl = () => {
  const intl = useIntl();
  function typedIntl<K extends IntlTextKeys>(
    id: K,
    ...values: TemplateValues<K>
  ) {
    const fillValues = values[0] ?? {};
    assertIsStringRecord(fillValues);
    return intl.formatMessage({ id }, fillValues);
  }
  return typedIntl;
};
