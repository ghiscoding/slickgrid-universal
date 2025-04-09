### Demo
[Demo Page](https://ghiscoding.github.io/aurelia-slickgrid/#/slickgrid/example12) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/aurelia/src/examples/slickgrid/example12.ts)

### i18n General Documentation
For more information about `i18n`, you can read this [article](http://blog.aurelia.io/2016/08/22/aurelia-i18n-update-and-cli-tutorial/) and the official Aurelia [documentation](http://aurelia.io/docs/plugins/i18n/)

### Installation
Install the `aurelia-i18n` library with a backend loader, typically `i18next-xhr-backend`
##### Install NPM package
```typescript
npm install aurelia-i18n i18next-xhr-backend
```

##### Main.ts
###### configure i18n loader with assets folder
```typescript
import { TCustomAttribute } from 'aurelia-i18n';
import Backend from 'i18next-xhr-backend';

export function configure(aurelia: Aurelia) {
  aurelia.use.standardConfiguration();

  // PLATFORM.moduleName is not required when using Aurelia-CLI
  aurelia.use.plugin(PLATFORM.moduleName('aurelia-slickgrid'));

  // aurelia i18n to handle multiple locales
  aurelia.use.plugin(PLATFORM.moduleName('aurelia-i18n'), (instance) => {
    // register backend plugin
    instance.i18next.use(Backend);

    return instance.setup({
      backend: {
        loadPath: './assets/i18n/{{lng}}/{{ns}}.json',
      },
      lng: 'en',
      ns: ['aurelia-slickgrid'],
      defaultNS: 'aurelia-slickgrid',
      attributes: ['t', 'i18n'],
      fallbackLng: 'en',
      debug: false
    });
  });
}
```

#### Class sample
You need to add a translation key via the property `headerKey` to each column definition, for example: `headerKey: 'TITLE'`

##### Note
For the `Select` Filter, you will use `labelKey` instead of `label`. Anytime a translation key will come in play, we will add the word `key` to the end (hence `headerKey`, `labelKey`, more to come...)

```typescript
import { autoinject } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { Formatters } from 'aurelia-slickgrid';

@autoinject()
export class Example {
  gridOptions: GridOption;
  columnDefinitions: Column[];
  dataset: any[];

  constructor(private i18n: I18N) {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();
  }

  // Define grid Options and Columns
  // provide a headerKey for each column and enableTranslate to True in GridOption
  defineGrid() {
    this.columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title', headerKey: 'TITLE', formatter: this.taskTranslateFormatter, sortable: true, minWidth: 100 },
      { id: 'duration', name: 'Duration (days)', field: 'duration', headerKey: 'DURATION', sortable: true, minWidth: 100 },
      { id: 'start', name: 'Start', field: 'start', headerKey: 'START', formatter: Formatters.dateIso, minWidth: 100 },
      { id: 'finish', name: 'Finish', field: 'finish', headerKey: 'FINISH', formatter: Formatters.dateIso, minWidth: 100 },
      { id: 'completed', name: 'Completed', field: 'completed', headerKey: 'COMPLETED', formatter: Formatters.translate, params: { i18n: this.i18n }, sortable: true, minWidth: 100 }
      // OR via your own custom translate formatter
      // { id: 'completed', name: 'Completed', field: 'completed', headerKey: 'COMPLETED', formatter: translateFormatter, sortable: true, minWidth: 100 }
    ];
    this.gridOptions = {
      autoResize: {
        containerId: 'demo-container',
        sidePadding: 15
      },
      enableAutoResize: true,
      enableTranslate: true
    };
  }
}

  // create a custom translate Formatter
  taskTranslateFormatter: Formatter = (row, cell, value, columnDef, dataContext) => {
    return this.i18n.tr('TASK_X', { x: value });
  }
```

#### Custom Formatter (cell values)
You can define your own custom Formatter by providing the `i18n` Service into the Formatter and using the `.tr()` function to translate the cell value.
```typescript
taskTranslateFormatter: Formatter = (row, cell, value, columnDef, dataContext) => {
    return this.i18n.tr('TASK_X', { x: value });
}
```

#### Using Aurelia-Slickgrid Formatters.Translate
Instead of defining a custom formatter over and over, you could also use the built-in Aurelia-Slickgrid `Formatters.translate`. However for the formatter to work, you need to provide the `i18n` Service instance, you can do so using the `params` properties which is made to pass any type of data, however you need to pass it with this structure: `params: { i18n: this.i18n } `.
```typescript
this.columnDefinitions = [
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        headerKey: 'TITLE',
        formatter: Formatters.translate,
        params: { i18n: this.i18n } // provide the `i18n instance through the params.i18n property
      }
    ];
```

#### Passing `i18n` in the Grid Options for Formatter
The best and quick way to pass the `i18n` service is to pass it through the generic `params` grid option. However make sure that you use the following structure: `params: { i18n: this.i18n } `.
```typescript
this.gridOptions = {
   enableTranslate: true,
   params: { i18n: this.i18n } // provide the `i18n instance through the params.i18n property
};
```

#### Locales
The final step is of course the actual translations. There's multiple ways to copy them to your `assets` folder. See below for a few ways:
1. Manually copy the translation keys/values
2. Manually copy the JSON files to your `assets` folder
2. For Aurelia-CLI, you can modify `aurelia.json` file to copy the JSON files to your `assets` folder via a copy scripts.
   - You can implement something like the [following](https://stackoverflow.com/a/43733694/1212166) (I did not test this one, please report back if this is not accurate)
```json
"copyFiles": {
  "node_modules/aurelia-slickgrid/i18n/*.json": "assets"
}
```
3. Or modify your `package.json` and add a script to copy the JSON files to your `assets` folder
   - install NPM packages `cross-env` and `copyfiles` (`npm install copy-files cross-env`)
   - add a new script in your `package.json`
   - run the below script **once** with `npm run copy:i18n` and you should now have the JSON files in your `src/assets` folder
```typescript
"copy:i18n": "cross-env copyfiles -f node_modules/aurelia-slickgrid/i18n/*.json assets/i18n"
```
If you want to manually re-create the translation in your own files, the list of translations that you will need are displayed in the [asset i18n](https://github.com/ghiscoding/aurelia-slickgrid/tree/master/aurelia-slickgrid/assets/i18n) translation folder (from that file, you need all translations shown before the 'BILLING', the next few ones are for the demo page only).
