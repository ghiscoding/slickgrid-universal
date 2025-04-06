# Aurelia-Slickgrid

### Brief introduction
Aurelia-SlickGrid is a custom component created specifically for [Aurelia](https://aurelia.io/) framework, it is a wrapper on top of Slickgrid-Universal library which contains the core functionalities. Slickgrid-Universal is written with TypeScript in browser native code, it is framework agnostic and is a monorepo that includes all Editors, Filters, Extensions and Services related to SlickGrid usage with also a few optional packages (like GraphQL, OData, Export to Excel, ...).

## Documentation
📕 [Documentation](https://ghiscoding.gitbook.io/aurelia-slickgrid/getting-started/quick-start) website powered by GitBook.

## Installation
Refer to the **[Docs - Quick Start](https://ghiscoding.gitbook.io/aurelia-slickgrid/getting-started/quick-start)** and/or clone the [Aurelia-Slickgrid Demos](https://github.com/ghiscoding/aurelia-slickgrid-demos) repository. Please review the [Documentation](https://ghiscoding.gitbook.io/aurelia-slickgrid/) website before opening any new issue, also consider asking installation and/or general questions on [Stack Overflow](https://stackoverflow.com/search?tab=newest&q=slickgrid) unless you think there's a bug with the library.

```sh
npm install aurelia-slickgrid
```
Install any optional Slickgrid-Universal dependencies, for example Excel Export
```sh
npm install @slickgrid-universal/excel-export
```

### Demo page

`Aurelia-Slickgrid` works with all `Bootstrap` versions, you can see a demo of each one below. There are also extra styling themes for not just Bootstrap but also Material & Salesforce which are also available. You can also use different SVG icons, you may want to look at the [Docs - SVG Icons](https://ghiscoding.gitbook.io/aurelia-slickgrid/styling/svg-icons)
- [Bootstrap 4 demo](https://ghiscoding.github.io/aurelia-slickgrid-demos) / [examples repo](https://github.com/ghiscoding/aurelia-slickgrid-demos/tree/master/webpack-bs4-demo)
- [Bootstrap 5 demo](https://ghiscoding.github.io/aurelia-slickgrid) / [examples repo](https://github.com/ghiscoding/aurelia-slickgrid-demos/tree/master/webpack-bs5-demo)

## License
[MIT License](LICENSE)


#### Basic Grid

```ts
import { type Column, type GridOption } from 'aurelia-slickgrid';

export class Example {
  columnDefinitions: Column[] = [];
  gridOptions: GridOption;
  dataset: any[] = [];

  constructor() {
    this.columnDefinitions = [
      { id: 'firstName', name: 'First Name', field: 'firstName'},
      { id: 'lastName', name: 'Last Name', field: 'lastName'},
      { id: 'age', name: 'Age', field: 'age' }
    ];
  }

  attached() {
    this.dataset = [
      { id: 1, firstName: 'John', lastName: 'Doe', age: 20 },
      { id: 2, firstName: 'Jane', lastName: 'Smith', age: 21 }
    ];
    this.gridOptions = { /*...*/ }; // optional grid options
  }
}
```

```html
<aurelia-slickgrid
  grid-id="grid2"
  column-definitions.bind="columnDefinitions"
  grid-options.bind="gridOptions"
  dataset.bind="dataset">
</aurelia-slickgrid>
```
