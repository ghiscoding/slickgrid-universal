# Slickgrid-Universal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-blueviolet)](https://github.com/ghiscoding/lerna-lite)
[![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/common.svg)](https://www.npmjs.com/package/@slickgrid-universal/common)

[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions)
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/)
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)
[![codecov](https://codecov.io/gh/ghiscoding/slickgrid-universal/branch/master/graph/badge.svg)](https://codecov.io/gh/ghiscoding/slickgrid-universal)

This is a monorepo project (using yarn workspaces) which is regrouping a few packages under a single repository. It is using SlickGrid (more specifically the [6pac/SlickGrid](https://github.com/6pac/SlickGrid/) fork) behind the scene (there is no need to rewrite the core library itself, in other words this is a wrapper library). The main goal of this library is to create a common repo that includes all Editors, Filters, Extensions and Services that could be used by any Framework (it is framework agnostic). It's also a good opportunity to decouple some features/services that not every project require at all time, this will also help in getting smaller bundle size depending on which features (packages) you use. For example, not every project requires backend services (OData, GraphQL) and export services (Excel Export, Text Export), which is why they are better handled with a monorepo structure.

## Latest News & Releases
Check out the [Releases](https://github.com/ghiscoding/slickgrid-universal/releases) section for all latest News & Version Releases.

### Demo page
The GitHub [demo page](https://ghiscoding.github.io/slickgrid-universal) uses 2 different themes (Material Design / Salesforce) but you could also use Bootstrap theme which is demoed in other frameworks.
- [Angular-Slickgrid](https://ghiscoding.github.io/Angular-Slickgrid/) - External Library
- [Aurelia-Slickgrid](https://ghiscoding.github.io/aurelia-slickgrid/) - External Library
- [Webpack-Demo-Vanilla-Bundle](https://ghiscoding.github.io/slickgrid-universal) - internal with Material Design theme & Salesforce themes

### Like my work? 
You could :star: the lib and maybe support me with cafeine :coffee:. Thanks.

[![ko-fi](https://img.shields.io/badge/Buy%20me%20a%20Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white&text=Buy)](https://ko-fi.com/N4N679OT)

### Why create this monorepo?
You might be wondering why was this monorepo created? Here are a few of the reasons:
1. it removes a lot of duplicate code that exist in both
[Angular-Slickgrid](https://github.com/ghiscoding/Angular-Slickgrid) and [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid)
(these libs have over 90% of code in common and that is not very DRY, we should only push fixes in 1 place instead of multiple places).
2. decouple some Services that should not be required neither imported for every project (OData, GraphQL, Export to File, Export to Excel, RxJS, ...)
3. framework agnostic, it could be implemented in many more frameworks (if you're interested in adding a port for any other framework, please open a new [Discussion](https://github.com/ghiscoding/slickgrid-universal/discussions))
   - you can use it in plain JavaScript (ES6) or TypeScript, on our side we use it with plain JS (ES6) in our Salesforce environment with LWC (Lightning Web Component)

### Frameworks using this monorepo
  - [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid) starting with version `>=3.x` is now using Slickgrid-Universal
  - [Angular-Slickgrid](https://github.com/ghiscoding/Angular-Slickgrid) starting with version `>=3.x` is now using Slickgrid-Universal
  - [Vanilla bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-bundle) is to use it with plain JavaScript or TypeScript without targeting any particular framework.

The Vanilla Implementation (not associated to any framework) is built with [WebPack](https://webpack.js.org/) and is also used to test all the UI functionalities [Cypress](https://www.cypress.io/) (E2E tests). The [Vanilla-force-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-bundle), which extends the `vanilla-bundle` package is what we use in our SalesForce implementation (with Lightning Web Component), hence the creation of this monorepo library.

### Fully Tested with [Jest](https://jestjs.io/) (Unit Tests) - [Cypress](https://www.cypress.io/) (E2E Tests)
Slickgrid-Universal has **100%** Unit Test Coverage, we are talking about +15,000 lines of code (+3,700 unit tests) that are fully tested with [Jest](https://jestjs.io/). There are also +400 Cypress E2E tests to cover all [Examples](https://ghiscoding.github.io/slickgrid-universal/) and most UI functionalities (there's also an additional +500 tests in Aurelia-Slickgrid)

### Available Demos

| Package or Lib Name | Description |
| --------| ----------- |
| [Angular-Slickgrid](https://github.com/ghiscoding/Angular-Slickgrid) | Angular-Slickgrid for Angular framework |
| [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid) | Aurelia-Slickgrid for Aurelia framework |
| [slickgrid-universal/webpack-demo-vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/examples/webpack-demo-vanilla-bundle) | standalone package written in plain TypeScript for demo and UI testing (**do not use in production**, this is only for demo/testing purpose). |

### Available Public Packages

| Package Name | Version | Description | Changes |
| -------------| ------- | ----------- | ------- |
| [@slickgrid-universal/common](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/common) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/common.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/common) | commonly used Formatters/Editors/Filters/Services/... | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/CHANGELOG.md) |
| [@slickgrid-universal/binding](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/binding) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/binding.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/binding) | basic Binding Engine & Helper | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/binding/CHANGELOG.md) |
| [@slickgrid-universal/event-pub-sub](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/event-pub-sub) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/event-pub-sub.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/event-pub-sub) | basic PubSub Service using JS Events | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/event-pub-sub/CHANGELOG.md) |
| [@slickgrid-universal/composite-editor-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/composite-editor-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/composite-editor-component.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/composite-editor-component) | Composite Editor Modal Component | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/composite-editor-component/CHANGELOG.md) |
| [@slickgrid-universal/custom-footer-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/custom-footer-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/custom-footer-component.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/custom-footer-component) | Custom Footer Component for the grid | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/custom-footer-component/CHANGELOG.md) |
| [@slickgrid-universal/custom-tooltip-plugin](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/custom-tooltip-plugin) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/custom-tooltip-plugin.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/custom-tooltip-plugin) | Custom Tooltip (plugin) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/custom-tooltip-plugin/CHANGELOG.md) |
| [@slickgrid-universal/empty-warning-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/empty-warning-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/empty-warning-component.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/empty-warning-component) | simple Empty Data Warning Component | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/empty-warning-component/CHANGELOG.md) |
| [@slickgrid-universal/pagination-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/pagination-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/pagination-component.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/pagination-component) | simple Pagination Component | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/pagination-component/CHANGELOG.md) |
| [@slickgrid-universal/excel-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/excel-export) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/excel-export.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/excel-export) | Export to Excel Service (xls/xlsx) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/excel-export/CHANGELOG.md) |
| [@slickgrid-universal/text-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/text-export) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/text-export.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/text-export) | Export to Text File Service (csv/txt) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/text-export/CHANGELOG.md) |
| [@slickgrid-universal/graphql](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/graphql) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/graphql.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/graphql) | GraphQL Query Service (support Filter/Sort/Pagination) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/graphql/CHANGELOG.md) |
| [@slickgrid-universal/odata](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/odata) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/odata.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/odata) | OData Query Service (support Filter/Sort/Pagination) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/odata/CHANGELOG.md) |
| [@slickgrid-universal/row-detail-view-plugin](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/row-detail-view-plugin) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/row-detail-view-plugin.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/row-detail-view-plugin) | Row Detail View (plugin) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/row-detail-view-plugin/CHANGELOG.md) |
| [@slickgrid-universal/rxjs-observable](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/rxjs-observable) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/rxjs-observable.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/rxjs-observable) | RxJS Observable Service Wrapper | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/rxjs-observable/CHANGELOG.md) |
| [@slickgrid-universal/vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-bundle) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/vanilla-bundle.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/vanilla-bundle) | Vanilla TypeScript/ES6 implementation | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/vanilla-bundle/CHANGELOG.md) 
| [@slickgrid-universal/vanilla-force-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-force-bundle) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/vanilla-force-bundle.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/vanilla-force-bundle) | Vanilla TypeScript/ES6 for Salesforce implementation | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/vanilla-force-bundle/CHANGELOG.md) 

