[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![npm](https://img.shields.io/npm/v/@slickgrid-universal/rxjs-observable.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/rxjs-observable)
[![npm](https://img.shields.io/npm/dy/@slickgrid-universal/rxjs-observable?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/rxjs-observable)

[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions)
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/)
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)
[![codecov](https://codecov.io/gh/ghiscoding/slickgrid-universal/branch/master/graph/badge.svg)](https://codecov.io/gh/ghiscoding/slickgrid-universal)

## RxJS Observable Wrapper
#### @slickgrid-universal/rxjs-observable

An RxJS Observable Service Wrapper to make it possible to use RxJS with Slickgrid-Universal (with a Backend Service like OData/GraphQL). By default any Backend Service will be using Promises unless we use this RxJS Observable package.

This package is simply a bridge to it possible to use RxJS without adding RxJS to the `@slickgrid-universal/common` list of dependencies, so RxJS is a dependency of this package without being a dependency in the common package. 

### External Dependencies
- [RxJS](https://github.com/ReactiveX/RxJS)

### Installation
Follow the instruction provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation)
