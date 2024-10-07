### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-universal/#/example07) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/examples/vite-demo-vanilla-bundle/src/examples/example07.ts)

### Installation
Install the `i18next` library with a backend loader, typically `i18next-xhr-backend`

##### Install NPM package
```ts
npm install i18next i18next-xhr-backend
```

##### Main.ts
###### configure i18n loader with assets folder
```ts
import i18n from 'i18next';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .init({
    // the translations (tip move them in a JSON file and import them or even better, manage them via a UI
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
      escapeValue: false
    }
  });
```

#### Class sample
You need to add a translation key via the property `headerKey` to each column definition, for example: `headerKey: 'TITLE'`

##### Note
For the `Select` Filter, you will use `labelKey` instead of `label`. Anytime a translation key will come in play, we will add the word `key` to the end (hence `headerKey`, `labelKey`, more to come...)

```ts
import { Formatters } from '@slickgrid-universal/common';
import i18next, { TFunction } from 'i18next';

// create a custom translate Formatter
function taskTranslateFormatter: Formatter = (row, cell, value, columnDef, dataContext, grid) => {
  const gridOptions: GridOption = (grid && typeof grid.getOptions === 'function') ? grid.getOptions() : {};
  return gridOptions.i18n?.t('TASK_X', { x: value }) ?? '';
}

export class Example {
  constructor() {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();
  }

  // Define grid Options and Columns
  // provide a headerKey for each column and enableTranslate to True in GridOption
  defineGrid() {
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
      enableTranslate: true,
      i18n: i18next,
    };
  }
}
```

#### Custom Formatter (cell values)
You can define your own custom Formatter by providing the `i18n` Service into the Formatter and using the `.tr()` function to translate the cell value.
```ts
const taskTranslateFormatter: Formatter = (row, cell, value, columnDef, dataContext, grid) => {
  const gridOptions: GridOption = (grid && typeof grid.getOptions === 'function') ? grid.getOptions() : {};
  return gridOptions.i18n?.t('TASK_X', { x: value }) ?? '';
}
```

#### Using Formatters.Translate
Instead of defining a custom formatter over and over, you could also use the built-in `Formatters.translate`. However for the formatter to work, you need to provide the `i18n` Service instance, you can do so using the `params` properties which is made to pass any type of data, however you need to pass it with this structure: `params: { i18n: i18next } `.
```ts
const columnDefinitions = [
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
const gridOptions = {
  enableTranslate: true,
  params: { i18n: i18next } // provide the `i18n instance through the params.i18n property
};
```

#### Locales
The final step is of course the actual translations. There's multiple ways to copy them to your `assets` folder. See below for a few ways:
1. Manually copy the translation keys/values
2. Manually copy the JSON files to your `assets` folder
3. Or modify your `package.json` and add a script to copy the JSON files to your `assets` folder
   - install NPM package `copyfiles` (`npm install copy-files`)
   - add a new script in your `package.json`
   - run the script **once** with `npm run copy:i18n` and you should now have the JSON files in your `src/assets` folder
     - visit [copyfiles](https://www.npmjs.com/package/copyfiles) site on how to use it in your npm script

If you want to manually re-create the translation in your own files, the list of translations that you will need are displayed in the asset i18n translation folder (from that file, you need all translations shown before the 'BILLING', the next few ones are for the demo page only).