## Installation
**NOTE:** the installation instructions below are **only** required if you want to contribute to this project, if on the other hand you just want to do a quick demo and use Slickgrid-Universal then take a look at [webpack-demo-vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/examples/webpack-demo-vanilla-bundle). There is no need to clone and install the entire library, just create an empty project with the content of [webpack-demo-vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/examples/webpack-demo-vanilla-bundle) (perhaps clone it and copy only that folder to an empty project would be the easiest).

To get going and do development with this monorepo, you will need to clone the repo and then follow the steps below. You must be at the root of your project to run the following commands.

1. Install npm packages with [Yarn classic 1.x](https://classic.yarnpkg.com/lang/en/) since this lib uses Yarn version 1.x Workspaces and so you need to use Yarn to install all packages
```bash
# from the root
yarn install
```

2. Build (bundle)

To get started you must run at least once the initial TS build so that all necessary `dist` are created and bundled for all the workspace packages to work together.

```bash
yarn run bundle
```
NOTE: this will also have to be re-executed if you change any of the interfaces in the `common` package (since that package is a dependency of all other packages).

3. Run Dev (Vanilla Implementation)

There is a Vanilla flavour implementation of this monorepo, vanilla means that it is not associated to any framework
and is written in plain TypeScript without being bound to any framework. The implementation is very similar to Angular and Aurelia.
It could be used as a guideline to implement it with other frameworks.

```bash
yarn run dev:watch
```

### Tests
You must go through Installation Steps 1-2 prior to run the unit tests OR Steps 1-3 when running E2E tests.

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
