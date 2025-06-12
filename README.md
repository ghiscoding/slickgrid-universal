# Slickgrid-Universal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/lerna-lite/lerna-lite)
[![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/common.svg)](https://www.npmjs.com/package/@slickgrid-universal/common)
[![npm](https://img.shields.io/npm/v/@slickgrid-universal/common.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@slickgrid-universal/common)

[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/actions/workflows/main.yml/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions)
[![Cypress](https://img.shields.io/endpoint?url=https://cloud.cypress.io/badge/simple/p5zxx6&style=flat&logo=cypress&label=Cypress%20(E2E))](https://cloud.cypress.io/projects/p5zxx6/runs)
[![Vitest](https://img.shields.io/badge/tested%20with-vitest-fcc72b.svg?logo=vitest)](https://vitest.dev/)
[![codecov](https://codecov.io/gh/ghiscoding/slickgrid-universal/branch/master/graph/badge.svg)](https://codecov.io/gh/ghiscoding/slickgrid-universal)

### Documentation
📘 [Documentation](https://ghiscoding.gitbook.io/slickgrid-universal/) website powered by GitBook for version 4.0+ (_or use the [Wikis](https://github.com/ghiscoding/slickgrid-universal/wiki) for older versions_)

### Live Demo
[Live Demo](https://ghiscoding.github.io/slickgrid-universal/) website

Also available in Stackblitz for all available frameworks (see [table](https://github.com/ghiscoding/slickgrid-universal?tab=readme-ov-file#available-framework-wrappers) below)

### Description
One of the best JavaScript data grid named as "SlickGrid", which was originally developed by @mleibman, beats most other data grids in terms of features, customizability & performance (running smoothly with even a million rows).

This is a monorepo project (using [pnpm workspaces](https://pnpm.io/workspaces) and [Lerna-Lite](https://github.com/lerna-lite/lerna-lite)) which is regrouping a few packages under a single repository. It was originally requiring `6pac/slickgrid` as an external dependency, but that was dropped in v4.0, and it has been a standalone library since then. The main goal of this project is to create a common repo that includes all Editors, Filters, Extensions and Services that could be used by any frameworks (the project is framework agnostic).

### What's the difference with the original SlickGrid (now [`6pac/slickgrid`](https://github.com/6pac/SlickGrid)) project?
If you've used the original SlickGrid in the past, you might be wondering, should I use the [`6pac/slickgrid`](https://github.com/6pac/SlickGrid) or Slickgrid-Universal (or any of its wrappers), what are the differences? The main difference is that the original `SlickGrid`/`6pac/slickgrid` is like an unassembled IKEA product where it's very bare bone and unassembled, on the other hand Slickgrid-Universal is an all assembled product with batteries included. What that means is that Slickgrid-Universal comes in with many built-in features like Formatters, Editors, Filters, Tree Data, ... which are not available in the original SlickGrid. So in the end SlickGrid (`6pac/slickgrid`) project is much smaller in size because it's very bare bone but you will have to implement many things by yourself (Sorting/Filtering/Editing/...), and if you're looking at creating very basic grids with the smallest footprint possible, then SlickGrid might work for you, otherwise Slickgrid-Universal has a more complete set of features with a bit larger download and installation size.

Side note, I am (`@ghiscoding`) a maintainer in both projects, which are Slickgrid-Universal as well as the `6pac/slickgrid` (in fact Slickgrid-Universal was originally requiring the `6pac/slickgrid` dependency but that was eventually dropped in v4 and it is now a standalone). The main reason to support both projects is to keep core files in sync as much as possible (SlickGrid, SlickDataView and all plugins). Both projects combined together have a much larger user base and this mean much more stability for both projects, and we also often sync new core & plugin files in both projects as well... and that's it, I hope this makes it clear what the differences are and in case you need more clarity then feel free to open a new Discussion for more details.

### Why create this monorepo?
Below is a list of reasons as to why this project was created and why it was built as a monorepo project:
1. originally created to remove duplicated code from the first 2 framework wrappers (Angular, Aurelia)
2. it also decoupled many of the Services that are simply not required by every project
   - OData, GraphQL, Export to CSV, Export to Excel, Composite Editor, RxJS, ...
4. and finally it is framework agnostic
   - you can reuse the same grids and logic in many different frameworks, it's easily transportable
   - you can use it in plain JavaScript (ES6) or TypeScript, i.e. we use plain JS (ES6) in our Salesforce environment with LWC (Lightning Web Component)

## Latest News & Releases
Check out the [Releases](https://github.com/ghiscoding/slickgrid-universal/releases) section for all the latest News & Releases.

### Like my work?
You could star ⭐ the project and/or support me with caffeine via GitHub [sponsorship](https://github.com/sponsors/ghiscoding) or the Ko-Fi button below. Thanks in advance.

<a href='https://ko-fi.com/ghiscoding' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi3.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

## Live Demos & Available Framework Wrappers
The GitHub [live demo](https://ghiscoding.github.io/slickgrid-universal) above shows 2 different UI themes (Material Design / Salesforce), but you could also choose the Bootstrap theme which is demoed in other frameworks from links available in the table shown below. Also note that even if the demos are built with either [Bootstrap](https://getbootstrap.com/) or [Bulma](https://bulma.io/), you could in theory use any other UI libraries. The project tries to be as much agnostic as possible and it does so by providing a large set of CSS/SASS variables which are available to you to customize the UI however you want.

### Available Framework Wrappers

| Project Repo | Live Demo | Stackblitz | Framework | Docs | Downloads | Changes |
| -------------| --------- | ---------- | --------- | ---- | --------- | ------- |
| [Angular-Slickgrid](https://github.com/ghiscoding/slickgrid-universal/tree/master/frameworks/angular-slickgrid)  | [demo](https://ghiscoding.github.io/angular-slickgrid-demos) | [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/ghiscoding/angular-slickgrid-demos) | [Angular](https://angular.io/) | [docs](https://ghiscoding.gitbook.io/angular-slickgrid/getting-started/quick-start) | [![NPM downloads](https://img.shields.io/npm/dy/angular-slickgrid)](https://npmjs.org/package/angular-slickgrid) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/frameworks/angular-slickgrid/CHANGELOG.md) |
| [Aurelia-Slickgrid](https://github.com/ghiscoding/slickgrid-universal/tree/master/frameworks/aurelia-slickgrid) | [demo](https://ghiscoding.github.io/aurelia-slickgrid-demos) | [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/ghiscoding/aurelia-slickgrid-demos/tree/master/webpack-bs5-demo) | [Aurelia](https://aurelia.io/) | [docs](https://ghiscoding.gitbook.io/aurelia-slickgrid/getting-started/quick-start) | [![NPM downloads](https://img.shields.io/npm/dy/aurelia-slickgrid)](https://npmjs.org/package/aurelia-slickgrid)| [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/frameworks/aurelia-slickgrid/CHANGELOG.md) |
| [Slickgrid-React](https://github.com/ghiscoding/slickgrid-universal/tree/master/frameworks/slickgrid-react/) | [demo](https://ghiscoding.github.io/slickgrid-react-demos) | [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/ghiscoding/slickgrid-react-demos/tree/main/bootstrap5-i18n-demo) | [React](https://react.dev/) | [docs](https://ghiscoding.gitbook.io/slickgrid-react/getting-started/quick-start) | [![NPM downloads](https://img.shields.io/npm/dy/slickgrid-react)](https://npmjs.org/package/slickgrid-react) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/frameworks/slickgrid-react/CHANGELOG.md) |
| [Slickgrid-Vue](https://github.com/ghiscoding/slickgrid-universal/tree/master/frameworks/slickgrid-vue) | [demo](https://ghiscoding.github.io/slickgrid-vue-demos) | [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/ghiscoding/slickgrid-vue-demos) | [Vue](https://vuejs.org/) - **new** 🚀 | [docs](https://ghiscoding.gitbook.io/slickgrid-vue/getting-started/quick-start) | [![NPM downloads](https://img.shields.io/npm/dy/slickgrid-vue)](https://npmjs.org/package/slickgrid-vue) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/frameworks/slickgrid-vue/CHANGELOG.md) |
| [Slickgrid-Universal-WebPack-Demo](https://github.com/ghiscoding/slickgrid-universal-webpack-demo) | [demo](https://ghiscoding.github.io/slickgrid-universal-webpack-demo) | [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/ghiscoding/slickgrid-universal-webpack-demo) | Vanilla / WebPack | [docs](https://ghiscoding.gitbook.io/slickgrid-universal/) |
| [Slickgrid-Universal-Vite-Demo](https://github.com/ghiscoding/slickgrid-universal-vite-demo) | [demo](https://ghiscoding.github.io/slickgrid-universal-vite-demo) | [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/ghiscoding/slickgrid-universal-vite-demo) | Vanilla / Vite | [docs](https://ghiscoding.gitbook.io/slickgrid-universal/)
| [Slickgrid-Universal/vanilla-force-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-force-bundle) | n/a | n/a | Salesforce (LWC) | [docs](https://ghiscoding.gitbook.io/slickgrid-universal/getting-started/installation-salesforce) | [zip](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-force-bundle/dist-grid-bundle-zip) file |

The Slickgrid-Universal [live demo](https://ghiscoding.github.io/slickgrid-universal) is a Vanilla Implementation (which is not associated to any framework) built with [ViteJS](https://vitejs.dev/) (originally [WebPack](https://webpack.js.org/)) and is also being used to run all E2E tests with [Cypress](https://www.cypress.io/) for testing every UI functionalities. The [Vanilla-force-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-force-bundle), which extends the [vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-bundle) package, is what we use in our SalesForce implementation (with Lightning Web Component) and it can also be used as a Standalone script (see [zip](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-force-bundle/dist-grid-bundle-zip) file). These were all the original reasons to create this monorepo library but above all, it was to avoid code duplication. Dark Mode is also shown in some of the examples (not all), see [Dark Mode](https://ghiscoding.gitbook.io/slickgrid-universal/styling/dark-mode) documentation for more infos.

### Fully Tested with [Vitest](https://vitest.dev/) (Unit Tests) - [Cypress](https://www.cypress.io/) (E2E Tests)
Slickgrid-Universal has close to **100%** Unit Test Coverage, ~5,000 Vitest unit tests including ~900 Cypress E2E tests to cover all [Examples](https://ghiscoding.github.io/slickgrid-universal/) and most UI functionalities (each framework implementation also includes roughly the same amount of E2E tests), the goal is to offer peace of mind that pretty much all the code and PR changes are fully tested before releasing anything. Every time a new Pull Request (PR) is created, it runs all unit tests and Cypress E2E tests for vanilla flavor and every framework wrappers.

### Available Public Packages

| Package Name | Version | NPM downloads | Size (gzip) | Changes |
| -------------| ------- | ------------- | ----------- | ------- |
| [@slickgrid-universal/common](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/common) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/common.svg)](https://www.npmjs.com/package/@slickgrid-universal/common) | [![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/common.svg)](https://www.npmjs.com/package/@slickgrid-universal/common) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/common?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/common) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/CHANGELOG.md) |
| [@slickgrid-universal/binding](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/binding) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/binding.svg)](https://www.npmjs.com/package/@slickgrid-universal/binding) | [![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/binding.svg)](https://www.npmjs.com/package/@slickgrid-universal/binding) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/binding?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/binding) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/binding/CHANGELOG.md) |
| [@slickgrid-universal/event-pub-sub](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/event-pub-sub) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/event-pub-sub.svg)](https://www.npmjs.com/package/@slickgrid-universal/event-pub-sub) | [![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/event-pub-sub.svg)](https://www.npmjs.com/package/@slickgrid-universal/event-pub-sub) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/event-pub-sub?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/event-pub-sub) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/event-pub-sub/CHANGELOG.md) |
| [@slickgrid-universal/composite-editor-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/composite-editor-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/composite-editor-component.svg)](https://www.npmjs.com/package/@slickgrid-universal/composite-editor-component) | [![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/composite-editor-component.svg)](https://www.npmjs.com/package/@slickgrid-universal/composite-editor-component) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/composite-editor-component?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/composite-editor-component) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/composite-editor-component/CHANGELOG.md) |
| [@slickgrid-universal/custom-footer-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/custom-footer-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/custom-footer-component.svg)](https://www.npmjs.com/package/@slickgrid-universal/custom-footer-component) | [![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/custom-footer-component.svg)](https://www.npmjs.com/package/@slickgrid-universal/custom-footer-component) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/custom-footer-component?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/custom-footer-component) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/custom-footer-component/CHANGELOG.md) |
| [@slickgrid-universal/custom-tooltip-plugin](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/custom-tooltip-plugin) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/custom-tooltip-plugin.svg)](https://www.npmjs.com/package/@slickgrid-universal/custom-tooltip-plugin) | [![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/custom-tooltip-plugin.svg)](https://www.npmjs.com/package/@slickgrid-universal/custom-tooltip-plugin) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/custom-tooltip-plugin?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/custom-tooltip-plugin) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/custom-tooltip-plugin/CHANGELOG.md) |
| [@slickgrid-universal/empty-warning-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/empty-warning-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/empty-warning-component.svg)](https://www.npmjs.com/package/@slickgrid-universal/empty-warning-component) | [![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/empty-warning-component.svg)](https://www.npmjs.com/package/@slickgrid-universal/empty-warning-component) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/empty-warning-component?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/empty-warning-component) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/empty-warning-component/CHANGELOG.md) |
| [@slickgrid-universal/pagination-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/pagination-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/pagination-component.svg)](https://www.npmjs.com/package/@slickgrid-universal/pagination-component) | [![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/pagination-component.svg)](https://www.npmjs.com/package/@slickgrid-universal/pagination-component) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/pagination-component?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/pagination-component) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/pagination-component/CHANGELOG.md) |
| [@slickgrid-universal/excel-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/excel-export) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/excel-export.svg)](https://www.npmjs.com/package/@slickgrid-universal/excel-export) | [![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/excel-export.svg)](https://www.npmjs.com/package/@slickgrid-universal/excel-export) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/excel-export?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/excel-export) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/excel-export/CHANGELOG.md) |
| [@slickgrid-universal/text-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/text-export) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/text-export.svg)](https://www.npmjs.com/package/@slickgrid-universal/text-export) | [![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/text-export.svg)](https://www.npmjs.com/package/@slickgrid-universal/text-export) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/text-export?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/text-export) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/text-export/CHANGELOG.md) |
| [@slickgrid-universal/graphql](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/graphql) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/graphql.svg)](https://www.npmjs.com/package/@slickgrid-universal/graphql) | [![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/graphql.svg)](https://www.npmjs.com/package/@slickgrid-universal/graphql) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/graphql?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/graphql) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/graphql/CHANGELOG.md) |
| [@slickgrid-universal/odata](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/odata) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/odata.svg)](https://www.npmjs.com/package/@slickgrid-universal/odata) | [![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/odata.svg)](https://www.npmjs.com/package/@slickgrid-universal/odata) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/odata?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/odata) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/odata/CHANGELOG.md) |
| [@slickgrid-universal/row-detail-view-plugin](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/row-detail-view-plugin) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/row-detail-view-plugin.svg)](https://www.npmjs.com/package/@slickgrid-universal/row-detail-view-plugin) | [![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/row-detail-view-plugin.svg)](https://www.npmjs.com/package/@slickgrid-universal/row-detail-view-plugin) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/row-detail-view-plugin?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/row-detail-view-plugin) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/row-detail-view-plugin/CHANGELOG.md) |
| [@slickgrid-universal/rxjs-observable](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/rxjs-observable) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/rxjs-observable.svg)](https://www.npmjs.com/package/@slickgrid-universal/rxjs-observable) | [![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/rxjs-observable.svg)](https://www.npmjs.com/package/@slickgrid-universal/rxjs-observable) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/rxjs-observable?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/rxjs-observable) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/rxjs-observable/CHANGELOG.md) |
| [@slickgrid-universal/utils](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/utils) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/utils.svg)](https://www.npmjs.com/package/@slickgrid-universal/utils) | [![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/utils.svg)](https://www.npmjs.com/package/@slickgrid-universal/utils) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/utils?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/utils) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/utils/CHANGELOG.md)
| [@slickgrid-universal/vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-bundle) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/vanilla-bundle.svg)](https://www.npmjs.com/package/@slickgrid-universal/vanilla-bundle) | [![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/vanilla-bundle.svg)](https://www.npmjs.com/package/@slickgrid-universal/vanilla-bundle) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/vanilla-bundle?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/vanilla-bundle) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/vanilla-bundle/CHANGELOG.md) |
| [@slickgrid-universal/vanilla-force-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-force-bundle) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/vanilla-force-bundle.svg)](https://www.npmjs.com/package/@slickgrid-universal/vanilla-force-bundle) | [![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/vanilla-force-bundle.svg)](https://www.npmjs.com/package/@slickgrid-universal/vanilla-force-bundle) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/vanilla-force-bundle?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/vanilla-force-bundle) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/vanilla-force-bundle/CHANGELOG.md) |

## Installation
**NOTE:** the installation instructions below are **only** required if you want to contribute to this project, if however you just want to download a quick Slickgrid-Universal demo, then I would suggest you to take a look at the following repos [Slickgrid-Universal Vite Demo](https://github.com/ghiscoding/slickgrid-universal-vite-demo) or [Slickgrid-Universal WebPack Demo](https://github.com/ghiscoding/slickgrid-universal-webpack-demo).

To get started with development in this monorepo, you will need to clone the repo and follow the steps shown below. Note that you must be at the root of the project in order to run the commands, this project also requires `pnpm`.

1. pnpm installation

This project uses [pnpm workspaces](https://pnpm.io/workspaces), you can install pnpm by choosing 1 of these 2 choices:

a. following their [installation](https://pnpm.io/installation)

b. or install pnpm via Node [corepack](https://nodejs.org/api/corepack.html)
```sh
corepack enable

# optionally update pnpm to latest
corepack prepare pnpm@latest --activate
```

#### Specific Framework install
For a more targeted install, you could optionally install a specific framework (which avoids installing all frameworks).
You should only do that if you're only interested in contributing something specific to a framework wrapper, see commands below:

```sh
# install all framework wrappers
pnpm install

# or install only a single framework wrapper
# choose the command from list below depending on the framework
pnpm angular:install
pnpm aurelia:install
pnpm react:install
pnpm vue:install
```

2. Run Dev (Vanilla Implementation)

There is a Vanilla flavour implementation of this monorepo, vanilla means that it is not associated to any framework
and is written in plain TypeScript without being bound to any framework. The implementation is very similar to Angular and Aurelia.
It could be used as a guideline to implement it for other framework wrappers.

```bash
# dev vanilla (default)
pnpm run dev

# dev for Angular, Aurelia, React or Vue
pnpm run dev:angular
pnpm run dev:aurelia
pnpm run dev:react
pnpm run dev:vue
```


3. Build

You also need to run a full build in order to run the Vitest unit tests

```bash
# full build (all universal & all frameworks)
pnpm run build

# or only Slickgrid-Universal packages (excludes all frameworks)
pnpm run build:universal
```

### Tests
You must go through Installation Steps 1-3 prior to running the Vitest unit tests OR steps 1-2 for Cypress E2E tests.

#### Vitest Unit Tests
To run all unit tests (with Vitest), you can run one of the following commands (make sure that steps 1-3 were executed prior to running this command)
```bash
pnpm run test
```

#### Cypress E2E Tests
To run all E2E tests (with Cypress), you can run one of the following commands (make sure that steps 1-2 were executed prior to running this command)
```bash
# will open the Cypress GUI
pnpm run cypress

# or run it in the shell (like a CI/CD would)
pnpm run cypress:ci
```

## Sponsors

<div>
  <span>
    <a href="https://github.com/wundergraph" class="Link" title="Wundergraph" target="_blank"><img src="https://avatars.githubusercontent.com/u/64281914" width="50" height="50" valign="middle" /></a>
  </span>
  &nbsp;
  <span>
    <a href="https://github.com/johnsoncodehk" class="Link" title="johnsoncodehk (Volar)" target="_blank"><img src="https://avatars.githubusercontent.com/u/16279759" width="50" height="50" valign="middle" /></a>
  </span>
   &nbsp;
  <span>
    <a href="https://github.com/kevinburkett" class="Link" title="kevinburkett" target="_blank"><img class="circle avatar-user" src="https://avatars.githubusercontent.com/u/48218815?s=52&amp;v=4" width="45" height="45" valign="middle" /></a>
  </span>
  &nbsp;
  <span>
    <a href="https://github.com/anton-gustafsson" class="Link" title="anton-gustafsson" target="_blank"><img src="https://avatars.githubusercontent.com/u/22906905?s=52&v=4" width="50" height="50" valign="middle" /></a>
  </span>
  &nbsp;
  <span>
    <a href="https://github.com/gibson552" class="Link" title="gibson552" target="_blank"><img src="https://avatars.githubusercontent.com/u/84058359?s=52&v=4" width="50" height="50" valign="middle" /></a>
  </span>
  &nbsp;
  <span>
    <a href="https://github.com/web-ascender" class="Link" title="Web Ascender" target="_blank"><img src="https://avatars.githubusercontent.com/u/832747?s=200&v=4" width="50" height="50" valign="middle" /></a>
  </span>
</div>

