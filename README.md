# Slickgrid-Universal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/common.svg)](https://www.npmjs.com/package/@slickgrid-universal/common)

[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions)
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/)
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)
[![codecov](https://codecov.io/gh/ghiscoding/slickgrid-universal/branch/master/graph/badge.svg)](https://codecov.io/gh/ghiscoding/slickgrid-universal)

This is a monorepo project (using Lerna) which is regrouping a few packages under a single repository. It is using SlickGrid (more specifically the [6pac/SlickGrid](https://github.com/6pac/SlickGrid/) fork) behind the scene (there is no need to rewrite the core library itself, in other words this is a wrapper library). The main goal of this library is to create a common repo that includes all Editors, Filters, Extensions and Services that could be used by any Framework (it is framework agnostic). It's also a good opportunity to decouple some features/services that not every project require at all time, this will also help in getting smaller bundle size depending on which features (packages) you use. For example, not every project requires backend services (OData, GraphQL) and export services (Excel Export, Text Export), which is why they are better handled with a monorepo structure.

### Demo page
The GitHub [demo page](https://ghiscoding.github.io/slickgrid-universal) uses 2 different themes (Material Design / Salesforce) but you could also use Bootstrap theme which is demoed in other frameworks.
- [Webpack-Demo-Vanilla-Bundle](https://ghiscoding.github.io/slickgrid-universal) with Material Design theme & Salesforce themes
- [Angular-Slickgrid](https://ghiscoding.github.io/Angular-Slickgrid/)
- [Aurelia-Slickgrid](https://ghiscoding.github.io/aurelia-slickgrid/)

### Why create this monorepo?
You might be wondering why was this monorepo created? Here are a few of the reasons:
1. it removes a lot of duplicate code that exist in both
[Angular-Slickgrid](https://github.com/ghiscoding/Angular-Slickgrid) and [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid)
(these libs have over 90% of code in common and that is not very DRY, we should only push fixes in 1 place instead of multiple places).
2. decouple some Services that should not be required neither imported for every project (OData, GraphQL, Export to File, Export to Excel, RxJS, ...)
3. framework agnostic, it could be implemented in many more frameworks (if you're interested in adding a port for any other framework, please open a new [Discussion](https://github.com/ghiscoding/slickgrid-universal/discussions))
   - you can use it in plain JavaScript (ES6) or TypeScript, on our side we use it with plain JS (ES6) in our Salesforce environment with LWC (Lightning Web Component)

### Frameworks using this monorepo
  - [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid) `3.x` now uses Slickgrid-Universal
  - [Angular-Slickgrid](https://github.com/ghiscoding/Angular-Slickgrid) `3.x` new major version is currently in progress
  - [Vanilla bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-bundle) if you want to use it with plain JavaScript or TypeScript without targeting any framework.

The Vanilla Implementation (not associated to any framework) is built with [WebPack](https://webpack.js.org/) and is also used to test all the UI functionalities [Cypress](https://www.cypress.io/) (E2E tests). This [Vanilla bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-bundle) package is also what we use in our SalesForce implementation (with Lightning Web Component), hence the creation of this monorepo library.

### Fully Tested with [Jest](https://jestjs.io/) (Unit Tests) - [Cypress](https://www.cypress.io/) (E2E Tests)
Slickgrid-Universal has **100%** Unit Test Coverage, we are talking about +13,000 lines of code (+3,000 unit tests) that are fully tested with [Jest](https://jestjs.io/). There are also +300 Cypress E2E tests to cover all [Examples](https://ghiscoding.github.io/slickgrid-universal/) and most UI functionalities (there's also an additional +500 tests in Aurelia-Slickgrid)

### Available Demos

| Package or Lib Name | Description |
| --------| ----------- |
| [slickgrid-universal/webpack-demo-vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/examples/webpack-demo-vanilla-bundle) | standalone package written in plain TypeScript for demo & UI testing (**do not use in production**, this is only for testing). |
| [Angular-Slickgrid](https://github.com/ghiscoding/Angular-Slickgrid) | Angular-Slickgrid (framework) implementation |
| [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid) | Aurelia-Slickgrid (framework) implementation |

### Available Public Packages

| Package Name | Version | Description | Changes |
| -------------| ------- | ----------- | ------- |
| [@slickgrid-universal/common](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/common) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/common.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/common) | commonly used Formatters/Editors/Filters/Services/... | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/CHANGELOG.md) |
| [@slickgrid-universal/binding](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/binding) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/binding.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/binding) | basic Binding Engine & Helper | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/binding/CHANGELOG.md) |
| [@slickgrid-universal/event-pub-sub](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/event-pub-sub) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/event-pub-sub.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/event-pub-sub) | basic PubSub Service using JS Events | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/event-pub-sub/CHANGELOG.md) |
| [@slickgrid-universal/composite-editor-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/composite-editor-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/composite-editor-component.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/composite-editor-component) | Composite Editor Modal Component | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/composite-editor-component/CHANGELOG.md) |
| [@slickgrid-universal/custom-footer-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/custom-footer-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/custom-footer-component.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/custom-footer-component) | Custom Footer Component for the grid | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/custom-footer-component/CHANGELOG.md) |
| [@slickgrid-universal/empty-warning-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/empty-warning-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/empty-warning-component.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/empty-warning-component) | simple Empty Data Warning Component | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/empty-warning-component/CHANGELOG.md) |
| [@slickgrid-universal/pagination-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/pagination-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/pagination-component.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/pagination-component) | simple Pagination Component | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/pagination-component/CHANGELOG.md) |
| [@slickgrid-universal/excel-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/excel-export) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/excel-export.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/excel-export) | Export to Excel Service (xls/xlsx) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/excel-export/CHANGELOG.md) |
| [@slickgrid-universal/text-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/text-export) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/text-export.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/text-export) | Export to Text File Service (csv/txt) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/text-export/CHANGELOG.md) |
| [@slickgrid-universal/graphql](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/graphql) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/graphql.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/graphql) | GraphQL Query Service (support Filter/Sort/Pagination) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/graphql/CHANGELOG.md) |
| [@slickgrid-universal/odata](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/odata) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/odata.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/odata) | OData Query Service (support Filter/Sort/Pagination) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/odata/CHANGELOG.md) |
| [@slickgrid-universal/rxjs-observable](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/rxjs-observable) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/rxjs-observable.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/rxjs-observable) | RxJS Observable Service Wrapper | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/rxjs-observable/CHANGELOG.md) |
| [@slickgrid-universal/vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-bundle) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/vanilla-bundle.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/vanilla-bundle) | Vanilla TypeScript/ES6 implementation | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/vanilla-bundle/CHANGELOG.md) 

## Installation
To get going with this monorepo, you will need to clone the repo and then follow the steps below

1. Install npm packages with Yarn classic (`1.x` version) since this lib uses Yarn Workspaces and so you need to use Yarn to install all packages
```bash
yarn install
```

2. Lerna Bootstrap

Run it **only once**, this will install all dependencies and add necessary monorepo symlinks
```bash
yarn run bootstrap
```

3. Build (bundle)

To get started you must run at least once the initial TS build so that all necessary `dist` are created and bundled for all the Lerna packages to work together.

```bash
yarn run bundle
```
NOTE: this will also have to be re-executed if you change any of the interfaces in the `common` package (since that package is a dependency of all other packages).

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

# or run Jest in watch mode
yarn run test:watch
```

#### Cypress E2E Tests
To run all E2E tests (with Cypress), you can run these commands
```bash
# will open the Cypress UI
yarn run cypress

# or run in the shell like a CI/CD would
yarn run cypress:ci
```
