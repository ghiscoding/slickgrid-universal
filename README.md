# Slickgrid-Universal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

[![CircleCI](https://circleci.com/gh/ghiscoding/slickgrid-universal/tree/master.svg?style=shield)](https://circleci.com/gh/ghiscoding/workflows/slickgrid-universal/tree/master)
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/)
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)
[![codecov](https://codecov.io/gh/ghiscoding/slickgrid-universal/branch/master/graph/badge.svg)](https://codecov.io/gh/ghiscoding/slickgrid-universal)

This is a monorepo project (using Lerna) which is regrouping a few packages under a single repository.
The goal is to create a common repo that includes all Editors, Filters, Extensions and Services
that could be used by any Framework (it is framework agnostic).
It's also a good opportunity to decouple some features/services that not every project require at all time,
this will also help in getting smaller bundle size depending on which features (packages) are used. For example, not every project requires backend services (OData, GraphQL),
which is why they are better handled with a monorepo structure.

### Demo page
The GitHub [demo page](https://ghiscoding.github.io/slickgrid-universal) uses 2 different themes (Material Design / Salesforce) but you could also use Bootstrap theme which is demoed in other frameworks.
- [Webpack-Demo-Vanilla-Bundle](https://ghiscoding.github.io/slickgrid-universal) with Material Design theme & Salesforce theme
- [Angular-Slickgrid](https://ghiscoding.github.io/Angular-Slickgrid/)
- [Aurelia-Slickgrid](https://ghiscoding.github.io/aurelia-slickgrid/)

### Why create this monorepo?
You might be wondering why was this monorepo created? Here are a few of the reasons:
1. it removes a lot of duplicate code that exist in both
[Angular-Slickgrid](https://github.com/ghiscoding/Angular-Slickgrid) and [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid)
(these libs have over 80% of code in common and that is not very DRY).
2. decouple some Services that should not be required at all time (OData, GraphQL, Export to File, Export to Excel, ...)
3. framework agnostic, it could be implemented in many more frameworks in the future (interested in adding other frameworks? please contact me...)
   - you can use it in plain TypeScript or JavaScript (ES6), the later is what we use in Salesforce

### Frameworks using this monorepo
This is a Work in Progress, the goal is to eventually to rewrite [Angular-Slickgrid](https://github.com/ghiscoding/Angular-Slickgrid)
and [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid) to use this monorepo which will simplify debugging/fixing common code.

Note however that this project also has a Vanilla Implementation (not associated to any framework)
and it is also used to test with the UI portion. The Vanilla bundle is also used in our SalesForce (with Lightning Web Component) hence the creation of this monorepo.

### Available Public Packages

| Package Name | Description |
| --------| ----------- |
| [@slickgrid-universal/common](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/common) | commonly used Formatters/Editors/Filters/Services/... |
| [@slickgrid-universal/excel-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/excel-export) | Export to Excel Service (xls/xlsx) |
| [@slickgrid-universal/file-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/file-export) | Export to Text File Service (csv/txt) |
| [@slickgrid-universal/graphql](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/graphql) | GraphQL Query Service (support Filter/Sort/Pagination) |
| [@slickgrid-universal/odata](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/odata) | OData Query Service (support Filter/Sort/Pagination) |
| [@slickgrid-universal/vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-bundle) | a vanilla TypeScript/JavaScript implementation |

### Available Demos

| Package Name | Description |
| --------| ----------- |
| [slickgrid-universal/webpack-demo-vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/examples/webpack-demo-vanilla-bundle) | standalone package written in plain TypeScript for demo & UI testing. |


## Installation
To get going with this monorepo, you will need to clone the repo and then follow the steps below

1. Install npm packages with Yarn
This lib uses Yarn Workspaces and so you need to use Yarn to install all packages
```bash
yarn install
```

2. Lerna Bootstrap

Run it **only once**, this will install all dependencies and add necessary monorepo symlinks
```bash
yarn run bootstrap
```

3. Build

To get started you must run (also once) an initial TS build so that all necessary `dist` are created for all the packages to work together.
```bash
yarn run build
```

4. Run Dev (Vanilla Implementation)

There is a Vanilla flavour implementation of this monorepo, vanilla means that it is not associated to any framework
and is written in plain TypeScript without being bound to any framework. The implementation is very similar to Angular and Aurelia.
It could be used as a guideline to implement it with other frameworks.

```bash
yarn run dev:watch
```

### Tests
To run all packages Jest unit tests, you can run this command
```bash
yarn run test

# or as a watch
yarn run test:watch
```

## TODOs
#### Code
- [x] Aggregators (6)
- [x] Editors (11)
- [x] Filters (17)
- [x] Formatters (31)
- [ ] Extensions
  - [x] AutoTooltip
  - [x] Cell External Copy Manager
  - [x] Cell Menu
  - [x] Checkbox Selector
  - [x] Context Menu
  - [x] Draggable Grouping
  - [x] Grid Menu
  - [x] Header Button
  - [x] Header Menu
  - [x] Resizer
  - [ ] Row Detail
  - [x] Row Move Manager
  - [x] Row Selection
- [x] Grouping Formatters (12)
- [x] SortComparers (5)
- [x] Services (14)
- [x] Others / Vanilla Implementation
  - [x] Custom Footer
  - [x] Backend Services + Pagination
  - [x] Local Pagination
  - [x] Grid Presets
    - [x] Preset Row Selections
    - [x] Should work even after initializing the dataset later (SF)
    - [x] Preset Filters not working with Tree Data View
  - [x] Dynamically Add Columns
  - [x] Tree Data
  - [x] add missing `collectionAsync` for Editors, Filters (autoCompleteFilter, selectFilter)
  - [x] Grid Service should use SlickGrid transactions `beginUpdate`, `endUpdate` for performance reason whenever possible
  - [x] Translations Support

#### Other Todos
- [x] VScode Chrome Debugger
- [x] Jest Debugger
- [x] Add Multiple Example Demos with Vanilla implementation
  - [x] Add GitHub Demo website
- [x] Add CI/CD (CircleCI or GitHub Actions)
  - [x] Add Cypress E2E tests
  - [x] Add Jest Unit tests
  - [x] Add Jest Code Coverage (codecov)
  - [x] Build and run on every PR
  - [x] Add full bundler (all types) build step in CircleCI build
- [x] Bundle Creation (vanilla bundle)
  - [ ] Eventually add Unit Tests as a Pre-Bundle task
- [x] Remove any Deprecated code
  - [ ] Create and Update the [Migration Guide](https://github.com/ghiscoding/slickgrid-universal/wiki/Migration-for-Angular-Aurelia-Slickgrid) for Angular/Aurelia
- [x] Add simple input bindings in the demo (e.g. pinned rows input)
- [x] Add possibility to use SVG instead of Font Family
- [x] Add Typings (interfaces) for Slick Grid & DataView objects
  - [x] Add interfaces to all SlickGrid core lib classes & plugins (basically add Types to everything)
- [x] Copy cell text (context menu) doesn't work in SF
- [x] Remove all Services init method 2nd argument (we can get DataView directly from the Grid object)
- [x] The Pagination/Footer width is a little off sometime compare to the width of the grid container
- [x] See if we can add the number of chars (text counter) typed in `Editors.longText`
- [ ] See if we can get `DOM Purify` to work in SF, else keep the custom sanitizer
- [ ] See if we can get all the vanilla-grid-bundle `instances` as `readonly` class members
