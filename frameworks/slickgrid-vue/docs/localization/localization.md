### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-vue-demos/#/Example12) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example12.vue)

### Installation

Install the `i18next` and `i18next-vue` libraries with an optional backend loader, like `i18next-xhr-backend`

##### Install NPM package

```sh
npm install i18next i18next-vue i18next-xhr-backend
```

##### add it to your `main.ts`

Start by using the plugin in your `main.ts`

```ts
import i18next from 'i18next';
import I18NextVue from 'i18next-vue';
import { createApp } from 'vue';

createApp(App).use(I18NextVue, { i18next })
```

##### then add it to your App

Then to finally use translations in Slickgrid-Vue, you must first `provide` the I18Next instance in your App so that it can be `inject`ed in Slickgrid-Vue.

```vue
<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { provide } from 'vue';

provide('i18next', useTranslation().i18next);
</script>
```

##### optionally configure i18n loader with assets folder

You can use the optional `i18next-http-backend` to load JSON files asynchronously. This is just 1 in multiple ways to load translations, just choose whichever ways that best fits your use case.

```ts
import i18next from 'i18next';
import Backend from 'i18next-http-backend';

import localeEn from './assets/locales/en/translation.json';
import localeFr from './assets/locales/fr/translation.json';

i18next
  .use(Backend)
  .init({
    // the translations
    // (tip move them in a JSON file and import them,
    // or even better, manage them via a UI
    // backend: {
    //     loadPath: 'assets/locales/{{lng}}/{{ns}}.json',
    // },
    resources: {
      en: { translation: localeEn },
      fr: { translation: localeFr },
    },
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false // Vue already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    }
  });
createApp(App).use(I18NextVue, { i18next }).use(router).mount('#app');
```

#### Class sample
You need to add a translation key via the property `headerKey` to each column definition, for example: `headerKey: 'TITLE'`

##### Note
For the `Select` Filter, you will use `labelKey` instead of `label`. Anytime a translation key will come in play, we will add the word `key` to the end (hence `headerKey`, `labelKey`, more to come...)

```vue
<script setup lang="ts">
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { TextExportService } from '@slickgrid-universal/text-export';
import { useTranslation } from 'i18next-vue';
import { type Column, Filters, type Formatter, Formatters, GridOption, GridStateChange,SlickgridVue, SlickgridVueInstance } from 'slickgrid-vue';
import { onBeforeMount, ref } from 'vue';

const { i18next } = useTranslation();

// create a custom translate Formatter
const taskTranslateFormatter: Formatter = (_row, _cell, value, _columnDef, _dataContext, grid) => {
  const gridOptions = grid.getOptions() as GridOption;

  return gridOptions.i18n?.t('TASK_X', { x: value }) ?? '';
};

onBeforeMount(() => {
  defineGrid();
});

// Define grid Options and Columns
// provide a headerKey for each column and enableTranslate to True in GridOption
function defineGrid() {
  const columnDefinitions = [
    { id: 'title', name: 'Title', field: 'title', headerKey: 'TITLE', formatter: this.taskTranslateFormatter, sortable: true, minWidth: 100 },
    { id: 'duration', name: 'Duration (days)', field: 'duration', headerKey: 'DURATION', sortable: true, minWidth: 100 },
    { id: 'start', name: 'Start', field: 'start', headerKey: 'START', formatter: Formatters.dateIso, minWidth: 100 },
    { id: 'finish', name: 'Finish', field: 'finish', headerKey: 'FINISH', formatter: Formatters.dateIso, minWidth: 100 },
    { id: 'completed', name: 'Completed', field: 'completed', headerKey: 'COMPLETED', formatter: Formatters.translate, params: { i18n: i18next }, sortable: true, minWidth: 100 }
    // OR via your own custom translate formatter
    // { id: 'completed', name: 'Completed', field: 'completed', headerKey: 'COMPLETED', formatter: translateFormatter, sortable: true, minWidth: 100 }
  ];
  const gridOptions = {
    autoResize: {
      containerId: 'demo-container',
      sidePadding: 15
    },
    enableAutoResize: true,
    enableTranslate: true,
    i18n: i18next,
  };
}
</script>
```

#### Custom Formatter (cell values)
You can define your own custom Formatter by providing the `i18n` Service into the Formatter and using the `.tr()` function to translate the cell value.
```ts
const taskTranslateFormatter: Formatter = (row, cell, value, columnDef, dataContext, grid) => {
  const gridOptions: GridOption = (grid && typeof grid.getOptions === 'function') ? grid.getOptions() : {};
  return gridOptions.i18n?.t('TASK_X', { x: value }) ?? '';
}
```

#### Using slickgrid-vue Formatters.Translate
Instead of defining a custom formatter over and over, you could also use the built-in slickgrid-vue `Formatters.translate`. However for the formatter to work, you need to provide the `i18n` Service instance, you can do so using the `params` properties which is made to pass any type of data, however you need to pass it with this structure: `params: { i18n: i18next } `.
```ts
columnDefinitions.value = [
  {
    id: 'title',
    name: 'Title',
    field: 'title',
    headerKey: 'TITLE',
    formatter: Formatters.translate,
    params: { i18n: i18next } // provide the `i18n instance through the params.i18n property
  }
];
```

#### Passing `i18n` in the Grid Options for Formatter
The best and quick way to pass the `i18n` service is to pass it through the generic `params` grid option. However make sure that you use the following structure: `params: { i18n: i18next } `.
```ts
gridOptions.value = {
  enableTranslate: true,
  params: { i18n: i18next } // provide the `i18n instance through the params.i18n property
};
```

#### Locales
The final step is of course the actual translations. There's multiple ways to copy them to your `assets` folder. See below for a few ways:
1. Manually copy the translation keys/values
2. Manually copy the JSON files to your `assets` folder
3. For Vue-CLI, you can modify `vue.json` file to copy the JSON files to your `assets` folder via a copy scripts.
   - You can implement something like the [following](https://stackoverflow.com/a/43733694/1212166) (I did not test this one, please report back if this is not accurate)
```json
"copyFiles": {
  "node_modules/slickgrid-vue/i18n/*.json": "assets"
}
```
4. Or modify your `package.json` and add a script to copy the JSON files to your `assets` folder
   - install NPM packages `cross-env` and `copyfiles` (`npm install copy-files cross-env`)
   - add a new script in your `package.json`
   - run the below script **once** with `npm run copy:i18n` and you should now have the JSON files in your `src/assets` folder
```js
"copy:i18n": "cross-env copyfiles -f node_modules/slickgrid-vue/i18n/*.json assets/i18n"
```
If you want to manually re-create the translation in your own files, the list of translations that you will need are displayed in the [asset locales](https://github.com/ghiscoding/slickgrid-universal/tree/master/demos/vue/src/assets/locales) translation folder (from that file, you need all translations shown before the 'BILLING', the next few ones are for the demo page only).
