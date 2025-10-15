import '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-bootstrap.scss';
import 'bootstrap';
import './styles.scss';
import i18next from 'i18next';
import I18NextVue from 'i18next-vue';
import { createApp } from 'vue';
import App from './App.vue';
import localeEn from './assets/locales/en/translation.json';
import localeFr from './assets/locales/fr/translation.json';
import { router } from './router/index.js';

// optionally lazy load translation JSON files
i18next.init({
  // the translations
  // (tip move them in a JSON file and import them,
  // backend: {
  //     loadPath: 'assets/locales/{{lng}}/{{ns}}.json',
  // },
  resources: {
    en: { translation: localeEn },
    fr: { translation: localeFr },
  },
  //   ns: ['translation'],
  //   defaultNS: 'translation',
  lng: 'en',
  fallbackLng: 'en',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
});

createApp(App).use(I18NextVue, { i18next }).use(router).mount('#app');
