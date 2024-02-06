# Slickgrid-Universal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/ghiscoding/lerna-lite)
[![NPM downloads](https://img.shields.io/npm/dy/@slickgrid-universal/common.svg)](https://www.npmjs.com/package/@slickgrid-universal/common)
[![npm](https://img.shields.io/npm/v/@slickgrid-universal/common.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@slickgrid-universal/common)

[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/actions/workflows/main.yml/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions)
[![Cypress](https://img.shields.io/endpoint?url=https://cloud.cypress.io/badge/simple/p5zxx6&style=flat&logo=cypress&label=Cypress%20(E2E))](https://cloud.cypress.io/projects/p5zxx6/runs)
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)
[![codecov](https://codecov.io/gh/ghiscoding/slickgrid-universal/branch/master/graph/badge.svg)](https://codecov.io/gh/ghiscoding/slickgrid-universal)

### Documentation
📘 [Documentation](https://ghiscoding.gitbook.io/slickgrid-universal/) website powered by GitBook

### Live Demo
[Live Demo](https://ghiscoding.github.io/slickgrid-universal/) website

### Description
This is a monorepo project (using [pnpm workspaces](https://pnpm.io/workspaces)) which is regrouping a few packages under a single repository. It originally required SlickGrid as a dependency but that is no longer the case and is now a standalone library. The main goal of this project is to create a common repo that includes all Editors, Filters, Extensions and Services that could be used by any Framework (it is framework agnostic). The original SlickGrid is like an IKEA product that requires assembling everything yourself, the goal of the project here is to offer an all assembled product including a set of built-in Editors, Filters, Formatters and some optional packages like OData, GraphQL, ... and SlickGrid simply did not offer that by default. See below for more project details.

### Why create this monorepo?
Below is a list of reasons why this project was created and why it is a monorepo project:
1. it removed a lot of duplicate code that were common in both
[Angular-Slickgrid](https://github.com/ghiscoding/Angular-Slickgrid) and [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid) libraries
   - prior to creating this monorepo, these 2 libs had ~90% of TypeScript code in common which was not very DRY, it is also a lot easier to maintain by pushing fixes in 1 common lib (this one here).
2. decoupled a few Services that are not required by every project (OData, GraphQL, Export to CSV, Export to Excel, Composite Editor, RxJS, ...)
3. framework agnostic, it could be implemented in many different frameworks (if you are interested in adding a different framework port that is not listed in the [table](#available-framework-ports) below, please open a new [Discussion](https://github.com/ghiscoding/slickgrid-universal/discussions))
   - you can use it in plain JavaScript (ES6) or TypeScript, on our side we use it with plain JS (ES6) in our Salesforce environment with LWC (Lightning Web Component)

## Latest News & Releases
Check out the [Releases](https://github.com/ghiscoding/slickgrid-universal/releases) section for all the latest News & Version Releases.

### Like my work?
You could ⭐ the lib and perhaps support me with cafeine [☕](https://ko-fi.com/ghiscoding). Thanks in advance.

<a href='https://ko-fi.com/ghiscoding' target='_blank'><img height='34' style='border:0px;height:34px;' src='https://az743702.vo.msecnd.net/cdn/kofi3.png?v=0' border='0' alt='Buy Me a Coffee at ko-fi.com' />

## Live Demos & Available Framework Ports
The GitHub [live demo](https://ghiscoding.github.io/slickgrid-universal) shows 2 different UI themes (Material Design / Salesforce), but you could also choose the Bootstrap theme which is demoed in other frameworks with available links shown in the table below. Also note that these live demos are using [Bootstrap](https://getbootstrap.com/) and [Bulma](https://bulma.io/), but in theory you could use any UI libraries. The project tries to be as much agnostic as possible and it does so by providing a ton of CSS/SASS variables which are available to customize it the way you want.

### Available Framework Ports

| Project Repo | Live Demo | UI used | Description |
| ----| --------- | ------ | ----------- |
| [Angular-Slickgrid](https://github.com/ghiscoding/Angular-Slickgrid)  | [demo](https://ghiscoding.github.io/Angular-Slickgrid/) | Bootstrap | for Angular framework |
| [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid) | [demo](https://ghiscoding.github.io/aurelia-slickgrid/) | Bootstrap | for Aurelia framework |
| [Slickgrid-React](https://github.com/ghiscoding/slickgrid-react/) | [demo](https://ghiscoding.github.io/slickgrid-react/) | Bootstrap | for React framework |
| [Slickgrid-Universal-WebPack-Demo](https://github.com/ghiscoding/slickgrid-universal-webpack-demo) | [demo](https://ghiscoding.github.io/slickgrid-universal-webpack-demo) | Bulma | Slickgrid-Universal demo with WebPack & TypeScript (**demo purposes only**) |
| [Slickgrid-Universal-Vite-Demo](https://github.com/ghiscoding/slickgrid-universal-vite-demo) | [demo](https://ghiscoding.github.io/slickgrid-universal-vite-demo) | Bulma | Slickgrid-Universal demo with Vite & TypeScript (**demo purposes only**) |

The Slickgrid-Universal [live demo](https://ghiscoding.github.io/slickgrid-universal) is a Vanilla Implementation (which is not associated to any framework) built with [ViteJS](https://vitejs.dev/) (originally [WebPack](https://webpack.js.org/)) and is also used to run the E2E tests with [Cypress](https://www.cypress.io/) for testing all UI functionalities. The [Vanilla-force-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-force-bundle), which extends the [vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-bundle) package is also what we use in our SalesForce implementation (with Lightning Web Component), which was the original reason to create this monorepo library and avoid code duplication.

### Fully Tested with [Jest](https://jestjs.io/) (Unit Tests) - [Cypress](https://www.cypress.io/) (E2E Tests)
Slickgrid-Universal has close to **100%** Unit Test Coverage, almost 5,000 Jest unit tests and also +550 Cypress E2E tests to cover all [Examples](https://ghiscoding.github.io/slickgrid-universal/) and most UI functionalities (each framework implementation also have an additional 600 tests), the goal is to test everything and offer peace of mind that all the code and PR changes are fully tested and that we have tests to cover them.

### Available Public Packages

| Package Name | Version | Description | Changes |
| -------------| ------- | ----------- | ------- |
| [@slickgrid-universal/common](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/common) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/common.svg)](https://www.npmjs.com/package/@slickgrid-universal/common) | commonly used Formatters/Editors/Filters/Services/... | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/CHANGELOG.md) |
| [@slickgrid-universal/binding](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/binding) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/binding.svg)](https://www.npmjs.com/package/@slickgrid-universal/binding) | basic Binding Engine & Helper | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/binding/CHANGELOG.md) |
| [@slickgrid-universal/event-pub-sub](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/event-pub-sub) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/event-pub-sub.svg)](https://www.npmjs.com/package/@slickgrid-universal/event-pub-sub) | basic PubSub Service using JS Events | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/event-pub-sub/CHANGELOG.md) |
| [@slickgrid-universal/composite-editor-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/composite-editor-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/composite-editor-component.svg)](https://www.npmjs.com/package/@slickgrid-universal/composite-editor-component) | Composite Editor Modal Component | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/composite-editor-component/CHANGELOG.md) |
| [@slickgrid-universal/custom-footer-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/custom-footer-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/custom-footer-component.svg)](https://www.npmjs.com/package/@slickgrid-universal/custom-footer-component) | Custom Footer Component for the grid | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/custom-footer-component/CHANGELOG.md) |
| [@slickgrid-universal/custom-tooltip-plugin](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/custom-tooltip-plugin) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/custom-tooltip-plugin.svg)](https://www.npmjs.com/package/@slickgrid-universal/custom-tooltip-plugin) | Custom Tooltip (plugin) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/custom-tooltip-plugin/CHANGELOG.md) |
| [@slickgrid-universal/empty-warning-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/empty-warning-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/empty-warning-component.svg)](https://www.npmjs.com/package/@slickgrid-universal/empty-warning-component) | simple Empty Data Warning Component | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/empty-warning-component/CHANGELOG.md) |
| [@slickgrid-universal/pagination-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/pagination-component) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/pagination-component.svg)](https://www.npmjs.com/package/@slickgrid-universal/pagination-component) | simple Pagination Component | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/pagination-component/CHANGELOG.md) |
| [@slickgrid-universal/excel-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/excel-export) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/excel-export.svg)](https://www.npmjs.com/package/@slickgrid-universal/excel-export) | Export to Excel Service (`xls`/`xlsx`) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/excel-export/CHANGELOG.md) |
| [@slickgrid-universal/text-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/text-export) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/text-export.svg)](https://www.npmjs.com/package/@slickgrid-universal/text-export) | Export to Text File Service (`csv`/`txt`) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/text-export/CHANGELOG.md) |
| [@slickgrid-universal/graphql](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/graphql) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/graphql.svg)](https://www.npmjs.com/package/@slickgrid-universal/graphql) | GraphQL Query Service (Filter/Sort/Paging) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/graphql/CHANGELOG.md) |
| [@slickgrid-universal/odata](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/odata) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/odata.svg)](https://www.npmjs.com/package/@slickgrid-universal/odata) | OData Query Service (Filter/Sort/Paging) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/odata/CHANGELOG.md) |
| [@slickgrid-universal/row-detail-view-plugin](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/row-detail-view-plugin) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/row-detail-view-plugin.svg)](https://www.npmjs.com/package/@slickgrid-universal/row-detail-view-plugin) | Row Detail View (plugin) | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/row-detail-view-plugin/CHANGELOG.md) |
| [@slickgrid-universal/rxjs-observable](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/rxjs-observable) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/rxjs-observable.svg)](https://www.npmjs.com/package/@slickgrid-universal/rxjs-observable) | RxJS Observable Service Wrapper | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/rxjs-observable/CHANGELOG.md) |
| [@slickgrid-universal/utils](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/utils) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/utils.svg)](https://www.npmjs.com/package/@slickgrid-universal/utils) | Common JS Utils | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/utils/CHANGELOG.md)
| [@slickgrid-universal/vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-bundle) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/vanilla-bundle.svg)](https://www.npmjs.com/package/@slickgrid-universal/vanilla-bundle) | Vanilla TypeScript/ES6 implementation | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/vanilla-bundle/CHANGELOG.md)
| [@slickgrid-universal/vanilla-force-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-force-bundle) | [![npm](https://img.shields.io/npm/v/@slickgrid-universal/vanilla-force-bundle.svg)](https://www.npmjs.com/package/@slickgrid-universal/vanilla-force-bundle) | Vanilla TypeScript/ES6 for Salesforce implementation | [changelog](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/vanilla-force-bundle/CHANGELOG.md)

## Installation
**NOTE:** the installation instructions below are **only** required if you want to contribute to this project, if on the other hand you just want to download a quick Slickgrid-Universal demo, then I would suggest to take a look at [Slickgrid-Universal Vite Demo](https://github.com/ghiscoding/slickgrid-universal-vite-demo) or [Slickgrid-Universal WebPack Demo](https://github.com/ghiscoding/slickgrid-universal-webpack-demo).

To get started and do development with this monorepo, you will need to clone the repo and follow the steps shown below. You must be at the root of the project to run the following commands. This project also requires `pnpm`.

1. pnpm installation

This project uses [pnpm workspaces](https://pnpm.io/workspaces), you can install pnpm by picking 1 of these 2 choices:

a. following their [installation](https://pnpm.io/installation)

b. or install pnpm via Node corepack
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

You also need to run a full build if you want to run the Jest unit tests

```bash
pnpm run bundle
```

### Tests
You must go through Installation Steps 1-2 (or 1,3) prior to running the Jest unit tests OR steps 1-2 when running Cypress E2E tests.

#### Jest Unit Tests
To run all unit tests (with Jest), you can run one of the following commands (make sure that steps 1,3 were executed prior to running this command)
```bash
pnpm run test

# or run Jest in watch mode
pnpm run test:watch
```

#### Cypress E2E Tests
To run all E2E tests (with Cypress), you can run one of the following commands (make sure that steps 1,2 were executed prior to running this command)
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
