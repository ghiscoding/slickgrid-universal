import { I18nConfiguration } from '@aurelia/i18n';
import { RouterConfiguration } from '@aurelia/router-direct';
import Aurelia from 'aurelia';
import 'bootstrap';
// import Fetch from 'i18next-fetch-backend';
import { AureliaSlickGridConfiguration } from 'aurelia-slickgrid';
import DOMPurify from 'dompurify';
import localeEn from './assets/i18n/en/aurelia-slickgrid.json';
import localeFr from './assets/i18n/fr/aurelia-slickgrid.json';
import { DateFormatValueConverter, DecimalValueConverter, StringifyValueConverter } from './examples/resources/value-converters/index.js';
import { CustomTitleFormatter } from './examples/slickgrid/custom-title-formatter.js';
import { EditorSelect } from './examples/slickgrid/editor-select.js';
import { ExampleDetailPreload } from './examples/slickgrid/example-detail-preload.js';
import { Example19DetailView } from './examples/slickgrid/example19-detail-view.js';
// dynamic components that can be enhanced in Example 19, 26
import { CustomPagerComponent } from './examples/slickgrid/example42-pager.js';
import { Example45DetailView } from './examples/slickgrid/example45-detail-view.js';
import { Example45Preload } from './examples/slickgrid/example45-preload.js';
import { Example47DetailView } from './examples/slickgrid/example47-detail-view.js';
import { FilterSelect } from './examples/slickgrid/filter-select.js';
import { MyApp } from './my-app.js';

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
    Example45DetailView,
    Example45Preload,
    Example47DetailView,
    ExampleDetailPreload,
    EditorSelect,
    FilterSelect
  )
  .register(
    I18nConfiguration.customize((options) => {
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
    })
  )
  .register(
    AureliaSlickGridConfiguration.customize((config) => {
      // change any of the default global options
      config.options.gridMenu!.iconCssClass = 'mdi mdi-menu';

      // we strongly suggest you add DOMPurify as a sanitizer
      config.options.sanitizer = (dirtyHtml) => DOMPurify.sanitize(dirtyHtml, { ADD_ATTR: ['level'], RETURN_TRUSTED_TYPE: true });
    })
  )
  .register(DecimalValueConverter, StringifyValueConverter, DateFormatValueConverter)
  .app(MyApp)
  .start();
