# Change Log
## All-in-One SlickGrid framework agnostic wrapper, visit [Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal) 📦🚀

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.4.1...v4.5.0) (2024-03-05)

### Features

* **deps:** simplify package TS Types exports ([#1402](https://github.com/ghiscoding/slickgrid-universal/issues/1402)) ([19bac52](https://github.com/ghiscoding/slickgrid-universal/commit/19bac52e5fcb8e523a26ab1f6564f0b6a2b93ef4)) - by @ghiscoding

## [4.4.1](https://github.com/ghiscoding/slickgrid-universal/compare/v4.3.1...v4.4.1) (2024-02-13)

### Bug Fixes

* mouse cell selection with active editor ([#1382](https://github.com/ghiscoding/slickgrid-universal/issues/1382)) ([17549b8](https://github.com/ghiscoding/slickgrid-universal/commit/17549b89933b10688fe8d186ab18ab4c8b7e9f87)) - by @zewa666
* **publish:** do not npm publish `tsconfig.tsbuildinfo` ([#1373](https://github.com/ghiscoding/slickgrid-universal/issues/1373)) ([9223338](https://github.com/ghiscoding/slickgrid-universal/commit/922333843852ae861015e4bbec053d4937222aa2)) - by @ghiscoding

# [4.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.3.1...v4.4.0) (2024-02-12)

### Bug Fixes

* mouse cell selection with active editor ([#1382](https://github.com/ghiscoding/slickgrid-universal/issues/1382)) ([17549b8](https://github.com/ghiscoding/slickgrid-universal/commit/17549b89933b10688fe8d186ab18ab4c8b7e9f87)) - by @zewa666
* **publish:** do not npm publish `tsconfig.tsbuildinfo` ([#1373](https://github.com/ghiscoding/slickgrid-universal/issues/1373)) ([9223338](https://github.com/ghiscoding/slickgrid-universal/commit/922333843852ae861015e4bbec053d4937222aa2)) - by @ghiscoding

## [4.3.1](https://github.com/ghiscoding/slickgrid-universal/compare/v4.3.0...v4.3.1) (2024-01-27)

### Performance Improvements

* **core:** convert `for..in` to `Object.keys().forEach` for better perf ([#1370](https://github.com/ghiscoding/slickgrid-universal/issues/1370)) ([29111a9](https://github.com/ghiscoding/slickgrid-universal/commit/29111a94756c34a2e01f2431c14b7ed806349a94)) - by @ghiscoding

# [4.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.2.0...v4.3.0) (2024-01-20)

### Bug Fixes

* **core:** EventHandler subscribed event should be SlickEventData type ([#1327](https://github.com/ghiscoding/slickgrid-universal/issues/1327)) ([2573310](https://github.com/ghiscoding/slickgrid-universal/commit/25733102dbcefcbacc2ce5d6f4c07bd9d1cce6a1)) - by @ghiscoding
* **core:** SlickEvent handler event should be type of ArgType ([#1328](https://github.com/ghiscoding/slickgrid-universal/issues/1328)) ([a9cb8ee](https://github.com/ghiscoding/slickgrid-universal/commit/a9cb8ee3f1a5da4249851e5b701b027b3f72ad26)), closes [#1327](https://github.com/ghiscoding/slickgrid-universal/issues/1327) - by @ghiscoding

### Features

* add column `reorderable` option to optionally lock a column ([#1357](https://github.com/ghiscoding/slickgrid-universal/issues/1357)) ([44f6c08](https://github.com/ghiscoding/slickgrid-universal/commit/44f6c085f009ec41bec711aa14ae7fbb3fcbc156)) - by @ghiscoding
* **core:** expose all SlickEvent via internal PubSub Service ([#1311](https://github.com/ghiscoding/slickgrid-universal/issues/1311)) ([f56edef](https://github.com/ghiscoding/slickgrid-universal/commit/f56edef91b76ab044134ddf36d67599e6d80f39c)) - by @ghiscoding

# [4.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.1.0...v4.2.0) (2023-12-30)

### Bug Fixes

* **RowDetail:** sort change should collapse all Row Detail ([#1284](https://github.com/ghiscoding/slickgrid-universal/issues/1284)) ([21f6031](https://github.com/ghiscoding/slickgrid-universal/commit/21f60310a402dd12c80bf4553588c6cd777a131a)) - by @ghiscoding

### Features

* (re)add option to cancel Row Detail opening ([#1286](https://github.com/ghiscoding/slickgrid-universal/issues/1286)) ([f08925c](https://github.com/ghiscoding/slickgrid-universal/commit/f08925c50c1dd18448a04a55c8303736e3cc2289)) - by @ghiscoding

# [4.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.3...v4.1.0) (2023-12-21)

### Bug Fixes

* **npm:** publish src folder for source maps, fixes downstream builds ([#1269](https://github.com/ghiscoding/slickgrid-universal/issues/1269)) ([701da75](https://github.com/ghiscoding/slickgrid-universal/commit/701da752565384408e22857a201828379bfc26ff)) - by @ghiscoding

## [4.0.3](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.2...v4.0.3) (2023-12-16)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [4.0.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.2...v4.0.2) (2023-12-15)

* BREAKING CHANGE: merge SlickGrid into Slickgrid-Universal & drop external dep (#1264) ([18b96ce](https://github.com/ghiscoding/slickgrid-universal/commit/18b96ce2a5779b36c8bc2a977d4e03b0a7003006)), closes [#1264](https://github.com/ghiscoding/slickgrid-universal/issues/1264) - by @ghiscoding

### BREAKING CHANGES

* merge SlickGrid into Slickgrid-Universal & drop external dep

## [4.0.1-alpha.1](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.1-alpha.0...v4.0.1-alpha.1) (2023-12-12)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [4.0.1-alpha.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.0-alpha.0...v4.0.1-alpha.0) (2023-12-10)

### Bug Fixes

* regression, Row Detail no longer displayed after CSP safe code ([#1259](https://github.com/ghiscoding/slickgrid-universal/issues/1259)) ([a35f0a4](https://github.com/ghiscoding/slickgrid-universal/commit/a35f0a488775e8ccb68ec8fe0ece9abc47c358f4)) - by @ghiscoding

# [4.0.0-alpha.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.1...v4.0.0-alpha.0) (2023-12-09)

## [3.7.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.1...v3.7.2) (2023-12-12)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [3.7.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.0...v3.7.1) (2023-12-08)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

# [3.7.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.6.0...v3.7.0) (2023-12-08)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

# 3.6.0 (2023-11-26)

### Features

* Column.excludeFieldFromQuery, exclude field but keep fields array ([#1217](https://github.com/ghiscoding/slickgrid-universal/issues/1217)) ([85cc514](https://github.com/ghiscoding/slickgrid-universal/commit/85cc514c945c1ad6eadd1a93a2839775a95da261)) - by @Harsgalt86

## [3.5.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.5.0...v3.5.1) (2023-11-13)

### Bug Fixes

* improve build & types exports for all targets, Node, CJS/ESM ([#1188](https://github.com/ghiscoding/slickgrid-universal/issues/1188)) ([980fd68](https://github.com/ghiscoding/slickgrid-universal/commit/980fd68f6ce9564bb1fcac5f6ee68fd35f839e8f)) - by @ghiscoding

# [3.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.4.2...v3.5.0) (2023-11-10)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [3.4.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.4.1...v3.4.2) (2023-11-02)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [3.4.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.4.0...v3.4.1) (2023-11-02)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

# [3.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.3.2...v3.4.0) (2023-11-02)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [3.3.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.3.1...v3.3.2) (2023-10-06)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [3.3.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.3.0...v3.3.1) (2023-10-05)

### Reverts

* Revert "feat: add option to cancel Row Detail opening (#1125)" (#1127) ([5e4b14a](https://github.com/ghiscoding/slickgrid-universal/commit/5e4b14a15e7933d0699ef4c11d6336e76f1af597)), closes [#1125](https://github.com/ghiscoding/slickgrid-universal/issues/1125) [#1127](https://github.com/ghiscoding/slickgrid-universal/issues/1127) - by @ghiscoding

# [3.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.2.2...v3.3.0) (2023-10-05)

### Features

* add option to cancel Row Detail opening ([#1125](https://github.com/ghiscoding/slickgrid-universal/issues/1125)) ([82ba377](https://github.com/ghiscoding/slickgrid-universal/commit/82ba377132d90335ea2bca5bf628ab47841fc913)) - by @ghiscoding

## [3.2.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.2.1...v3.2.2) (2023-09-24)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [3.2.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.2.0...v3.2.1) (2023-09-05)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [3.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.1.0...v3.2.0) (2023-08-21)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [3.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.0.1...v3.1.0) (2023-07-20)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [3.0.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.0.0...v3.0.1) (2023-07-01)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [3.0.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.4...v3.0.0) (2023-05-29)

### ⚠ BREAKING CHANGES

* drop jQuery requirement & use multiple-select-vanilla dependency (#976)

### Features

* drop jQuery requirement & use multiple-select-vanilla dependency ([#976](https://github.com/ghiscoding/slickgrid-universal/issues/976)) ([4e3e1d3](https://github.com/ghiscoding/slickgrid-universal/commit/4e3e1d394247be75d1717feece833e200fce21dc)), closes [#919](https://github.com/ghiscoding/slickgrid-universal/issues/919) - by @ghiscoding

## [3.0.0-beta.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.4...v3.0.0-beta.0) (2023-05-20)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [2.6.4](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.3...v2.6.4) (2023-05-20)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [2.6.3](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.2...v2.6.3) (2023-03-23)

### Bug Fixes

* **presets:** dynamic columns should be auto-inserted with Grid Presets ([#938](https://github.com/ghiscoding/slickgrid-universal/issues/938)) ([1f9c1c4](https://github.com/ghiscoding/slickgrid-universal/commit/1f9c1c492586f4a0a6582ece4b44bc747e6990c8)) - by @ghiscoding

## [2.6.2](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.1...v2.6.2) (2023-03-03)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [2.6.1](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.0...v2.6.1) (2023-02-24)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

# [2.6.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.5.0...v2.6.0) (2023-02-23)

### Features

* **build:** move TypeScript types into a single dist/types folder ([#905](https://github.com/ghiscoding/slickgrid-universal/issues/905)) ([b139c1e](https://github.com/ghiscoding/slickgrid-universal/commit/b139c1e7910f2029ceca58a9d744320ed3ba5372)) - by @ghiscoding

# [2.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.4.1...v2.5.0) (2023-02-17)

### Bug Fixes

* **build:** package exports prop had invalid ESM import link ([#892](https://github.com/ghiscoding/slickgrid-universal/issues/892)) ([7f95f69](https://github.com/ghiscoding/slickgrid-universal/commit/7f95f698447f8178cb7ceec416c35f4957fddbe9)) - by @ghiscoding
* **RowDetail:** Row Detail extension should work with editable grid ([#896](https://github.com/ghiscoding/slickgrid-universal/issues/896)) ([99677f0](https://github.com/ghiscoding/slickgrid-universal/commit/99677f08b9cb383a2b64540700e501c7bdfe9f72)) - by @ghiscoding

## [2.4.1](https://github.com/ghiscoding/slickgrid-universal/compare/v2.4.0...v2.4.1) (2023-02-04)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

# [2.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.3.0...v2.4.0) (2023-02-04)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

# [2.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.2.2...v2.3.0) (2023-01-21)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [2.2.2](https://github.com/ghiscoding/slickgrid-universal/compare/v2.2.1...v2.2.2) (2022-12-24)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [2.2.1](https://github.com/ghiscoding/slickgrid-universal/compare/v2.2.0...v2.2.1) (2022-12-22)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

# [2.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.1.3...v2.2.0) (2022-12-21)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [2.1.3](https://github.com/ghiscoding/slickgrid-universal/compare/v2.1.2...v2.1.3) (2022-12-08)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [2.1.2](https://github.com/ghiscoding/slickgrid-universal/compare/v2.1.1...v2.1.2) (2022-12-02)

### Bug Fixes

* **addons:** do not add special columns twice (like Row Selection) ([#822](https://github.com/ghiscoding/slickgrid-universal/issues/822)) ([a80d6f8](https://github.com/ghiscoding/slickgrid-universal/commit/a80d6f8f2cae674e0a870eb9c450de991cd84837)) - by @ghiscoding
* all querySelector should be specific to a grid UID ([#823](https://github.com/ghiscoding/slickgrid-universal/issues/823)) ([bc2b65c](https://github.com/ghiscoding/slickgrid-universal/commit/bc2b65c676762d21ef45e7b76caf900708c1422f)) - by @ghiscoding

## [2.1.1](https://github.com/ghiscoding/slickgrid-universal/compare/v2.1.0...v2.1.1) (2022-11-19)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

# [2.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.0.0...v2.1.0) (2022-11-17)

### Features

* **plugins:** sync column definitions to user after plugin adds column ([#781](https://github.com/ghiscoding/slickgrid-universal/issues/781)) ([0755b65](https://github.com/ghiscoding/slickgrid-universal/commit/0755b655b7be5911345334e094544a14c3698b51)) - by @ghiscoding

# [2.0.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.4.0...v2.0.0) (2022-10-17)

### Features

* **common:** BREAKING CHANGE replace jQueryUI with SortableJS in common & DraggableGrouping ([#772](https://github.com/ghiscoding/slickgrid-universal/issues/772)) ([a9db2cc](https://github.com/ghiscoding/slickgrid-universal/commit/a9db2cca965adc7871d7e4d050ae8f3653c84bb4)), closes [#752](https://github.com/ghiscoding/slickgrid-universal/issues/752) [#756](https://github.com/ghiscoding/slickgrid-universal/issues/756) - by @ghiscoding

# [2.0.0-alpha.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.4.0...v2.0.0-alpha.0) (2022-10-15)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

# [1.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.7...v1.4.0) (2022-08-15)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [1.3.7](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.6...v1.3.7) (2022-08-02)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [1.3.5](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.4...v1.3.5) (2022-07-28)

### Bug Fixes

* **build:** use `workspace:~` to avoid multiple versions d/l on ext libs ([3ca1943](https://github.com/ghiscoding/slickgrid-universal/commit/3ca1943f1247e66d3213fb5edeed7e7246032767)) - by @ghiscoding

## [1.3.4](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.3...v1.3.4) (2022-07-28)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [1.3.3](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.2...v1.3.3) (2022-07-07)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [1.3.2](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.0...v1.3.2) (2022-07-06)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

# [1.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.6...v1.3.0) (2022-06-18)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [1.2.6](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.5...v1.2.6) (2022-03-19)

### Bug Fixes

* **core:** use latest Flatpickr version to fix leak in it ([0f68f51](https://github.com/ghiscoding/slickgrid-universal/commit/0f68f5131e227abfaf2dcaa790dda53a235d95fe))

## [1.2.5](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.4...v1.2.5) (2022-03-06)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [1.2.4](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.3...v1.2.4) (2022-02-15)

### Bug Fixes

* **core:** rollback node/npm minimum engine versions ([7fcaecd](https://github.com/ghiscoding/slickgrid-universal/commit/7fcaecdf5087e1414037832962ec9ea5365aca41))

## [1.2.3](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.1...v1.2.3) (2022-02-14)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [1.2.1](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.0...v1.2.1) (2022-01-18)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

# [1.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.1.1...v1.2.0) (2022-01-06)

**Note:** Version bump only for package @slickgrid-universal/row-detail-view-plugin

## [1.1.1](https://github.com/ghiscoding/slickgrid-universal/compare/v1.1.0...v1.1.1) (2021-12-11)

### Bug Fixes

* **build:** bump version manually bcoz of previous force push ([5e9a610](https://github.com/ghiscoding/slickgrid-universal/commit/5e9a610ad01d752673856591f9b5de73b0ece0e9))

# [1.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.19.2...v1.1.0) (2021-12-11)

### Features

* **plugins:** add Row Detail plugin final code & tests ([045ea6d](https://github.com/ghiscoding/slickgrid-universal/commit/045ea6d0e49e55163edcbe1ec6e796f51349667b))
* **plugins:** move Row Detail View plugin to universal ([9700ff4](https://github.com/ghiscoding/slickgrid-universal/commit/9700ff49132e9408b808f916f634976d80e12579))
* **plugins:** move Row Detail View plugin to universal ([fb327a6](https://github.com/ghiscoding/slickgrid-universal/commit/fb327a6abe85b86683572cde2a550de43a01f9e1))
