# Slickgrid-Universal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/ghiscoding/lerna-lite)
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

Also available in Stackblitz (Codeflow) below, this can also be used to provide an issue repro.

[![Open in Codeflow](https://developer.stackblitz.com/img/open_in_codeflow.svg)](https:///pr.new/ghiscoding/slickgrid-universal)

### Description
This is a monorepo project (using [pnpm workspaces](https://pnpm.io/workspaces) and [Lerna-Lite](https://github.com/lerna-lite/lerna-lite)) which is regrouping a few packages under a single repository. It was originally requiring SlickGrid as an external dependency, but since v4.0, that is no longer the case and it is now a standalone library. The main goal of this project is to create a common repo that includes all Editors, Filters, Extensions and Services that could be used by any Framework (it is framework agnostic). The original SlickGrid is like an IKEA product that requires assembling everything yourself, however the goal of the current project is to offer an all assembled product which includes a set of built-in Editors, Filters, Formatters and also extra packages that are optionals, like OData, GraphQL, Export to Excel ... which SlickGrid simply does not offer by default. The project also offers multiple Themes including Dark Mode. See below for more project details.

### Why create this monorepo?
Below is a list of reasons why this project was created and why it is a monorepo project:
1. originally it was to remove a lot of duplicate code from these 2 repos
[Angular-Slickgrid](https://github.com/ghiscoding/Angular-Slickgrid) and [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid)
   - prior to creating this monorepo, these 2 libs had ~90% of TypeScript code in common which was not very DRY, it is also a lot easier to maintain by pushing fixes in 1 common lib (this one here).
2. decoupled a few Services that are not required by every project (OData, GraphQL, Export to CSV, Export to Excel, Composite Editor, RxJS, ...)
3. framework agnostic, it could be implemented in many different frameworks (if you are interested in adding a different framework port that is not listed in the [table](#available-framework-ports) below, please open a new [Discussion](https://github.com/ghiscoding/slickgrid-universal/discussions))
   - you can use it in plain JavaScript (ES6) or TypeScript, on our side we use it with plain JS (ES6) in our Salesforce environment with LWC (Lightning Web Component)

## Latest News & Releases
Check out the [Releases](https://github.com/ghiscoding/slickgrid-universal/releases) section for all the latest News & Version Releases.

### Like my work?
You could ⭐ the lib and perhaps support me with caffeine [☕](https://ko-fi.com/ghiscoding). Thanks in advance.

<a href='https://ko-fi.com/ghiscoding' target='_blank'><img height='34' style='border:0px;height:34px;' src='https://az743702.vo.msecnd.net/cdn/kofi3.png?v=0' border='0' alt='Buy Me a Coffee at ko-fi.com' />

## Live Demos & Available Framework Ports
The GitHub [live demo](https://ghiscoding.github.io/slickgrid-universal) shows 2 different UI themes (Material Design / Salesforce), but you could also choose the Bootstrap theme which is demoed in other frameworks with available links shown in the table below. Also note that these live demos are using [Bootstrap](https://getbootstrap.com/) and [Bulma](https://bulma.io/), but in theory you could use any UI libraries. The project tries to be as much agnostic as possible and it does so by providing a ton of CSS/SASS variables which are available to customize it the way you want.

### Available Framework Ports

| Project Repo | Live Demo | UI used | Description |
| ----| --------- | ------ | ----------- |
| [Angular-Slickgrid](https://github.com/ghiscoding/Angular-Slickgrid)  | [demo](https://ghiscoding.github.io/Angular-Slickgrid/) | Bootstrap | for [Angular](https://angular.io/) framework |
| [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid) | [demo](https://ghiscoding.github.io/aurelia-slickgrid/) | Bootstrap | for [Aurelia](https://aurelia.io/) framework |
| [Slickgrid-React](https://github.com/ghiscoding/slickgrid-react/) | [demo](https://ghiscoding.github.io/slickgrid-react/) | Bootstrap | for [React](https://react.dev/) framework |
| [Slickgrid-Universal-WebPack-Demo](https://github.com/ghiscoding/slickgrid-universal-webpack-demo) | [demo](https://ghiscoding.github.io/slickgrid-universal-webpack-demo) | Bulma | Slickgrid-Universal demo with WebPack & TypeScript (**demo purposes only**) |
| [Slickgrid-Universal-Vite-Demo](https://github.com/ghiscoding/slickgrid-universal-vite-demo) | [demo](https://ghiscoding.github.io/slickgrid-universal-vite-demo) | Bulma | Slickgrid-Universal demo with Vite & TypeScript (**demo purposes only**) |

The Slickgrid-Universal [live demo](https://ghiscoding.github.io/slickgrid-universal) is a Vanilla Implementation (which is not associated to any framework) built with [ViteJS](https://vitejs.dev/) (originally [WebPack](https://webpack.js.org/)) and is also being used to run E2E tests with [Cypress](https://www.cypress.io/) for testing all UI functionalities. The [Vanilla-force-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-force-bundle), which extends the [vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-bundle) package is also what we use in our SalesForce implementation (with Lightning Web Component), which was the original reason to create this monorepo library and avoid code duplication. Dark Mode is also shown in some examples (not all), see [Dark Mode](https://ghiscoding.gitbook.io/slickgrid-universal/styling/dark-mode) documentation for more infos.

### Fully Tested with [Vitest](https://vitest.dev/) (Unit Tests) - [Cypress](https://www.cypress.io/) (E2E Tests)
Slickgrid-Universal has close to **100%** Unit Test Coverage, ~5,000 Vitest unit tests and also ~700 Cypress E2E tests to cover all [Examples](https://ghiscoding.github.io/slickgrid-universal/) and most UI functionalities (each framework implementation also have an additional 600 tests), the goal is to test everything and offer peace of mind that all the code and PR changes are fully tested and that we have tests to as much as possible.

### Available Public Packages

| Package Name | Version | Size (gzip) | Changes |
| -------------| ------- | ----------- | ------- |
| [@slickgrid-universal/common](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/common) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/common.svg)](https://www.npmjs.com/package/@slickgrid-universal/common) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/common?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/common) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/CHANGELOG.md) |
| [@slickgrid-universal/binding](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/binding) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/binding.svg)](https://www.npmjs.com/package/@slickgrid-universal/binding) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/binding?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/binding) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/binding/CHANGELOG.md) |
| [@slickgrid-universal/event-pub-sub](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/event-pub-sub) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/event-pub-sub.svg)](https://www.npmjs.com/package/@slickgrid-universal/event-pub-sub) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/event-pub-sub?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/event-pub-sub) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/event-pub-sub/CHANGELOG.md) |
| [@slickgrid-universal/composite-editor-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/composite-editor-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/composite-editor-component.svg)](https://www.npmjs.com/package/@slickgrid-universal/composite-editor-component) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/composite-editor-component?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/composite-editor-component) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/composite-editor-component/CHANGELOG.md) |
| [@slickgrid-universal/custom-footer-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/custom-footer-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/custom-footer-component.svg)](https://www.npmjs.com/package/@slickgrid-universal/custom-footer-component) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/custom-footer-component?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/custom-footer-component) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/custom-footer-component/CHANGELOG.md) |
| [@slickgrid-universal/custom-tooltip-plugin](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/custom-tooltip-plugin) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/custom-tooltip-plugin.svg)](https://www.npmjs.com/package/@slickgrid-universal/custom-tooltip-plugin) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/custom-tooltip-plugin?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/custom-tooltip-plugin) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/custom-tooltip-plugin/CHANGELOG.md) |
| [@slickgrid-universal/empty-warning-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/empty-warning-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/empty-warning-component.svg)](https://www.npmjs.com/package/@slickgrid-universal/empty-warning-component) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/empty-warning-component?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/empty-warning-component) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/empty-warning-component/CHANGELOG.md) |
| [@slickgrid-universal/pagination-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/pagination-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/pagination-component.svg)](https://www.npmjs.com/package/@slickgrid-universal/pagination-component) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/pagination-component?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/pagination-component) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/pagination-component/CHANGELOG.md) |
| [@slickgrid-universal/excel-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/excel-export) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/excel-export.svg)](https://www.npmjs.com/package/@slickgrid-universal/excel-export) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/excel-export?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/excel-export) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/excel-export/CHANGELOG.md) |
| [@slickgrid-universal/text-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/text-export) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/text-export.svg)](https://www.npmjs.com/package/@slickgrid-universal/text-export) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/text-export?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/text-export) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/text-export/CHANGELOG.md) |
| [@slickgrid-universal/graphql](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/graphql) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/graphql.svg)](https://www.npmjs.com/package/@slickgrid-universal/graphql) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/graphql?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/graphql) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/graphql/CHANGELOG.md) |
| [@slickgrid-universal/odata](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/odata) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/odata.svg)](https://www.npmjs.com/package/@slickgrid-universal/odata) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/odata?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/odata) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/odata/CHANGELOG.md) |
| [@slickgrid-universal/row-detail-view-plugin](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/row-detail-view-plugin) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/row-detail-view-plugin.svg)](https://www.npmjs.com/package/@slickgrid-universal/row-detail-view-plugin) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/row-detail-view-plugin?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/row-detail-view-plugin) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/row-detail-view-plugin/CHANGELOG.md) |
| [@slickgrid-universal/rxjs-observable](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/rxjs-observable) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/rxjs-observable.svg)](https://www.npmjs.com/package/@slickgrid-universal/rxjs-observable) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/rxjs-observable?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/rxjs-observable) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/rxjs-observable/CHANGELOG.md) |
| [@slickgrid-universal/utils](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/utils) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/utils.svg)](https://www.npmjs.com/package/@slickgrid-universal/utils) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/utils?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/utils) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/utils/CHANGELOG.md)
| [@slickgrid-universal/vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-bundle) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/vanilla-bundle.svg)](https://www.npmjs.com/package/@slickgrid-universal/vanilla-bundle) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/vanilla-bundle?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/vanilla-bundle) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/vanilla-bundle/CHANGELOG.md)
| [@slickgrid-universal/vanilla-force-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-force-bundle) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/vanilla-force-bundle.svg)](https://www.npmjs.com/package/@slickgrid-universal/vanilla-force-bundle) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/vanilla-force-bundle?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/vanilla-force-bundle) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/vanilla-force-bundle/CHANGELOG.md)

## Installation
**NOTE:** the installation instructions below are **only** required if you want to contribute to this project, however if you just want to download a quick Slickgrid-Universal demo, then I would suggest to take a look at either [Slickgrid-Universal Vite Demo](https://github.com/ghiscoding/slickgrid-universal-vite-demo) or [Slickgrid-Universal WebPack Demo](https://github.com/ghiscoding/slickgrid-universal-webpack-demo).

To get started and do development with this monorepo, you will need to clone the repo and follow the steps shown below. You must be at the root of the project in order to run the following commands. This project also requires `pnpm`.

1. pnpm installation

This project uses [pnpm workspaces](https://pnpm.io/workspaces), you can install pnpm by picking 1 of these 2 choices:

a. following their [installation](https://pnpm.io/installation)

b. or install pnpm via Node [corepack](https://nodejs.org/api/corepack.html)
```sh
corepack enable

# optionally update pnpm to latest
corepack prepare pnpm@latest --activate
```

2. Run Dev (Vanilla Implementation)

There is a Vanilla flavour implementation of this monorepo, vanilla means that it is not associated to any framework
and is written in plain TypeScript without being bound to any framework. The implementation is very similar to Angular and Aurelia.
It could be used as a guideline to implement it for other framework ports.

```bash
pnpm run dev
```


3. Build (bundle)

You also need to run a full build in order to run the Vitest unit tests

```bash
pnpm run bundle
```

### Tests
You must go through Installation Steps 1-3 prior to running the Vitest unit tests OR steps 1-2 when running Cypress E2E tests.

#### Vitest Unit Tests
To run all unit tests (with Vitest), you can run one of the following commands (make sure that steps 1-3 were executed prior to running this command)
```bash
pnpm run test

# or run Vitest in watch mode
pnpm run test:watch
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
  <img class="circle avatar-user" src="https://avatars.githubusercontent.com/u/48218815?s=52&amp;v=4" width="45" height="45" alt="@kevinburkett" />
  <a href="/kevinburkett" class="Link">
    <span class="wb-break-word ml-2">kevinburkett</span>
  </a>
</div>
