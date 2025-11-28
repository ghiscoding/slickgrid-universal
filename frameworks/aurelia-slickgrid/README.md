# [![Aurelia](https://avatars.githubusercontent.com/u/9808864?s=55&v=4)](https://aurelia.io/) Aurelia-Slickgrid

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![NPM downloads](https://img.shields.io/npm/dy/aurelia-slickgrid)](https://npmjs.org/package/aurelia-slickgrid)
[![npm](https://img.shields.io/npm/v/aurelia-slickgrid.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/aurelia-slickgrid)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/aurelia-slickgrid?color=success&label=gzip)](https://bundlephobia.com/result?p=aurelia-slickgrid)
[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/actions/workflows/test-aurelia.yml/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions/workflows/test-aurelia.yml)

### Brief introduction
Aurelia-SlickGrid is a custom component created specifically for [Aurelia](https://aurelia.io/) framework, it is a wrapper on top of Slickgrid-Universal library which contains the core functionalities. Slickgrid-Universal is written with TypeScript in browser native code, it is framework agnostic and is a monorepo that includes all Editors, Filters, Extensions and Services related to SlickGrid usage with also a few optional packages (like GraphQL, OData, Export to Excel, ...).

## Documentation
📕 [Documentation](https://ghiscoding.gitbook.io/aurelia-slickgrid/getting-started/quick-start) website powered by GitBook.

## Installation

Available in Stackblitz below, this can also be used to provide an issue repro.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/ghiscoding/aurelia-slickgrid-demos)

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
[MIT License](../../LICENSE)

#### Basic Grid

```ts
import { type Column, type GridOption } from 'aurelia-slickgrid';

interface User {
  firstName: string;
  lastName: string;
  age: number;
}

export class Example {
  columnDefinitions: Column[] = []; // it could also be `Column<User>[]`
  gridOptions: GridOption;
  dataset: User[] = [];

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
  columns.bind="columnDefinitions"
  options.bind="gridOptions"
  dataset.bind="dataset">
</aurelia-slickgrid>
```

### Like it? ⭐ it
You like **Slickgrid-Vue**? Be sure to upvote ⭐ the project, and perhaps support me with caffeine [☕](https://ko-fi.com/ghiscoding) or sponsor me on GitHub. Any contributions are also very welcome. Thanks

<a href='https://ko-fi.com/ghiscoding' target='_blank'><img height='36' width='140' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi3.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

### Versions Compatibility

**NOTE:** Please be aware that only the latest major version of Angular-Slickgrid will be supported and receive bug fixes.

| Aurelia-Slickgrid | Aurelia   | Migration Guide | Notes | Date |
| :---------------: | --------- | --------------- | ----- | ---- |
| 9.x               | Aurelia 2 | [Migration 9.x](https://ghiscoding.gitbook.io/aurelia-slickgrid/migrations/migration-to-9.x)     | ESM-Only, requires Slickgrid-Universal [9.x](https://github.com/ghiscoding/slickgrid-universal/releases/tag/v9.0.0) | 2025-05-10 |
| 8.x               | Aurelia 2 | [Migration 8.x](https://ghiscoding.gitbook.io/aurelia-slickgrid/migrations/migration-to-8.x)     | modern UI / Dark Mode, requires Slickgrid-Universal [5.x](https://github.com/ghiscoding/slickgrid-universal/releases/tag/v5.0.0) | 2024-05-09 |
| 7.x               | Aurelia 2  | [Migration 7.x](https://ghiscoding.gitbook.io/aurelia-slickgrid/migrations/migration-to-7.x)     | merge SlickGrid into Slickgrid-Universal,<br> requires Slickgrid-Universal [4.x](https://github.com/ghiscoding/slickgrid-universal/releases/tag/v4.0.2) | 2023-12-19 |
| 6.x               | 1.x        | [Migration 6.x](https://ghiscoding.gitbook.io/aurelia-slickgrid/migrations/migration-to-6.x)     | removal of jQuery (now uses browser native code),<br> requires Slickgrid-Universal [3.x](https://github.com/ghiscoding/slickgrid-universal/releases/tag/v3.0.0) | 2023-05-29 |
| 5.x               | 1.x        | [Migration 5.x](https://ghiscoding.gitbook.io/aurelia-slickgrid/migrations/migration-to-5.x)     | removal of jQueryUI, <br>requires Slickgrid-Universal [2.x](https://github.com/ghiscoding/slickgrid-universal/releases/tag/v2.0.0) | 2022-10-18 |

For a full compatibility table of all Aurelia-Slickgrid versions with Slickgrid-Universal, please refer to the [Versions Compatibility Table - Wiki](https://github.com/ghiscoding/aurelia-slickgrid/wiki/Versions-Compatibility-Table)
