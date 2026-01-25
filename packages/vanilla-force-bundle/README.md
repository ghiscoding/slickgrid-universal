[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/ghiscoding/lerna-lite)
[![npm](https://img.shields.io/npm/v/@slickgrid-universal/vanilla-force-bundle.svg)](https://www.npmjs.com/package/@slickgrid-universal/vanilla-force-bundle)
[![npm](https://img.shields.io/npm/dy/@slickgrid-universal/vanilla-force-bundle)](https://www.npmjs.com/package/@slickgrid-universal/vanilla-force-bundle)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/vanilla-force-bundle?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/vanilla-force-bundle)

## <a href="https://lwc.dev/" rel="nofollow"><img alt="Salesforce (LWC)" src="https://login.salesforce.com/img/logo214.svg" width="65"></a> Vanilla Force Bundle
#### @slickgrid-universal/vanilla-force-bundle

Vanilla Force Bundle is similar to the Vanilla Bundle but oriented towards a Salesforce (LWC) implementation which requires an all-in-1 bundle (zip) with all necessary package loaded at once. So this package is very similar to the [@slickgrid-universal/vanilla-bundle](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-bundle), it actually extends from it, with the only difference that it imports and includes 3 extra packages (which are optional in the `vanilla-bundle` but required for our Salesforce implementation) and those are:
- CompositeEditor
- CustomTooltip
- TextExport (CSV))

This package does what other framework would do, that is to make all the features usable into 1 bundle so that it could then be used by other Apps/Projects, for example we use this bundle in our SalesForce (with Lighning Web Component) App and it requires plain ES6 JavaScript which this bundle also produce (for that there's a [dist-grid-bundle-zip](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-force-bundle/dist-grid-bundle-zip) folder which will zip the ES6 `dist` folder which we then import in our SalesForce implementation as a static resource).

### Installation
This Vanilla Bundle is used in our SalesForce implementation (since it requires plain ES6) and is also used by the standalone [demos/vanilla](https://github.com/ghiscoding/slickgrid-universal/tree/master/demos/vanilla) which serves for demo purposes.

Go to the root of the repo and follow the instructions provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation)

### Salesforce Installation
Consult the [Installation, Salesforce - Wiki](https://ghiscoding.gitbook.io/slickgrid-universal/getting-started/installation-salesforce) for more info.
