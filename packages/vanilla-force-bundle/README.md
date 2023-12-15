[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/ghiscoding/lerna-lite)
[![npm](https://img.shields.io/npm/v/@slickgrid-universal/vanilla-force-bundle.svg)](https://www.npmjs.com/package/@slickgrid-universal/vanilla-force-bundle)
[![npm](https://img.shields.io/npm/dy/@slickgrid-universal/vanilla-force-bundle)](https://www.npmjs.com/package/@slickgrid-universal/vanilla-force-bundle)

[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions)
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/)
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)
[![codecov](https://codecov.io/gh/ghiscoding/slickgrid-universal/branch/master/graph/badge.svg)](https://codecov.io/gh/ghiscoding/slickgrid-universal)

## Vanilla Force Bundle
#### @slickgrid-universal/vanilla-force-bundle

Vanilla Force Bundle is similar to the Vanilla Bundle but oriented towards a Salesforce (LWC) implementation which requires an all-in-1 bundle (zip) with all necessary package loaded at once. So this package is very similar to the [@slickgrid-universal/vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-bundle), it actually extends from it, with the only difference that it imports and includes 3 extra packages (which are optional in the `vanilla-bundle` but required for our Salesforce implementation) and those are:
- CompositeEditor
- CustomTooltip
- TextExport (CSV))

This package does what other framework would do, that is to make all the features usable into 1 bundle so that it could then be used by other Apps/Projects, for example we use this bundle in our SalesForce (with Lighning Web Component) App and it requires plain ES6 JavaScript which this bundle also produce (for that there's a [dist-grid-bundle-zip](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-force-bundle/dist-grid-bundle-zip) folder which will zip the ES6 `dist` folder which we then import in our SalesForce implementation as a static resource).

### Internal Dependencies
- [@slickgrid-universal/common](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/common)
- [@slickgrid-universal/composite-editor-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/composite-editor-component)
- [@slickgrid-universal/custom-tooltip-plugin](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/custom-tooltip-plugin)
- [@slickgrid-universal/event-pub-sub](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/event-pub-sub)
- [@slickgrid-universal/custom-footer-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/custom-footer-component)
- [@slickgrid-universal/empty-warning-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/empty-warning-component)
- [@slickgrid-universal/pagination-component](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/pagination-component)
- [@slickgrid-universal/text-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/text-export)
- [@slickgrid-universal/vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-bundle)

### External Dependencies
- [whatwg-fetch](https://github.com/whatwg/fetch) - Fetch Standard

### Installation
This Vanilla Bundle is used in our SalesForce implementation (since it requires plain ES6) and is also used by the standalone [vite-demo-vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/examples/vite-demo-vanilla-bundle) which serves for demo purposes.

Go to the root of the repo and follow the instructions provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation)

### Salesforce Installation
Consult the [Installation, Salesforce - Wiki](https://ghiscoding.gitbook.io/aurelia-slickgrid/getting-started/installation-salesforce) for more info.
