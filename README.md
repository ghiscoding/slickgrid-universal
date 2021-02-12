# Slickgrid-Universal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/common.svg)](https://www.npmjs.com/package/@slickgrid-universal/common)

[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions)
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
- [Webpack-Demo-Vanilla-Bundle](https://ghiscoding.github.io/slickgrid-universal) with Material Design theme & Salesforce themes
- [Angular-Slickgrid](https://ghiscoding.github.io/Angular-Slickgrid/)
- [Aurelia-Slickgrid](https://ghiscoding.github.io/aurelia-slickgrid/)

### Why create this monorepo?
You might be wondering why was this monorepo created? Here are a few of the reasons:
1. it removes a lot of duplicate code that exist in both
[Angular-Slickgrid](https://github.com/ghiscoding/Angular-Slickgrid) and [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid)
(these libs have over +85% of code in common and that is not very DRY).
2. decouple some Services that should not be required neither imported every time (OData, GraphQL, Export to File, Export to Excel, ...)
3. framework agnostic, it could be implemented in many more frameworks (if you're interested in adding support for other frameworks? please contact me...)
   - you can use it in plain TypeScript or even JavaScript (ES6), the later is what we use in Salesforce LWC (Lightning Web Component)

### Frameworks using this monorepo
The goal is to eventually to rewrite [Angular-Slickgrid](https://github.com/ghiscoding/Angular-Slickgrid)
and [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid) to use this monorepo which will simplify debugging/fixing common code.
    
Now implemented in:
  - [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid) `3.x` now uses Slickgrid-Universal

Note however that this project also has a Vanilla Implementation (not associated to any framework) built with [WebPack](https://webpack.js.org/)
and it is also used to test the all UI features with [Cypress](https://www.cypress.io/). The [Vanilla bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-bundle) package is also what we use in our SalesForce (with Lightning Web Component) implementation, hence the creation of this monorepo library.

### Fully Tested with [Jest](https://jestjs.io/) (Unit Tests) - [Cypress](https://www.cypress.io/) (E2E Tests)
Slickgrid-Universal has **100%** Unit Test Coverage, we are talking about +12,000 lines of code (+3,000 unit tests) that are now fully tested with [Jest](https://jestjs.io/). There are also +250 Cypress E2E tests to cover all [Examples](https://ghiscoding.github.io/slickgrid-universal/) and most UI functionalities (there's also an additional +400 tests in Aurelia-Slickgrid)

### Available Public Packages

| Package Name | Version | Description | Changes |
| -------------| ------- | ----------- | ------- |
| [@slickgrid-universal/common](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/common) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/common.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/common) | commonly used Formatters/Editors/Filters/Services/... | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/CHANGELOG.md) |
| [@slickgrid-universal/composite-editor-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/composite-editor-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/composite-editor-component.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/composite-editor-component) | Composite Editor Modal Component | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/composite-editor-component/CHANGELOG.md) |
| [@slickgrid-universal/empty-warning-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/empty-warning-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/empty-warning-component.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/empty-warning-component) | Simple Empty Data Warning Component | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/empty-warning-component/CHANGELOG.md) |
| [@slickgrid-universal/excel-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/excel-export) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/excel-export.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/excel-export) | Export to Excel Service (xls/xlsx) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/excel-export/CHANGELOG.md) |
| [@slickgrid-universal/text-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/text-export) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/text-export.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/text-export) | Export to Text File Service (csv/txt) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/text-export/CHANGELOG.md) |
| [@slickgrid-universal/graphql](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/graphql) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/graphql.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/graphql) | GraphQL Query Service (support Filter/Sort/Pagination) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/graphql/CHANGELOG.md) |
| [@slickgrid-universal/odata](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/odata) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/odata.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/odata) | OData Query Service (support Filter/Sort/Pagination) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/odata/CHANGELOG.md) |
| [@slickgrid-universal/vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-bundle) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/vanilla-bundle.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/vanilla-bundle) | Vanilla TypeScript/ES6 implementation | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/vanilla-bundle/CHANGELOG.md) |

### Available Demos

| Package or Lib Name | Description |
| --------| ----------- |
| [slickgrid-universal/webpack-demo-vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/examples/webpack-demo-vanilla-bundle) | standalone package written in plain TypeScript for demo & UI testing. |
| [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid) | Aurelia-Slickgrid (framework) implementation |


## Installation
To get going with this monorepo, you will need to clone the repo and then follow the steps below

1. Install npm packages with Yarn since this lib uses Yarn Workspaces and so you need to use Yarn to install all packages
```bash
yarn install
```

2. Lerna Bootstrap

Run it **only once**, this will install all dependencies and add necessary monorepo symlinks
```bash
yarn run bootstrap
```

3. Build

To get started you must run (also once) an initial TS build so that all necessary `dist` are created for all the Lerna packages to work together.
```bash
yarn run build

# every subsequent occurence should be called with the `rebuild` which will empty every `dist` folders
yarn run rebuild
```

4. Run Dev (Vanilla Implementation)

There is a Vanilla flavour implementation of this monorepo, vanilla means that it is not associated to any framework
and is written in plain TypeScript without being bound to any framework. The implementation is very similar to Angular and Aurelia.
It could be used as a guideline to implement it with other frameworks.

```bash
yarn run dev:watch
```

### Tests
#### Jest Unit Tests
To run all unit tests (with Jest), you can run these commands
```bash
yarn run test

# or as a watch
yarn run test:watch
```

#### Cypress E2E Tests
To run all E2E tests (with Cypress), you can run these commands
```bash
# run with Cypress Application
yarn run cypress

# or run in the shell like a CI/CD would
yarn run cypress:ci
```
