import { createInstance } from 'i18next';
import english from './locales/en.json';
import french from './locales/fr.json';

export const i18n = createInstance();
void i18n.init({
  resources: { en: { translation: english }, fr: { translation: french } },
  lng: 'en',
  fallbackLng: 'en',
  initAsync: false,
  interpolation: { escapeValue: false },
});
