### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-universal/#/example07) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vanilla/src/examples/example07.ts)

### Installation

You can create your own Translate Service, for example installing the `whatwg-fetch` library (or anything similar) to load JSON files for translations.

##### Install NPM package

You can install `whatwg-fetch` or any other library that you wish to use to load your JSON translation files.

```ts
npm install whatwg-fetch
```

##### Main.ts

Create a Custom Translate Service and make sure to implement all functions that the `TranslaterService` interface requires.

```ts
export class TranslateService implements TranslaterService {
  /** Method to return the current language used by the App */
  getCurrentLanguage(): string {}

  /** Method which receives a translation key and returns the translated value from that key */
  translate(translationKey: string, params?: any): string {}

  /** Method to set the language to use in the App and Translate Service */
  use(language: string): Promise<any> | any {}
}
```
> for a full translater service implementation demo with `whatwg-fetch`, take a look at [translate.service.ts](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vanilla/src/translate.service.ts).

#### Class sample
You need to add a translation key via the property `headerKey` to each column definition, for example: `headerKey: 'TITLE'`

##### Note
For the `Select` Filter, you will use `labelKey` instead of `label`. Anytime a translation key will come in play, we will add the word `key` to the end (hence `headerKey`, `labelKey`, more to come...)

##### Load App

Load the App (i.e.: `main.ts`) and instantiate the `TranslateService`

```ts
class Main {
  constructor(private renderer: Renderer) { }

  async loadApp() {
    const translate = new TranslateService();
    translate.setup({
      loadPath: 'i18n/{{lang}}.json',
      lang: 'en'
    });
    await translate.use('en');

    // it might be better to use proper Dependency Injection
    // but for now let's use the window object to save keep a reference to our instantiated service
    (<any>window).TranslateService = translate;

    // ... do other things
  }
}
```

##### Use it

```ts
import { Formatters } from '@slickgrid-universal/common';

// create a custom translate Formatter
function taskTranslateFormatter: Formatter = (row, cell, value, columnDef, dataContext) => {
  return this.translateService.translate('TASK_X', { x: value }) ?? '';
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
      { id: 'completed', name: 'Completed', field: 'completed', headerKey: 'COMPLETED', formatter: Formatters.translate, params: { i18n: this.translateService }, sortable: true, minWidth: 100 }
      // OR via your own custom translate formatter
      // { id: 'completed', name: 'Completed', field: 'completed', headerKey: 'COMPLETED', formatter: translateFormatter, sortable: true, minWidth: 100 }
    ];

    const gridOptions = {
      enableTranslate: true,
      translater: this.translateService,
    };
  }
}
```

#### Custom Formatter (cell values)

You can define your own custom Formatter by providing the `TranslateService` Service into the Formatter and using the `.translate(key)` function to translate the cell value.

```ts
const taskTranslateFormatter: Formatter = (row, cell, value, columnDef, dataContext, grid) => {
  return this.translateService.translate('TASK_X', { x: value }) ?? '';
}
```

#### Using Formatters.Translate
Instead of defining a custom formatter over and over, you could also use the built-in `Formatters.translate`. However for the formatter to work, you need to provide the `TranslateService` instance, you can do so using the `params` properties which is made to pass any type of data.

#### Passing `translater` in the Grid Options for the Translate Service

```ts
const gridOptions = {
  enableTranslate: true,
  translater: this.translateService, // pass the TranslateService instance to the grid
};
```
