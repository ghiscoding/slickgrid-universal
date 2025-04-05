import Aurelia from 'aurelia';
import 'bootstrap';
// Css files imported in this main file are NOT processed by style-loader
// They are for sharedStyles in shadowDOM.
// However, css files imported in other js/ts files are processed by style-loader.
// import shared from './shared.css';
import { AureliaSlickGridConfiguration } from 'aurelia-slickgrid';
import DOMPurify from 'dompurify';
import { I18nConfiguration } from '@aurelia/i18n';
// import Fetch from 'i18next-fetch-backend';
import { RouterConfiguration } from '@aurelia/router';

import { MyApp } from './my-app';
import { DateFormatValueConverter, DecimalValueConverter, StringifyValueConverter } from './examples/resources/value-converters';

// dynamic components that can be enhanced in Example 19, 26
import { CustomPagerComponent } from './examples/slickgrid/example42-pager';
import { CustomTitleFormatter } from './examples/slickgrid/custom-title-formatter';
import { EditorSelect } from './examples/slickgrid/editor-select';
import { FilterSelect } from './examples/slickgrid/filter-select';
import { Example19DetailView } from './examples/slickgrid/example19-detail-view';
import { Example19Preload } from './examples/slickgrid/example19-preload';
import { Example45DetailView } from './examples/slickgrid/example45-detail-view';
import { Example45Preload } from './examples/slickgrid/example45-preload';

import localeEn from './assets/i18n/en/aurelia-slickgrid.json';
import localeFr from './assets/i18n/fr/aurelia-slickgrid.json';

Aurelia
  /*
  .register(StyleConfiguration.shadowDOM({
    // optionally add the shared styles for all components
    sharedStyles: [shared]
  }))
  */
  // Register all exports of the plugin
  .register(
    RouterConfiguration.customize({ useHref: false }),

    // dynamic components to enhance
    CustomTitleFormatter,
    CustomPagerComponent,
    Example19DetailView,
    Example19Preload,
    Example45DetailView,
    Example45Preload,
    EditorSelect,
    FilterSelect,
  )
  .register(I18nConfiguration.customize((options) => {
    options.translationAttributeAliases = ['i18n', 'tr'];
    options.initOptions = {
      // backend: {
      //   loadPath: './assets/i18n/{{lng}}/{{ns}}.json',
      // },
      // // resources: {
      // //   en: { translation: localeEn },
      // //   fr: { translation: localeFr },
      // // },
      // lng: 'en',
      // fallbackLng: 'en',
      // ns: ['aurelia-slickgrid'],
      // defaultNS: 'aurelia-slickgrid',
      // debug: false,
      // plugins: [Fetch],
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
    };
  }))
  .register(AureliaSlickGridConfiguration.customize(config => {
    // change any of the default global options
    config.options.gridMenu!.iconCssClass = 'mdi mdi-menu';

    // we strongly suggest you add DOMPurify as a sanitizer
    config.options.sanitizer = (dirtyHtml) => DOMPurify.sanitize(dirtyHtml, { ADD_ATTR: ['level'], RETURN_TRUSTED_TYPE: true });
  }))
  .register(DecimalValueConverter, StringifyValueConverter, DateFormatValueConverter)
  .app(MyApp)
  .start();
