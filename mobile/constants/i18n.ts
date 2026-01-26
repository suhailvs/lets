// https://docs.expo.dev/guides/localization/
import { I18n } from 'i18n-js';
const translations = {
  en: { offerings: 'Offerings',wants:'Wants', newoffering:'New Offering', newwant: 'New Want',myaccount:'My Account',transactions:'Transactions' },
  ml: { offerings: 'വില്പനയ്ക്കുള്ളത്',wants:'വാങ്ങാനുള്ളത്', newoffering:'പുതിയ വില്പന', newwant:'പുതിയ വാങ്ങൽ',myaccount:'എന്റെ അക്കൗണ്ട്',transactions:'ഇടപാടുകൾ' },
};
const i18n = new I18n(translations);
i18n.locale = 'ml'; // getLocales()[0].languageCode ?? 'en';
// When a value is missing from a language it'll fall back to another language with the key present.
i18n.enableFallback = true;
export default i18n;