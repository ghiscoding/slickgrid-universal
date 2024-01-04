# Change Log
## All-in-One SlickGrid framework agnostic wrapper, visit [Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal) 📦🚀

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.1.0...v4.2.0) (2023-12-30)

### Performance Improvements

* prefer `.forEach` over `for...in` and `for...of` ([#1281](https://github.com/ghiscoding/slickgrid-universal/issues/1281)) ([9cc6941](https://github.com/ghiscoding/slickgrid-universal/commit/9cc69410c25685c9251606fc82b91f8fd157be27)) - by @ghiscoding

# [4.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.3...v4.1.0) (2023-12-21)

### Bug Fixes

* **npm:** publish src folder for source maps, fixes downstream builds ([#1269](https://github.com/ghiscoding/slickgrid-universal/issues/1269)) ([701da75](https://github.com/ghiscoding/slickgrid-universal/commit/701da752565384408e22857a201828379bfc26ff)) - by @ghiscoding

### Features

* **utils:** replace slick-core extend utils with `node-extend` ([#1277](https://github.com/ghiscoding/slickgrid-universal/issues/1277)) ([3439118](https://github.com/ghiscoding/slickgrid-universal/commit/3439118da344cd852a1b1af5bd83c4b894213464)) - by @ghiscoding

## [4.0.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.2...v4.0.2) (2023-12-15)

* BREAKING CHANGE: merge SlickGrid into Slickgrid-Universal & drop external dep (#1264) ([18b96ce](https://github.com/ghiscoding/slickgrid-universal/commit/18b96ce2a5779b36c8bc2a977d4e03b0a7003006)), closes [#1264](https://github.com/ghiscoding/slickgrid-universal/issues/1264) - by @ghiscoding

### BREAKING CHANGES

* merge SlickGrid into Slickgrid-Universal & drop external dep

## [4.0.1-alpha.1](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.1-alpha.0...v4.0.1-alpha.1) (2023-12-12)

**Note:** Version bump only for package @slickgrid-universal/utils

## [4.0.1-alpha.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.0-alpha.0...v4.0.1-alpha.0) (2023-12-10)

### Bug Fixes

* `stripTags` shouldn't throw with null/undefined ([8f706fc](https://github.com/ghiscoding/slickgrid-universal/commit/8f706fc95f837c6352fb3217952c86b4326f8aaf)) - by @ghiscoding
* **utils:** undefined html shouldn't throw on stripTags ([05361e7](https://github.com/ghiscoding/slickgrid-universal/commit/05361e7430694d9a41075f744460eaf187a50b11)) - by @ghiscoding

# [4.0.0-alpha.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.1...v4.0.0-alpha.0) (2023-12-09)

**Note:** Version bump only for package @slickgrid-universal/utils

# [3.7.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.6.0...v3.7.0) (2023-12-08)

### Bug Fixes

* cell selection range with key combos were incorrect ([#1244](https://github.com/ghiscoding/slickgrid-universal/issues/1244)) ([79d86fe](https://github.com/ghiscoding/slickgrid-universal/commit/79d86fea99258ccf82a5d3d8c684410623e6753b)) - by @ghiscoding

# 3.6.0 (2023-11-26)

### Features

* Column.excludeFieldFromQuery, exclude field but keep fields array ([#1217](https://github.com/ghiscoding/slickgrid-universal/issues/1217)) ([85cc514](https://github.com/ghiscoding/slickgrid-universal/commit/85cc514c945c1ad6eadd1a93a2839775a95da261)) - by @Harsgalt86

## [3.5.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.5.0...v3.5.1) (2023-11-13)

### Bug Fixes

* improve build & types exports for all targets, Node, CJS/ESM ([#1188](https://github.com/ghiscoding/slickgrid-universal/issues/1188)) ([980fd68](https://github.com/ghiscoding/slickgrid-universal/commit/980fd68f6ce9564bb1fcac5f6ee68fd35f839e8f)) - by @ghiscoding

# [3.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.3.2...v3.4.0) (2023-11-02)

**Note:** Version bump only for package @slickgrid-universal/utils

## [3.3.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.3.1...v3.3.2) (2023-10-06)

**Note:** Version bump only for package @slickgrid-universal/utils

## [3.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.0.1...v3.1.0) (2023-07-20)

**Note:** Version bump only for package @slickgrid-universal/utils

## [3.0.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.0.0...v3.0.1) (2023-07-01)

**Note:** Version bump only for package @slickgrid-universal/utils

## [3.0.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.4...v3.0.0) (2023-05-29)

### ⚠ BREAKING CHANGES

* drop jQuery requirement & use multiple-select-vanilla dependency (#976)

### Features

* drop jQuery requirement & use multiple-select-vanilla dependency ([#976](https://github.com/ghiscoding/slickgrid-universal/issues/976)) ([4e3e1d3](https://github.com/ghiscoding/slickgrid-universal/commit/4e3e1d394247be75d1717feece833e200fce21dc)), closes [#919](https://github.com/ghiscoding/slickgrid-universal/issues/919) - by @ghiscoding

## [3.0.0-beta.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.4...v3.0.0-beta.0) (2023-05-20)

### ⚠ BREAKING CHANGES

* drop jQuery requirement (#962)
* **common:** migrate to multiple-select-vanilla (#919)

### Features

* **common:** migrate to multiple-select-vanilla ([#919](https://github.com/ghiscoding/slickgrid-universal/issues/919)) ([bc74207](https://github.com/ghiscoding/slickgrid-universal/commit/bc74207e9b2ec46209e87b126e1fcff596c162af)) - by @ghiscoding
* drop jQuery requirement ([#962](https://github.com/ghiscoding/slickgrid-universal/issues/962)) ([3da21da](https://github.com/ghiscoding/slickgrid-universal/commit/3da21daacc391a0fb309fcddd78442642c5269f6)) - by @ghiscoding

## [2.6.4](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.3...v2.6.4) (2023-05-20)

**Note:** Version bump only for package @slickgrid-universal/utils

## [2.6.2](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.1...v2.6.2) (2023-03-03)

**Note:** Version bump only for package @slickgrid-universal/utils

# [2.6.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.5.0...v2.6.0) (2023-02-23)

### Features

* **build:** move TypeScript types into a single dist/types folder ([#905](https://github.com/ghiscoding/slickgrid-universal/issues/905)) ([b139c1e](https://github.com/ghiscoding/slickgrid-universal/commit/b139c1e7910f2029ceca58a9d744320ed3ba5372)) - by @ghiscoding

# [2.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.4.1...v2.5.0) (2023-02-17)

### Bug Fixes

* **build:** package exports prop had invalid ESM import link ([#892](https://github.com/ghiscoding/slickgrid-universal/issues/892)) ([7f95f69](https://github.com/ghiscoding/slickgrid-universal/commit/7f95f698447f8178cb7ceec416c35f4957fddbe9)) - by @ghiscoding
* **RowDetail:** Row Detail extension should work with editable grid ([#896](https://github.com/ghiscoding/slickgrid-universal/issues/896)) ([99677f0](https://github.com/ghiscoding/slickgrid-universal/commit/99677f08b9cb383a2b64540700e501c7bdfe9f72)) - by @ghiscoding

# [2.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.3.0...v2.4.0) (2023-02-04)

**Note:** Version bump only for package @slickgrid-universal/utils

# [2.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.2.2...v2.3.0) (2023-01-21)

**Note:** Version bump only for package @slickgrid-universal/utils

## [2.1.2](https://github.com/ghiscoding/slickgrid-universal/compare/v2.1.1...v2.1.2) (2022-12-02)

**Note:** Version bump only for package @slickgrid-universal/utils

## [2.1.1](https://github.com/ghiscoding/slickgrid-universal/compare/v2.1.0...v2.1.1) (2022-11-19)

**Note:** Version bump only for package @slickgrid-universal/utils

# [2.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.0.0...v2.1.0) (2022-11-17)

### Bug Fixes

* **build:** upgrading to TypeScript 4.9 brought new build issue ([#816](https://github.com/ghiscoding/slickgrid-universal/issues/816)) ([4d46d8a](https://github.com/ghiscoding/slickgrid-universal/commit/4d46d8ab251bd78671140f82cb143b973e5422b3)) - by @ghiscoding

# [2.0.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.4.0...v2.0.0) (2022-10-17)

### Features

* **common:** BREAKING CHANGE replace jQueryUI with SortableJS in common & DraggableGrouping ([#772](https://github.com/ghiscoding/slickgrid-universal/issues/772)) ([a9db2cc](https://github.com/ghiscoding/slickgrid-universal/commit/a9db2cca965adc7871d7e4d050ae8f3653c84bb4)), closes [#752](https://github.com/ghiscoding/slickgrid-universal/issues/752) [#756](https://github.com/ghiscoding/slickgrid-universal/issues/756) - by @ghiscoding

# [2.0.0-alpha.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.4.0...v2.0.0-alpha.0) (2022-10-15)

**Note:** Version bump only for package @slickgrid-universal/utils

# [1.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.7...v1.4.0) (2022-08-15)

### Bug Fixes

* **utils:** the `isObject` method was not always correct ([#745](https://github.com/ghiscoding/slickgrid-universal/issues/745)) ([9b09e4a](https://github.com/ghiscoding/slickgrid-universal/commit/9b09e4aa2ca102100a113d4e2996f80c75aa6c2f)) - by @ghiscoding

## [1.3.7](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.6...v1.3.7) (2022-08-02)

### Bug Fixes

* **uilts:** able to use setDeepValue on undefined/empty object ([#732](https://github.com/ghiscoding/slickgrid-universal/issues/732)) ([e370eef](https://github.com/ghiscoding/slickgrid-universal/commit/e370eef758a7e5fe20e87729bc407ca2bdd55504)) - by @ghiscoding

## [1.3.5](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.4...v1.3.5) (2022-07-28)

### Bug Fixes

* **build:** use `workspace:~` to avoid multiple versions d/l on ext libs ([3ca1943](https://github.com/ghiscoding/slickgrid-universal/commit/3ca1943f1247e66d3213fb5edeed7e7246032767)) - by @ghiscoding

## [1.3.4](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.3...v1.3.4) (2022-07-28)

### Bug Fixes

* **utils:** setDeepValue should accept array properties ([#728](https://github.com/ghiscoding/slickgrid-universal/issues/728)) ([0dedeba](https://github.com/ghiscoding/slickgrid-universal/commit/0dedeba76ac817f73320778e63c1987a1708360e)), closes [/stackoverflow.com/questions/62423893/in-slick-grid-inline-edit-i-cant-able-to-get-the-entire-object/73153946#73153946](https://github.com//stackoverflow.com/questions/62423893/in-slick-grid-inline-edit-i-cant-able-to-get-the-entire-object/73153946/issues/73153946) - by @ghiscoding

## [1.3.3](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.2...v1.3.3) (2022-07-07)

**Note:** Version bump only for package @slickgrid-universal/utils

## [1.3.2](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.0...v1.3.2) (2022-07-06)

**Note:** Version bump only for package @slickgrid-universal/utils

# [1.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.6...v1.3.0) (2022-06-18)

**Note:** Version bump only for package @slickgrid-universal/utils
