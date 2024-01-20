# Change Log
## All-in-One SlickGrid framework agnostic wrapper, visit [Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal) 📦🚀

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.2.0...v4.3.0) (2024-01-20)

### Features

* **plugin:** new Row Based Editor ([#1323](https://github.com/ghiscoding/slickgrid-universal/issues/1323)) ([64d464c](https://github.com/ghiscoding/slickgrid-universal/commit/64d464c2094c014024ddeaf49bd4f6ec898b1c25)) - by @zewa666

### Performance Improvements

* **resizer:** `autosizeColumns` is called too many times on page load ([#1343](https://github.com/ghiscoding/slickgrid-universal/issues/1343)) ([e02ac55](https://github.com/ghiscoding/slickgrid-universal/commit/e02ac550d9195ede2df58060fecc81b72c5011f9)) - by @ghiscoding

# [4.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.1.0...v4.2.0) (2023-12-30)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

# [4.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.3...v4.1.0) (2023-12-21)

### Bug Fixes

* **npm:** publish src folder for source maps, fixes downstream builds ([#1269](https://github.com/ghiscoding/slickgrid-universal/issues/1269)) ([701da75](https://github.com/ghiscoding/slickgrid-universal/commit/701da752565384408e22857a201828379bfc26ff)) - by @ghiscoding

### Features

* **utils:** replace slick-core extend utils with `node-extend` ([#1277](https://github.com/ghiscoding/slickgrid-universal/issues/1277)) ([3439118](https://github.com/ghiscoding/slickgrid-universal/commit/3439118da344cd852a1b1af5bd83c4b894213464)) - by @ghiscoding

## [4.0.3](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.2...v4.0.3) (2023-12-16)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [4.0.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.2...v4.0.2) (2023-12-15)

* BREAKING CHANGE: merge SlickGrid into Slickgrid-Universal & drop external dep (#1264) ([18b96ce](https://github.com/ghiscoding/slickgrid-universal/commit/18b96ce2a5779b36c8bc2a977d4e03b0a7003006)), closes [#1264](https://github.com/ghiscoding/slickgrid-universal/issues/1264) - by @ghiscoding

### BREAKING CHANGES

* merge SlickGrid into Slickgrid-Universal & drop external dep

## [4.0.1-alpha.1](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.1-alpha.0...v4.0.1-alpha.1) (2023-12-12)

### Bug Fixes

* changing `enableCellNavigation` grid option not working ([#1262](https://github.com/ghiscoding/slickgrid-universal/issues/1262)) ([b7de0f1](https://github.com/ghiscoding/slickgrid-universal/commit/b7de0f12546a6cc02222ed747015e65c90bb7f7d)) - by @ghiscoding

## [4.0.1-alpha.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.0-alpha.0...v4.0.1-alpha.0) (2023-12-10)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

# [4.0.0-alpha.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.1...v4.0.0-alpha.0) (2023-12-09)

### Bug Fixes

* remove CellRange, SlickRange, SlickGroup, ... unused interfaces ([#1219](https://github.com/ghiscoding/slickgrid-universal/issues/1219)) ([a4cc469](https://github.com/ghiscoding/slickgrid-universal/commit/a4cc469e9c21c5ed851bfbaafdc6b580e7389272)) - by @ghiscoding

### Features

* convert GroupItemMetadataProvider Formatter to native HTML for CSP ([#1215](https://github.com/ghiscoding/slickgrid-universal/issues/1215)) ([d723856](https://github.com/ghiscoding/slickgrid-universal/commit/d723856777329f2e40fe3a12d3c59e33afd0e3a8)) - by @ghiscoding
* use PubSub Service singleton to subscribe to any SlickEvent ([#1248](https://github.com/ghiscoding/slickgrid-universal/issues/1248)) ([388bd11](https://github.com/ghiscoding/slickgrid-universal/commit/388bd115c1a15f853da8ac943a6e5e3574630438)) - by @ghiscoding

## [3.7.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.1...v3.7.2) (2023-12-12)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [3.7.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.0...v3.7.1) (2023-12-08)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

# [3.7.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.6.0...v3.7.0) (2023-12-08)

### Bug Fixes

* cell selection range with key combos were incorrect ([#1244](https://github.com/ghiscoding/slickgrid-universal/issues/1244)) ([79d86fe](https://github.com/ghiscoding/slickgrid-universal/commit/79d86fea99258ccf82a5d3d8c684410623e6753b)) - by @ghiscoding
* registered external resouces should keep singleton ref ([#1242](https://github.com/ghiscoding/slickgrid-universal/issues/1242)) ([adf2054](https://github.com/ghiscoding/slickgrid-universal/commit/adf2054bdc8ef7701e6fab78e685d49b8424da29)) - by @ghiscoding

# 3.6.0 (2023-11-26)

### Features

* Column.excludeFieldFromQuery, exclude field but keep fields array ([#1217](https://github.com/ghiscoding/slickgrid-universal/issues/1217)) ([85cc514](https://github.com/ghiscoding/slickgrid-universal/commit/85cc514c945c1ad6eadd1a93a2839775a95da261)) - by @Harsgalt86

## [3.5.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.5.0...v3.5.1) (2023-11-13)

### Bug Fixes

* improve build & types exports for all targets, Node, CJS/ESM ([#1188](https://github.com/ghiscoding/slickgrid-universal/issues/1188)) ([980fd68](https://github.com/ghiscoding/slickgrid-universal/commit/980fd68f6ce9564bb1fcac5f6ee68fd35f839e8f)) - by @ghiscoding

# [3.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.4.2...v3.5.0) (2023-11-10)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [3.4.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.4.1...v3.4.2) (2023-11-02)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [3.4.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.4.0...v3.4.1) (2023-11-02)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

# [3.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.3.2...v3.4.0) (2023-11-02)

### Bug Fixes

* **common:** disable throwWhenFrozenNotAllViewable w/frozen grids ([#1149](https://github.com/ghiscoding/slickgrid-universal/issues/1149)) ([9a06875](https://github.com/ghiscoding/slickgrid-universal/commit/9a06875d8654c47d97aaaa0fd5191c1bfeae7288)) - by @ghiscoding
* **common:** make sure destroy is a function before calling it ([#1148](https://github.com/ghiscoding/slickgrid-universal/issues/1148)) ([dba9606](https://github.com/ghiscoding/slickgrid-universal/commit/dba96060666a929eb616bcacb492f6f5f3f56106)) - by @ghiscoding

### Features

* add support for grid inside Shadow DOM ([#1166](https://github.com/ghiscoding/slickgrid-universal/issues/1166)) ([f7b8c46](https://github.com/ghiscoding/slickgrid-universal/commit/f7b8c46593c71b7114ac85610c12ad6187e3f6de)) - by @ghiscoding

## [3.3.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.3.1...v3.3.2) (2023-10-06)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

# [3.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.2.2...v3.3.0) (2023-10-05)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [3.2.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.2.1...v3.2.2) (2023-09-24)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [3.2.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.2.0...v3.2.1) (2023-09-05)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [3.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.1.0...v3.2.0) (2023-08-21)

### Bug Fixes

* adding dataset hierarchical item shouldn't cause scroll flickering ([#1076](https://github.com/ghiscoding/slickgrid-universal/issues/1076)) ([8536e0e](https://github.com/ghiscoding/slickgrid-universal/commit/8536e0e04f1168648251f517cb47ea2e7129e231)) - by @ghiscoding

## [3.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.0.1...v3.1.0) (2023-07-20)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [3.0.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.0.0...v3.0.1) (2023-07-01)

### Bug Fixes

* **deps:** update dependency slickgrid to ^4.0.1 ([#1017](https://github.com/ghiscoding/slickgrid-universal/issues/1017)) ([2750816](https://github.com/ghiscoding/slickgrid-universal/commit/2750816b7b669a820362934daa9bbfd5d60f3ac5)) - by @renovate-bot

## [3.0.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.4...v3.0.0) (2023-05-29)

### ⚠ BREAKING CHANGES

* drop jQuery requirement & use multiple-select-vanilla dependency (#976)

### Features

* drop jQuery requirement & use multiple-select-vanilla dependency ([#976](https://github.com/ghiscoding/slickgrid-universal/issues/976)) ([4e3e1d3](https://github.com/ghiscoding/slickgrid-universal/commit/4e3e1d394247be75d1717feece833e200fce21dc)), closes [#919](https://github.com/ghiscoding/slickgrid-universal/issues/919) - by @ghiscoding

## [3.0.0-beta.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.4...v3.0.0-beta.0) (2023-05-20)

### ⚠ BREAKING CHANGES

* drop jQuery requirement (#962)

### Features

* drop jQuery requirement ([#962](https://github.com/ghiscoding/slickgrid-universal/issues/962)) ([3da21da](https://github.com/ghiscoding/slickgrid-universal/commit/3da21daacc391a0fb309fcddd78442642c5269f6)) - by @ghiscoding

## [2.6.4](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.3...v2.6.4) (2023-05-20)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [2.6.3](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.2...v2.6.3) (2023-03-23)

### Bug Fixes

* **presets:** dynamic columns should be auto-inserted with Grid Presets ([#938](https://github.com/ghiscoding/slickgrid-universal/issues/938)) ([1f9c1c4](https://github.com/ghiscoding/slickgrid-universal/commit/1f9c1c492586f4a0a6582ece4b44bc747e6990c8)) - by @ghiscoding

## [2.6.2](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.1...v2.6.2) (2023-03-03)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [2.6.1](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.0...v2.6.1) (2023-02-24)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

# [2.6.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.5.0...v2.6.0) (2023-02-23)

### Features

* **build:** move TypeScript types into a single dist/types folder ([#905](https://github.com/ghiscoding/slickgrid-universal/issues/905)) ([b139c1e](https://github.com/ghiscoding/slickgrid-universal/commit/b139c1e7910f2029ceca58a9d744320ed3ba5372)) - by @ghiscoding

# [2.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.4.1...v2.5.0) (2023-02-17)

### Bug Fixes

* **build:** package exports prop had invalid ESM import link ([#892](https://github.com/ghiscoding/slickgrid-universal/issues/892)) ([7f95f69](https://github.com/ghiscoding/slickgrid-universal/commit/7f95f698447f8178cb7ceec416c35f4957fddbe9)) - by @ghiscoding
* **common:** Excel copy cell ranges shouldn't lose its cell focus ([#901](https://github.com/ghiscoding/slickgrid-universal/issues/901)) ([1dc8b76](https://github.com/ghiscoding/slickgrid-universal/commit/1dc8b762b4fc8070eec003161fdc9c4ebf60afd2)) - by @ghiscoding

## [2.4.1](https://github.com/ghiscoding/slickgrid-universal/compare/v2.4.0...v2.4.1) (2023-02-04)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

# [2.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.3.0...v2.4.0) (2023-02-04)

### Features

* **dataView:** add option to apply row selection to all pages ([#882](https://github.com/ghiscoding/slickgrid-universal/issues/882)) ([4aac7cb](https://github.com/ghiscoding/slickgrid-universal/commit/4aac7cb7f38c3675a2ad693212152ded94ee2174)) - by @ghiscoding

# [2.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.2.2...v2.3.0) (2023-01-21)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [2.2.2](https://github.com/ghiscoding/slickgrid-universal/compare/v2.2.1...v2.2.2) (2022-12-24)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [2.2.1](https://github.com/ghiscoding/slickgrid-universal/compare/v2.2.0...v2.2.1) (2022-12-22)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

# [2.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.1.3...v2.2.0) (2022-12-21)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [2.1.3](https://github.com/ghiscoding/slickgrid-universal/compare/v2.1.2...v2.1.3) (2022-12-08)

### Bug Fixes

* Grid Menu filtering options should be removed when option disabled ([#837](https://github.com/ghiscoding/slickgrid-universal/issues/837)) ([9bc29d2](https://github.com/ghiscoding/slickgrid-universal/commit/9bc29d2682256605dd80475015b85879e1298381)) - by @ghiscoding

## [2.1.2](https://github.com/ghiscoding/slickgrid-universal/compare/v2.1.1...v2.1.2) (2022-12-02)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [2.1.1](https://github.com/ghiscoding/slickgrid-universal/compare/v2.1.0...v2.1.1) (2022-11-19)

### Bug Fixes

* **plugins:** rollback PR [#781](https://github.com/ghiscoding/slickgrid-universal/issues/781) to fix regression with Grid Presets ([#820](https://github.com/ghiscoding/slickgrid-universal/issues/820)) ([60e4a29](https://github.com/ghiscoding/slickgrid-universal/commit/60e4a299a2cbdee947b36dbfbb690f22156f8693)) - by @ghiscoding

# [2.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.0.0...v2.1.0) (2022-11-17)

### Bug Fixes

* **build:** upgrading to TypeScript 4.9 brought new build issue ([#816](https://github.com/ghiscoding/slickgrid-universal/issues/816)) ([4d46d8a](https://github.com/ghiscoding/slickgrid-universal/commit/4d46d8ab251bd78671140f82cb143b973e5422b3)) - by @ghiscoding

### Features

* **core:** expose EventPubSub Service on SlickerGridInstance ([#780](https://github.com/ghiscoding/slickgrid-universal/issues/780)) ([8ad54b5](https://github.com/ghiscoding/slickgrid-universal/commit/8ad54b5739772eb8d96d23e1be04ebb426dfa596)) - by @ghiscoding
* **plugins:** sync column definitions to user after plugin adds column ([#781](https://github.com/ghiscoding/slickgrid-universal/issues/781)) ([0755b65](https://github.com/ghiscoding/slickgrid-universal/commit/0755b655b7be5911345334e094544a14c3698b51)) - by @ghiscoding

# [2.0.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.4.0...v2.0.0) (2022-10-17)

### Features

* **common:** BREAKING CHANGE replace jQueryUI with SortableJS in common & DraggableGrouping ([#772](https://github.com/ghiscoding/slickgrid-universal/issues/772)) ([a9db2cc](https://github.com/ghiscoding/slickgrid-universal/commit/a9db2cca965adc7871d7e4d050ae8f3653c84bb4)), closes [#752](https://github.com/ghiscoding/slickgrid-universal/issues/752) [#756](https://github.com/ghiscoding/slickgrid-universal/issues/756) - by @ghiscoding

# [2.0.0-alpha.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.4.0...v2.0.0-alpha.0) (2022-10-15)

### Features

* **common:** replace jQueryUI Autocomplete with Kradeen Autocomplete ([#752](https://github.com/ghiscoding/slickgrid-universal/issues/752)) ([991d29c](https://github.com/ghiscoding/slickgrid-universal/commit/991d29c4c8c85d800d69c4ba16d608d7a20d2a90)) - by @ghiscoding

# [1.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.7...v1.4.0) (2022-08-15)

### Bug Fixes

* **bundle:** fetch API isn't always an instance of Response ([#744](https://github.com/ghiscoding/slickgrid-universal/issues/744)) ([72a6f24](https://github.com/ghiscoding/slickgrid-universal/commit/72a6f2489a88974c8f5faf0041184ac78d6c7caa)) - by @ghiscoding
* **collectionAsync:** hidden column does not load edit field selection ([#742](https://github.com/ghiscoding/slickgrid-universal/issues/742)) ([763c61c](https://github.com/ghiscoding/slickgrid-universal/commit/763c61cfa7e82dd82b88f22db3eb47dc274a5eb3)) - by @mcallegario

## [1.3.7](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.6...v1.3.7) (2022-08-02)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [1.3.5](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.4...v1.3.5) (2022-07-28)

### Bug Fixes

* **build:** use `workspace:~` to avoid multiple versions d/l on ext libs ([3ca1943](https://github.com/ghiscoding/slickgrid-universal/commit/3ca1943f1247e66d3213fb5edeed7e7246032767)) - by @ghiscoding

## [1.3.4](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.3...v1.3.4) (2022-07-28)

### Bug Fixes

* **deps:** update dependency jquery-ui to ^1.13.2 ([#720](https://github.com/ghiscoding/slickgrid-universal/issues/720)) ([8351f14](https://github.com/ghiscoding/slickgrid-universal/commit/8351f144192ec5e91ad52678787a448cf42f975f)) - by @renovate-bot

## [1.3.3](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.2...v1.3.3) (2022-07-07)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [1.3.2](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.0...v1.3.2) (2022-07-06)

### Bug Fixes

* **composite:** selected row count always 0 on mass-selected ([#712](https://github.com/ghiscoding/slickgrid-universal/issues/712)) ([ec42dc7](https://github.com/ghiscoding/slickgrid-universal/commit/ec42dc753fbf8c84040e252f328e51ea4a98cedf))

# [1.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.6...v1.3.0) (2022-06-18)

### Bug Fixes

* **deps:** add missing depency in vanilla bundle package ([fa08fe6](https://github.com/ghiscoding/slickgrid-universal/commit/fa08fe6f097461c2bf8029307e59631738b1654b))
* **deps:** add missing dependencies in child package ([97d0230](https://github.com/ghiscoding/slickgrid-universal/commit/97d02306899e583779c3b6d5b219b2798a5f9cfd))
* **deps:** use chore dependency package name ([2fce29c](https://github.com/ghiscoding/slickgrid-universal/commit/2fce29c5e64f160203529b5bf9435562cf5f5941))

### Features

* **core:** upgrade to jQuery 3.6 and jQuery-UI 1.13 ([84b09dc](https://github.com/ghiscoding/slickgrid-universal/commit/84b09dc8ba7c78c14e0ae563cd560eec46973a4b))

## [1.2.6](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.5...v1.2.6) (2022-03-19)

### Bug Fixes

* **core:** use latest Flatpickr version to fix leak in it ([0f68f51](https://github.com/ghiscoding/slickgrid-universal/commit/0f68f5131e227abfaf2dcaa790dda53a235d95fe))

## [1.2.5](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.4...v1.2.5) (2022-03-06)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [1.2.4](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.3...v1.2.4) (2022-02-15)

### Bug Fixes

* **core:** rollback node/npm minimum engine versions ([7fcaecd](https://github.com/ghiscoding/slickgrid-universal/commit/7fcaecdf5087e1414037832962ec9ea5365aca41))

## [1.2.3](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.1...v1.2.3) (2022-02-14)

### Bug Fixes

* **core:** deleting Slicker object caused issue with cache ([3f3e261](https://github.com/ghiscoding/slickgrid-universal/commit/3f3e261c1855e7eb695e00a105b7c797462ed298)), closes [#606](https://github.com/ghiscoding/slickgrid-universal/issues/606)

## [1.2.1](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.0...v1.2.1) (2022-01-18)

### Bug Fixes

* **memory:** clear & dispose of grid to avoid mem leaks & detached elm ([7035db5](https://github.com/ghiscoding/slickgrid-universal/commit/7035db5f878187f6fb8b9d2effacb7443f25e2c9))

# [1.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.1.1...v1.2.0) (2022-01-06)

### Features

* **services:** add extra features to EventPubSub Service ([9bd02b5](https://github.com/ghiscoding/slickgrid-universal/commit/9bd02b5d92bcf6aaf89a828c4e6496a24e795c53))

## [1.1.1](https://github.com/ghiscoding/slickgrid-universal/compare/v1.1.0...v1.1.1) (2021-12-11)

### Bug Fixes

* **build:** bump version manually bcoz of previous force push ([5e9a610](https://github.com/ghiscoding/slickgrid-universal/commit/5e9a610ad01d752673856591f9b5de73b0ece0e9))

# [1.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.19.2...v1.1.0) (2021-12-11)

### Bug Fixes

* **context:** strip hidden special chars on context menu Copy command ([f94ca83](https://github.com/ghiscoding/slickgrid-universal/commit/f94ca834b1fdee94e4e44bdc3d245956a4437de6))

* **locales:** add missing text & remove global config texts fix Locales ([655a872](https://github.com/ghiscoding/slickgrid-universal/commit/655a872d7160ab53530f8e2fdc575817af782b5d))

### Features

* **build:** create `salesforce-vanilla-bundle` standalone package ([214d8e7](https://github.com/ghiscoding/slickgrid-universal/commit/214d8e77646d3fdac278cf18227c96f346c94522))
* **controls:** convert and add ColumnPicker into Slickgrid-Universal ([1f937b9](https://github.com/ghiscoding/slickgrid-universal/commit/1f937b9a3abe43cf1a2bb1f52ba625c34431e328))
* **controls:** move external Grid Menu into Slickgrid-Universal ([40adff4](https://github.com/ghiscoding/slickgrid-universal/commit/40adff49c2a74769823dfbed3d32b239608e2a59))
* **plugins:** move Checkbox and Row Selection plugins to universal ([06f0ab1](https://github.com/ghiscoding/slickgrid-universal/commit/06f0ab155a2f0ee06681d3e94780397c5e4f9f67))
* **plugins:** move external Cell Menu into Slickgrid-Universal ([6f34c10](https://github.com/ghiscoding/slickgrid-universal/commit/6f34c10b9a8522ae430e13c9519083451bf71ebf))
* **plugins:** move external cell related plugins to universal ([11e15d8](https://github.com/ghiscoding/slickgrid-universal/commit/11e15d88360b7b30ca7ab94624a7928201f15945))
* **plugins:** move external Context Menu into Slickgrid-Universal ([2170bb4](https://github.com/ghiscoding/slickgrid-universal/commit/2170bb4e3f02ef6f45ad13a1c59730047942651e))
* **plugins:** move external Draggable Grouping into Slickgrid-Universal ([8e6eb48](https://github.com/ghiscoding/slickgrid-universal/commit/8e6eb4881741313b7d582d2e3d17ffef582ecb35))
* **plugins:** move external GroupItemMetataProvider into Universal ([8f18c7d](https://github.com/ghiscoding/slickgrid-universal/commit/8f18c7d3d616e4cd72eb5478d544ec241c53154f))
* **plugins:** move external Header Button into Slickgrid-Universal ([69711ad](https://github.com/ghiscoding/slickgrid-universal/commit/69711aded5aa835091789800214f82cd7c72753e))
* **plugins:** move external Header Menu into Slickgrid-Universal ([aeba480](https://github.com/ghiscoding/slickgrid-universal/commit/aeba4801fdb5cba3976984f5c591be8c1ad97e4b))
* **plugins:** move Row Detail View plugin to universal ([fb327a6](https://github.com/ghiscoding/slickgrid-universal/commit/fb327a6abe85b86683572cde2a550de43a01f9e1))
* **plugins:** move Row Move Manager plugin to universal ([b19b2ed](https://github.com/ghiscoding/slickgrid-universal/commit/b19b2ed2da669662fbbdcf9fdefac243132909b2))
* **plugins:** replace AutoTooltips Extension by plugin ([80df14d](https://github.com/ghiscoding/slickgrid-universal/commit/80df14da9b66e9e1b8314e5adb1b96890cc7baa1))

## [0.19.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.19.1...v0.19.2) (2021-11-19)

### Bug Fixes

* **resizer:** use autosize width when total width smaller than viewport ([555fb0c](https://github.com/ghiscoding/slickgrid-universal/commit/555fb0cb793c111de837ffe6e9f212fcbf5ed701))
* **translation:** add new UNFREEZE_COLUMNS to fix translation ([22ed231](https://github.com/ghiscoding/slickgrid-universal/commit/22ed2313c45587f2ebdb279c9e47df881c6f83d6))

## [0.19.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.19.0...v0.19.1) (2021-11-15)

### Bug Fixes

* **context:** strin hidden special chars on context menu Copy command ([221c05d](https://github.com/ghiscoding/slickgrid-universal/commit/221c05d8d6345d090074c92e423071888e4a2686))
* **tree:**  reset to initial tree sort when calling "Clear all Sorting" ([984e3a7](https://github.com/ghiscoding/slickgrid-universal/commit/984e3a7bf0bf734f035514d32d44c6164c6fdab1))

# [0.19.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.18.0...v0.19.0) (2021-10-28)

### Bug Fixes

* make it work with AutoTooltip and extra option to skip it ([2f7e4c5](https://github.com/ghiscoding/slickgrid-universal/commit/2f7e4c502471c236a76510905ddbf07f653ea5d8))
* **frozen:** calling `setPinning` with empty object/null should clear it ([48b11f7](https://github.com/ghiscoding/slickgrid-universal/commit/48b11f74f2ce6541b6e6e03bf7fe194e5be96d0e))
* **styling:** cleanup CSS files to ship smaller bundle ([69b18bf](https://github.com/ghiscoding/slickgrid-universal/commit/69b18bf3505fc5538de878b7dbf33104faa8b11a))

### Features
* **plugin:** add row move shadown item while moving/dragging row ([c665ec8](https://github.com/ghiscoding/slickgrid-universal/commit/c665ec88be859feeea89e5ab8826f2b0a57c5cfb))

* add async process to use with Promise/Observable ([7350a6d](https://github.com/ghiscoding/slickgrid-universal/commit/7350a6d06ef5bb8495a05e22421f9b7b5a4270cb))
* **plugin:** create new Custom Tooltip plugin ([4c8c4f6](https://github.com/ghiscoding/slickgrid-universal/commit/4c8c4f62423665bc2e1dcf0675b1300607397b6a))

# [0.18.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.17.0...v0.18.0) (2021-09-29)

### Bug Fixes

* **filters:** css "filled" class on filters should also work w/Grid View ([e8edae7](https://github.com/ghiscoding/slickgrid-universal/commit/e8edae79bcd5c28438203e269d26f107e26c4ae5))

### Features

* **styling:** increase highlight of filters that are filled w/values ([8f93534](https://github.com/ghiscoding/slickgrid-universal/commit/8f9353418190ee3e11aca65d1a57fa4204331011))

# [0.17.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.16.2...v0.17.0) (2021-09-09)

### Bug Fixes

* **bundle:** don't assume slickgrid/dataview are always defined ([0505713](https://github.com/ghiscoding/slickgrid-universal/commit/050571315f0d11f1eff853b3961f3be941a99e51))
* **footer:** use `getFilteredItemCount` to show correct count, fix [#469](https://github.com/ghiscoding/slickgrid-universal/issues/469) ([963235c](https://github.com/ghiscoding/slickgrid-universal/commit/963235c017c28309460d2cb88de88c880ac0cb4f))
* **grouping:** Draggable Grouping should clear preheader when called ([37811a5](https://github.com/ghiscoding/slickgrid-universal/commit/37811a51d2af04e78aedc88ff5d8eae8a622ac40))
* **resizer:** regression introduced by [#462](https://github.com/ghiscoding/slickgrid-universal/issues/462) for the grid resize in SF ([f34d8b9](https://github.com/ghiscoding/slickgrid-universal/commit/f34d8b9678c7ee9e76534a7f7ffdf2c4d7f9f772))
* **resizer:** resizer not always triggered in SF and show broken UI ([89fc62e](https://github.com/ghiscoding/slickgrid-universal/commit/89fc62eff7fac8b5cf43b3b6acd7590ed84288f6))
* **state:** don't use previous columns ref when getting current cols ([f312c60](https://github.com/ghiscoding/slickgrid-universal/commit/f312c60349d5bc95527ec93cb752f449d1c761f7))
* **styling:** add ms-select placeholder bg-color to fix Bootstrap 5 ([2c34d12](https://github.com/ghiscoding/slickgrid-universal/commit/2c34d1229c14bd36bd034062cc7eb7a7cbe1bf5c))

### Features

* **backend:** add cancellable onBeforeSort & revert sort on error ([958f823](https://github.com/ghiscoding/slickgrid-universal/commit/958f823a6bffedc2c146c7c68d49a29419812995))
* **editors:** add Ctrl+S combo to enhance LongText (textarea) Editor ([5116bbd](https://github.com/ghiscoding/slickgrid-universal/commit/5116bbd9e837a3bbd9835b10b2167edf3561cd3d))
* **sanitize:** make sure any string sent to innerHtml are sanitized ([fe55046](https://github.com/ghiscoding/slickgrid-universal/commit/fe550461d27d01cb5c54d93812db82fa7213f96b))
* **styling:** only show header menu caret when hovering ([41e7856](https://github.com/ghiscoding/slickgrid-universal/commit/41e7856f9483f7228d1455f2e3810ae58a5f5c8d))
* **tree:** add `dynamicallyToggledItemState` method to toggle parent(s) ([26369f9](https://github.com/ghiscoding/slickgrid-universal/commit/26369f9b6c9e81ad5705f580896ab28cf362d090))

## [0.16.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.16.1...v0.16.2) (2021-07-23)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.16.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.16.0...v0.16.1) (2021-07-16)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

# [0.16.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.15.0...v0.16.0) (2021-07-16)

### Bug Fixes

* **events:** use nullish coalescing in slickgrid event prefix ([6ff551b](https://github.com/ghiscoding/slickgrid-universal/commit/6ff551b6dab1ba1d8b471273f3419bdb29a60a35))
* **tree:** same dataset length but w/different prop should refresh Tree ([549008a](https://github.com/ghiscoding/slickgrid-universal/commit/549008a40ef34a95200c275fbf84bbf7b10aa4bb))

# [0.15.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.14.1...v0.15.0) (2021-07-06)

### Bug Fixes

* **build:** the "files" property should be included in pkg.json ([3d8f12e](https://github.com/ghiscoding/slickgrid-universal/commit/3d8f12e5f55079445c6fb5cde767f8e0b4511ebb))
* **editors:** select dropdown value is undefined it shouldn't call save ([015294b](https://github.com/ghiscoding/slickgrid-universal/commit/015294b86e431e8109ce540dda7856b7e9e27575))
* **formatters:** shouldn't auto-add editor formatter multiple times ([177b8d4](https://github.com/ghiscoding/slickgrid-universal/commit/177b8d44cddbbcdece48360071fbed25ceab10eb))
* **frozen:** in some occasion column pinning changes column positions ([70cb74e](https://github.com/ghiscoding/slickgrid-universal/commit/70cb74ef1119a60b37d438130d4a463a87a8939a))
* **pagination:** able to change translate pubsub event name in component ([4745063](https://github.com/ghiscoding/slickgrid-universal/commit/4745063930374a21986fc11d736d3bd05c9d6e41))
* **pagination:** should be able to toggle Pagination ([c0367c2](https://github.com/ghiscoding/slickgrid-universal/commit/c0367c24da2ccb3558e1b27f8e70a81d84201479))
* **Pagination:** the Pagination wasn't showing when using dataset setter ([ac3f933](https://github.com/ghiscoding/slickgrid-universal/commit/ac3f933d9829edcf89e5ea15571da9a7e4b7c4ba))
* **plugin:** row move shouldn't go further when onBefore returns false ([e9bfb5c](https://github.com/ghiscoding/slickgrid-universal/commit/e9bfb5ceba6a18a020b8b34f72abba6e3d13d8b8))
* **resizer:** few fixes & adjustments after trying in SF ([32e80ec](https://github.com/ghiscoding/slickgrid-universal/commit/32e80ecdbc5072c1619593d101289a3c1ea92b3a))
* **resizer:** tweak resize check to stop much earlier ([ea35b08](https://github.com/ghiscoding/slickgrid-universal/commit/ea35b08973e7b58b49969337875816bcad78e0ba))
* **state:** Grid View/Columns dynamically should work w/row move ([a7cf1df](https://github.com/ghiscoding/slickgrid-universal/commit/a7cf1dfb73c770908aadf01fd67680c985449f9d))
* **tree:** calling updateItems should not lose the Tree collapsing icon ([45b9622](https://github.com/ghiscoding/slickgrid-universal/commit/45b96225dd5a676b6a85bbb2c8146137eb95b33f))
* **tree:** using `initiallyCollapsed` change internal toggled state ([380f2f9](https://github.com/ghiscoding/slickgrid-universal/commit/380f2f903d9908e2bed5b3f44d04e28e5d5b9c63))
* make sure dataset is array before getting his length ([702d9fd](https://github.com/ghiscoding/slickgrid-universal/commit/702d9fddb5e753bfa5323bd2f25fd0bb33cb749a))

### Features

* **components:** extract Custom Footer to be an external component ([1794c27](https://github.com/ghiscoding/slickgrid-universal/commit/1794c27d7669c172f606d709d3360bc5d2f77798))
* **filters:** build multiple-select options from native dom elements ([aa548a9](https://github.com/ghiscoding/slickgrid-universal/commit/aa548a9bc05da0d4d5233a2633ae3055fd9f7178))
* **footer:** add option to customize right footer text ([2ea41cc](https://github.com/ghiscoding/slickgrid-universal/commit/2ea41cc8ab38ebc5d5276c90de33b57247c4476f))
* **Pagination:** decouple the Pagination Component to separate package ([606795b](https://github.com/ghiscoding/slickgrid-universal/commit/606795b677956a88c2e4b5e943fddcaba3113b51))
* **services:** decouple the EventPubSubService to separate package ([9f51665](https://github.com/ghiscoding/slickgrid-universal/commit/9f516655e9ce5f06e0cfeabc43536834dc38c70b))
* **services:** move Resizer Service w/common services folder for reuse ([d127ac7](https://github.com/ghiscoding/slickgrid-universal/commit/d127ac797ee787ea7785e8ae9f4c0bcaed786afd))
* **styling:** add a new `color-disabled-dark` ([55c3062](https://github.com/ghiscoding/slickgrid-universal/commit/55c30621241ec5da7a2e19879265c4e15a6ad907))
* **tree:** add Tree Collapse Grid State/Preset ([998b01a](https://github.com/ghiscoding/slickgrid-universal/commit/998b01a2f10ccee5636f616921dd86b35a4feaec))

## [0.14.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.14.0...v0.14.1) (2021-05-22)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

# [0.14.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.13.0...v0.14.0) (2021-05-22)

### Bug Fixes

* **backend:** able to preset filters on hidden columns & all queried ([c610979](https://github.com/ghiscoding/slickgrid-universal/commit/c610979c54170c069b97a71864d95d0363d75e80))
* **frozen:** rollback previous commit since the issue was found in SlickGrid (core) ([780bcd7](https://github.com/ghiscoding/slickgrid-universal/commit/780bcd7bfae35e26cd84c9a6d220e2dab9eca3b4))
* **presets:** loading columns presets should only be done once ([4273aa9](https://github.com/ghiscoding/slickgrid-universal/commit/4273aa9f123d429d5fe4d2163b19407cece86ba9)), closes [#341](https://github.com/ghiscoding/slickgrid-universal/issues/341)
* **resizer:** fix a regression bug caused by previous PR [#341](https://github.com/ghiscoding/slickgrid-universal/issues/341) ([462e330](https://github.com/ghiscoding/slickgrid-universal/commit/462e330d9457300fa3ef4e67bf8e012d8167ca2c))
* **resizer:** remove delay to call resize by content to avoid flickering ([961efe6](https://github.com/ghiscoding/slickgrid-universal/commit/961efe6fe7ad721e8196c76ed4c35205830b6b83))
* **services:** fix couple of issues found with custom grid views ([db06736](https://github.com/ghiscoding/slickgrid-universal/commit/db0673688b2b6e6dde8f25af9551bf6c27174a44))
* **sorting:** multi-column sort shouldn't work when option is disabled ([bfc8651](https://github.com/ghiscoding/slickgrid-universal/commit/bfc865128de0a9e4c21ff0dc8b564c15c88dea93))
* **styling:** add a better search filter magnify glass icon as placeholder ([5464824](https://github.com/ghiscoding/slickgrid-universal/commit/5464824f3719ebddb303ee1b82161638d870a288))
* **styling:** center horizontally checkbox selector in column header ([bb5aebc](https://github.com/ghiscoding/slickgrid-universal/commit/bb5aebc355a22e19b0071bfe993bbeb0e1090265))
* **tree:** Tree Data export should also include correct indentation ([f1e06c1](https://github.com/ghiscoding/slickgrid-universal/commit/f1e06c11f9eaa9ee778d319bfbaba20bb9abfcc9))
* add item should work in the demo even with filter preset ([d9c97eb](https://github.com/ghiscoding/slickgrid-universal/commit/d9c97ebb587184e94439f6fde1ec8c8a739e7bfa))
* add item to flat and/or tree should both work ([1b19028](https://github.com/ghiscoding/slickgrid-universal/commit/1b19028c9d58a31597906e371f439b094bca7ff0))
* addItem from grid service should work with tree data ([8b468f0](https://github.com/ghiscoding/slickgrid-universal/commit/8b468f055144b001378395546519d1801e046a0a))
* Grid Service addItem should invalidate hierarchical dataset itself ([066e894](https://github.com/ghiscoding/slickgrid-universal/commit/066e894271603562b10e014c4febfb18626e54f0))
* return all onBeforeX events in delayed promise to fix spinner ([bb36d1a](https://github.com/ghiscoding/slickgrid-universal/commit/bb36d1af114031eb973cf9993bdb9be1dd050de3))
* **tree:** couple of issues found in Tree Data, fixes [#307](https://github.com/ghiscoding/slickgrid-universal/issues/307) ([e684d1a](https://github.com/ghiscoding/slickgrid-universal/commit/e684d1af1c078a8861c3c94fe5486cbe68d57b85))

### Features

* **resizer:** add `resizeByContentOnlyOnFirstLoad` grid option ([ffe7dc4](https://github.com/ghiscoding/slickgrid-universal/commit/ffe7dc4c2a7ae778c8e731fd7637b154c10035f0))
* **resizer:** add single Column Resize by Content dblClick & headerMenu ([683389f](https://github.com/ghiscoding/slickgrid-universal/commit/683389fcc343ac5c0378a9e34b7f11dda97fc719))
* **styling:** add new marker material icons for project ([9b386fa](https://github.com/ghiscoding/slickgrid-universal/commit/9b386fa3e6af8e76cf4beb5aa0b5322db2f270af))
* add `titleFormatter` to Tree Data ([8bf32ca](https://github.com/ghiscoding/slickgrid-universal/commit/8bf32caa08a6c5a28c7114cb8abe33a5ed9bc4cb))
* add few pubsub events to help with big dataset ([360c62c](https://github.com/ghiscoding/slickgrid-universal/commit/360c62cb0979792dddef8fab39383266c0d855e3))
* **addon:** provide grid menu labels for all built-in commands ([44c72d3](https://github.com/ghiscoding/slickgrid-universal/commit/44c72d3ca0b8a88e6ae5022a25b11c4d41fd2897))
* **services:** add onBeforeResizeByContent (onAfter) ([3e99fab](https://github.com/ghiscoding/slickgrid-universal/commit/3e99fabb8554161e4301c0596eaebd9e0d246de7))
* **tree:** improve Tree Data speed considerably ([5487798](https://github.com/ghiscoding/slickgrid-universal/commit/548779801d06cc9ae7e319e72d351c8a868ed79f))

# [0.13.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.12.0...v0.13.0) (2021-04-27)

### Bug Fixes

* **editors:** Composite Editor modal compo should work w/complex objects ([#298](https://github.com/ghiscoding/slickgrid-universal/issues/298)) ([721a6c5](https://github.com/ghiscoding/slickgrid-universal/commit/721a6c5627369cfc89710705384995f8aba3a178))
* **footer:** add correct implemtation of locale usage in custom footer ([6e18bf9](https://github.com/ghiscoding/slickgrid-universal/commit/6e18bf9a8af070428bbb3cb429392df1eb19be54))
* **resize:** columns reposition not coming back after grid setOptions ([f2027e6](https://github.com/ghiscoding/slickgrid-universal/commit/f2027e60f418bb94f9d32c779d0474de4d87a5c9))

### Features

* **editors:** add `onBeforeOpen` optional callback to Composite Editor ([#306](https://github.com/ghiscoding/slickgrid-universal/issues/306)) ([a642482](https://github.com/ghiscoding/slickgrid-universal/commit/a642482254009115366ca4992e2e60647f8ae9b0))
* **editors:** add `target` to `onBeforeEditCell` w/called by composite ([#301](https://github.com/ghiscoding/slickgrid-universal/issues/301)) ([7440ff5](https://github.com/ghiscoding/slickgrid-universal/commit/7440ff58988acd7abd1ce249b1ceb72556cceb1d))
* **footer:** add row selection count to the footer component ([8ba146c](https://github.com/ghiscoding/slickgrid-universal/commit/8ba146cd4cbdccdb61f3441918065fad4561ff84))
* **resize:** add column resize by cell content ([#309](https://github.com/ghiscoding/slickgrid-universal/issues/309)) ([515a072](https://github.com/ghiscoding/slickgrid-universal/commit/515a072b3a16d3aca0f48e62c968ae89a1510669))

# [0.12.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.11.2...v0.12.0) (2021-03-24)

### Bug Fixes

* **firefox:** add all missing SVG color filter classes for Firefox/SF ([#296](https://github.com/ghiscoding/slickgrid-universal/issues/296)) ([a07ebdf](https://github.com/ghiscoding/slickgrid-universal/commit/a07ebdfbd2c2197c28102efe1f4a685ea61185e1))
* **pinning:** reordering cols position freezing cols shouldn't affect ([#275](https://github.com/ghiscoding/slickgrid-universal/issues/275)) ([a30665d](https://github.com/ghiscoding/slickgrid-universal/commit/a30665d54da583c47b1f533002173af99e9ab20d))
* **plugin:** Grid Menu Clear Frozen Cols shouldn't change cols positions ([#291](https://github.com/ghiscoding/slickgrid-universal/issues/291)) ([4fdab08](https://github.com/ghiscoding/slickgrid-universal/commit/4fdab08357d12349b6402e3007f4ab399d9a2140))
* **presets:** Filter & Sorting presets & Footer metrics issues ([#285](https://github.com/ghiscoding/slickgrid-universal/issues/285)) ([3174c86](https://github.com/ghiscoding/slickgrid-universal/commit/3174c86e011b4927510b99a348e8019adb4baa00))
* **resizer:** allow gridHeight/gridWidth to be passed as string ([#284](https://github.com/ghiscoding/slickgrid-universal/issues/284)) ([20bda50](https://github.com/ghiscoding/slickgrid-universal/commit/20bda50bf3ab647ae4ee3d7ffe0c9c8b58e8f187)), closes [#534](https://github.com/ghiscoding/slickgrid-universal/issues/534)

### Features

* **editors:** add `onSelect` callback to Autocomplete Editor ([#286](https://github.com/ghiscoding/slickgrid-universal/issues/286)) ([2d106d4](https://github.com/ghiscoding/slickgrid-universal/commit/2d106d4df0a259d36bee3d910320706ddb7e8580))
* **filters:** add optional `filterTypingDebounce` for keyboard filters ([#283](https://github.com/ghiscoding/slickgrid-universal/issues/283)) ([bb7dcd3](https://github.com/ghiscoding/slickgrid-universal/commit/bb7dcd3a9e28f45c7339e2f30685220b7a152507))
* **filters:** add possibility to filter by text range like "a..e" ([#279](https://github.com/ghiscoding/slickgrid-universal/issues/279)) ([e44145d](https://github.com/ghiscoding/slickgrid-universal/commit/e44145d897da570bf6ea15b156c7961ce96ce6f0))
* **resources:** add RxJS support into Slickgrid-Universal via external package ([#280](https://github.com/ghiscoding/slickgrid-universal/issues/280)) ([c10fc33](https://github.com/ghiscoding/slickgrid-universal/commit/c10fc339019c04ec0f7c4357ccdb3949a2358460))
* **state:** add Pinning (frozen) to Grid State & Presets ([#292](https://github.com/ghiscoding/slickgrid-universal/issues/292)) ([ba703d8](https://github.com/ghiscoding/slickgrid-universal/commit/ba703d8353a243ffed4d40804c0f977119424f6c))

## [0.11.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.11.1...v0.11.2) (2021-02-27)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.11.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.11.0...v0.11.1) (2021-02-27)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

# [0.11.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.10.2...v0.11.0) (2021-02-27)

### Bug Fixes

* **backend:** incorrect item count with GraphQL and useLocalFiltering ([3996cf4](https://github.com/ghiscoding/slickgrid-universal/commit/3996cf45b59c721b777e04dba3c10bbf03667bdb))
* **build:** enable tsconfig strict mode tsconfig ([#269](https://github.com/ghiscoding/slickgrid-universal/issues/269)) ([095fc71](https://github.com/ghiscoding/slickgrid-universal/commit/095fc71052c1f4e776544781da5fe762cfa16238))
* **filters:** use defaultFilterOperator in range when none provided ([#271](https://github.com/ghiscoding/slickgrid-universal/issues/271)) ([993675f](https://github.com/ghiscoding/slickgrid-universal/commit/993675f6b0d76e76010d5cadc6696134a73dad66))

### Features

* **editors:** add a Clear (X) button to the Autocomplete Editor ([#270](https://github.com/ghiscoding/slickgrid-universal/issues/270)) ([ffbd188](https://github.com/ghiscoding/slickgrid-universal/commit/ffbd188534992c31848691154517deb64694f3b2))
* **perf:** huge filtering speed improvements ([a101ed1](https://github.com/ghiscoding/slickgrid-universal/commit/a101ed1b62c2fbfec2712f64e08192a4852bce9d))
* **services:** add bulk transactions in Grid Service CRUD methods ([#256](https://github.com/ghiscoding/slickgrid-universal/issues/256)) ([03385d9](https://github.com/ghiscoding/slickgrid-universal/commit/03385d9ac58cb3ce7501a409394706c0cb4f4d29))

## [0.10.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.10.1...v0.10.2) (2021-01-28)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.10.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.10.0...v0.10.1) (2021-01-28)

### Bug Fixes

* **build:** decrease tsc target to es2017 instead of es2020 ([2f2e5f4](https://github.com/ghiscoding/slickgrid-universal/commit/2f2e5f46a3b25897f1a4a59daa1346b5d577ddb8))

# [0.10.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.9.0...v0.10.0) (2021-01-28)

### Bug Fixes

* **component:** Composite Editor sometime shows empty mass update form ([#244](https://github.com/ghiscoding/slickgrid-universal/issues/244)) ([d3ad4db](https://github.com/ghiscoding/slickgrid-universal/commit/d3ad4db45d259fa8ab977cd45c830a7d3bd342d8))
* **core:** fix types index.d.ts url ([a76b3a3](https://github.com/ghiscoding/slickgrid-universal/commit/a76b3a3d97a6d211ec2e7e8d9060fd8dd0719f58))
* **editors:** add blank disabled fields in Composite Editor form values ([#233](https://github.com/ghiscoding/slickgrid-universal/issues/233)) ([b634902](https://github.com/ghiscoding/slickgrid-universal/commit/b6349029b705991b7ac2d1df99f5b330fe69ef36))
* **editors:** fix clear date & blank disabled field w/Composite Editor ([#235](https://github.com/ghiscoding/slickgrid-universal/issues/235)) ([9aac97d](https://github.com/ghiscoding/slickgrid-universal/commit/9aac97d2d433c809facc8d7092467780d55ca01a))
* **frozen:** hiding multiple columns when using pinning gets out of sync ([#243](https://github.com/ghiscoding/slickgrid-universal/issues/243)) ([b255220](https://github.com/ghiscoding/slickgrid-universal/commit/b255220ec37dbdc9df4f3ecccb4397656cf9f2a6))
* **lint:** add eslint as a pre task when bundling & fix linting errors ([#246](https://github.com/ghiscoding/slickgrid-universal/issues/246)) ([6f7ccd8](https://github.com/ghiscoding/slickgrid-universal/commit/6f7ccd8ee4cc5e005034965a2c2dcc0499f06a73))
* **plugins:** throw error when Tree Data used with Pagination ([#229](https://github.com/ghiscoding/slickgrid-universal/issues/229)) ([85718e1](https://github.com/ghiscoding/slickgrid-universal/commit/85718e18cd181734df3ba1a2440ead4368741c53))

### Features

* **editors:** add Clone functionality to Composite Editor ([#236](https://github.com/ghiscoding/slickgrid-universal/issues/236)) ([df545e4](https://github.com/ghiscoding/slickgrid-universal/commit/df545e4ec64271307b1979feb5e786f449433639))
* **filters:** change all private keyword to protected for extensability ([#245](https://github.com/ghiscoding/slickgrid-universal/issues/245)) ([52cc702](https://github.com/ghiscoding/slickgrid-universal/commit/52cc7022c4b847566d89e91a80c423373538a15a))
* **formatters:** add grid option to auto add custom editor formatter ([#248](https://github.com/ghiscoding/slickgrid-universal/issues/248)) ([db77d46](https://github.com/ghiscoding/slickgrid-universal/commit/db77d464ee37eda573351e89d4c5acc9b5648649))
* add nameCompositeEditor override to be used by Composite Editor ([fcdb2e9](https://github.com/ghiscoding/slickgrid-universal/commit/fcdb2e92ed736b09e947cdbcf39ee157afc4acab))

# [0.9.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.8.0...v0.9.0) (2021-01-06)

### Bug Fixes

* **build:** import Flatpickr Locale on demand via regular imports ([#227](https://github.com/ghiscoding/slickgrid-universal/issues/227)) ([6644822](https://github.com/ghiscoding/slickgrid-universal/commit/664482210557fc1a7a178856e2641f71b9580c44))

### Features

* **build:** upgrade to WebPack 5 ([#225](https://github.com/ghiscoding/slickgrid-universal/issues/225)) ([c6b3ad3](https://github.com/ghiscoding/slickgrid-universal/commit/c6b3ad3eb6fb64306bfd8bd300fcc1e86b27e5a6))
* **ci:** replace CircleCI with GitHub Actions ([#211](https://github.com/ghiscoding/slickgrid-universal/issues/211)) ([4f91140](https://github.com/ghiscoding/slickgrid-universal/commit/4f9114031ca6236ef45f04b67dcba1a9981035c4))

# [0.8.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.7...v0.8.0) (2020-12-22)

### Bug Fixes

* **core:** change moment/lodash imports so it works with ES6 module ([#210](https://github.com/ghiscoding/slickgrid-universal/issues/210)) ([2d25d3b](https://github.com/ghiscoding/slickgrid-universal/commit/2d25d3b99f7be93f2bc69f006fb67a39cf39ce7c))
* **core:** use regular imports instead of require to load plugins ([#209](https://github.com/ghiscoding/slickgrid-universal/issues/209)) ([6816696](https://github.com/ghiscoding/slickgrid-universal/commit/6816696c98be0d2dd80c1ff49358bd49ee7caacb))

## [0.7.7](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.6...v0.7.7) (2020-12-20)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.7.6](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.5...v0.7.6) (2020-12-20)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.7.5](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.4...v0.7.5) (2020-12-20)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.7.4](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.3...v0.7.4) (2020-12-20)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.7.3](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.2...v0.7.3) (2020-12-20)

### Bug Fixes

* **components:** don't instantiate composite editor twice ([#207](https://github.com/ghiscoding/slickgrid-universal/issues/207)) ([8548393](https://github.com/ghiscoding/slickgrid-universal/commit/854839358bf276432169447bebefe736de02f57d))

## [0.7.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.1...v0.7.2) (2020-12-17)

### Bug Fixes

* **sorting:** add cellValueCouldBeUndefined in grid option for sorting ([#202](https://github.com/ghiscoding/slickgrid-universal/issues/202)) ([865256e](https://github.com/ghiscoding/slickgrid-universal/commit/865256efe927a5715840963cb2945f16a402789b))
* **stylings:** small alignment issue with the slider value elm height ([5a453b8](https://github.com/ghiscoding/slickgrid-universal/commit/5a453b8739c07e07f835e111d7d3ca5d627a0c2f))

## [0.7.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.0...v0.7.1) (2020-12-17)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

# [0.7.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.6.0...v0.7.0) (2020-12-16)

### Bug Fixes

* **components:** refactor to use registerExternalResources grid option ([#199](https://github.com/ghiscoding/slickgrid-universal/issues/199)) ([7ca42f4](https://github.com/ghiscoding/slickgrid-universal/commit/7ca42f4242bfddd4dd746d7f3f37dbe1e3f7368b))

### Features

* **core:** methods to change column positions/visibilities dynamically ([#200](https://github.com/ghiscoding/slickgrid-universal/issues/200)) ([5048a4b](https://github.com/ghiscoding/slickgrid-universal/commit/5048a4b969f337f002dad552197d02f970590c73))

# [0.6.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.5.1...v0.6.0) (2020-12-14)

### Bug Fixes

* **core:** add console error if any of column def id includes dot ([#198](https://github.com/ghiscoding/slickgrid-universal/issues/198)) ([6ee40af](https://github.com/ghiscoding/slickgrid-universal/commit/6ee40af507b066602c39e057349b5ead6e7952f3))
* **stylings:** re-align the svg icons & single/multiple-select icon+text ([#194](https://github.com/ghiscoding/slickgrid-universal/issues/194)) ([b730be7](https://github.com/ghiscoding/slickgrid-universal/commit/b730be7a75b3035c01aa7ca8f48a88df447ad461))

### Features

* **core:** add registerExternalResources for Components/Services ([#196](https://github.com/ghiscoding/slickgrid-universal/issues/196)) ([ee02f1d](https://github.com/ghiscoding/slickgrid-universal/commit/ee02f1d62d1a0601421352e43d17bd8c89e4348c))
* **core:** refactor code using the container service everywhere ([#197](https://github.com/ghiscoding/slickgrid-universal/issues/197)) ([96ce9bd](https://github.com/ghiscoding/slickgrid-universal/commit/96ce9bdbf18330e522dad0cbb0eda09c41f6a3df))

## [0.5.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.5.0...v0.5.1) (2020-12-10)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

# [0.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.4.2...v0.5.0) (2020-12-10)

### Bug Fixes

* **editors:** Select Editor option to return flat data w/complex object ([#189](https://github.com/ghiscoding/slickgrid-universal/issues/189)) ([4695cd3](https://github.com/ghiscoding/slickgrid-universal/commit/4695cd3b6871dc1ceca4036fd30935eca8011b7e))
* **exports:** when cell value is empty object return empty string ([#190](https://github.com/ghiscoding/slickgrid-universal/issues/190)) ([cd34901](https://github.com/ghiscoding/slickgrid-universal/commit/cd349012c82a8bdff113fb9f8ef23ea18c6e3035))

### Features

* **components:** extract CompositeEditor & EmptyWarning Components ([#191](https://github.com/ghiscoding/slickgrid-universal/issues/191)) ([00cf9a2](https://github.com/ghiscoding/slickgrid-universal/commit/00cf9a22e1924a46ed637d52bba8efc02ef7eea1))

## [0.4.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.4.1...v0.4.2) (2020-12-07)

### Bug Fixes

* **exports:** deprecated exportOptions should still be working ([19145b2](https://github.com/ghiscoding/slickgrid-universal/commit/19145b26274859b7ba24cf1196262deb74fdb389))

## [0.4.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.4.0...v0.4.1) (2020-12-07)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

# [0.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.3.0...v0.4.0) (2020-12-07)

### Features

* **editors:** add few editor options to LongText (textarea) Editor ([a975882](https://github.com/ghiscoding/slickgrid-universal/commit/a975882ce0772728a7bcd2bc75131d650b093144))

# [0.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.2.15...v0.3.0) (2020-12-02)

### Bug Fixes

* **core:** properly export Enums, Interfaces, Services & Utilities ([#184](https://github.com/ghiscoding/slickgrid-universal/issues/184)) ([0c23398](https://github.com/ghiscoding/slickgrid-universal/commit/0c233984a6e9d718659c119b65a95d6c38d36b0c))
* **core:** showing/hiding column shouldn't affect its freezing position ([#185](https://github.com/ghiscoding/slickgrid-universal/issues/185)) ([2a812ed](https://github.com/ghiscoding/slickgrid-universal/commit/2a812edb82c8004ab43df224c67ede228ab72c00))

### Features

* **core:** add enableMouseWheelScrollHandler grid option ([#170](https://github.com/ghiscoding/slickgrid-universal/issues/170)) ([53598d9](https://github.com/ghiscoding/slickgrid-universal/commit/53598d9bf36d26c41e7587dd74678687ba47fb3d))

## [0.2.15](https://github.com/ghiscoding/slickgrid-universal/compare/v0.2.0...v0.2.15) (2020-11-30)

### Bug Fixes

* **core:** don't expose src folder on npm & update few npm package ([#168](https://github.com/ghiscoding/slickgrid-universal/issues/168)) ([3c05938](https://github.com/ghiscoding/slickgrid-universal/commit/3c059381b35bba88ea98d0206692c912c625f227))
* **core:** rename i18n to translater & fix few other issues ([#174](https://github.com/ghiscoding/slickgrid-universal/issues/174)) ([34c963a](https://github.com/ghiscoding/slickgrid-universal/commit/34c963a2bcef1b841d3c62ea405a4bc49be98a5c))
* **formatters:** date formatters should accept ISO input & output to US ([#172](https://github.com/ghiscoding/slickgrid-universal/issues/172)) ([85ce7cf](https://github.com/ghiscoding/slickgrid-universal/commit/85ce7cf3636d5bb43d3ef18ec6998bb0c423d218))

## [0.2.14](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/vanilla-bundle@0.2.13...@slickgrid-universal/vanilla-bundle@0.2.14) (2020-11-26)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.2.13](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/vanilla-bundle@0.2.12...@slickgrid-universal/vanilla-bundle@0.2.13) (2020-11-26)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.2.12](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/vanilla-bundle@0.2.11...@slickgrid-universal/vanilla-bundle@0.2.12) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.2.11](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/vanilla-bundle@0.2.10...@slickgrid-universal/vanilla-bundle@0.2.11) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.2.10](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/vanilla-bundle@0.2.9...@slickgrid-universal/vanilla-bundle@0.2.10) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.2.9](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/vanilla-bundle@0.2.8...@slickgrid-universal/vanilla-bundle@0.2.9) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.2.8](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/vanilla-bundle@0.2.7...@slickgrid-universal/vanilla-bundle@0.2.8) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.2.7](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/vanilla-bundle@0.2.6...@slickgrid-universal/vanilla-bundle@0.2.7) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.2.6](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/vanilla-bundle@0.2.5...@slickgrid-universal/vanilla-bundle@0.2.6) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.2.5](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/vanilla-bundle@0.2.3...@slickgrid-universal/vanilla-bundle@0.2.5) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.2.4](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/vanilla-bundle@0.2.3...@slickgrid-universal/vanilla-bundle@0.2.4) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.2.3](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/vanilla-bundle@0.2.2...@slickgrid-universal/vanilla-bundle@0.2.3) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.2.2](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/vanilla-bundle@0.2.1...@slickgrid-universal/vanilla-bundle@0.2.2) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/vanilla-bundle

## [0.2.1](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/vanilla-bundle@0.2.0...@slickgrid-universal/vanilla-bundle@0.2.1) (2020-11-25)

### Bug Fixes

* **core:** don't expose src folder on npm & update few npm package ([#168](https://github.com/ghiscoding/slickgrid-universal/issues/168)) ([3c05938](https://github.com/ghiscoding/slickgrid-universal/commit/3c059381b35bba88ea98d0206692c912c625f227))

# [0.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/vanilla-bundle@0.1.0...@slickgrid-universal/vanilla-bundle@0.2.0) (2020-11-20)

### Bug Fixes

* **backend:** OData/GraphQL pagination should display warning on empty ([#159](https://github.com/ghiscoding/slickgrid-universal/issues/159)) ([1c6ada2](https://github.com/ghiscoding/slickgrid-universal/commit/1c6ada2ed06166a99ddbfdea7b42ecdef1501ded))
* **core:** clear dataset when disposing and fix few unsubscribed events to avoid leak ([#156](https://github.com/ghiscoding/slickgrid-universal/issues/156)) ([78c80b4](https://github.com/ghiscoding/slickgrid-universal/commit/78c80b43ca04fd4fff68791556f9d4ab37f06caa))
* **core:** empty warning message should work with multiple grids ([#158](https://github.com/ghiscoding/slickgrid-universal/issues/158)) ([9e7c023](https://github.com/ghiscoding/slickgrid-universal/commit/9e7c023f7d33313400f4e55ddffd838d290b83dd))
* **core:** fix some problems found with AutoComplete ([#74](https://github.com/ghiscoding/slickgrid-universal/issues/74)) ([00fb478](https://github.com/ghiscoding/slickgrid-universal/commit/00fb478263db832ec31d940ed19417d9fcbae04a))
* **core:** header columns grouping misbehave after hiding column ([#164](https://github.com/ghiscoding/slickgrid-universal/issues/164)) ([6b8232b](https://github.com/ghiscoding/slickgrid-universal/commit/6b8232b3b98d1b75412bebd6b4528ee5dea71d7a))
* **core:** mem leaks w/orphan DOM elements when disposing ([#153](https://github.com/ghiscoding/slickgrid-universal/issues/153)) ([faba5a6](https://github.com/ghiscoding/slickgrid-universal/commit/faba5a6652fa2cf5e78f64b6b2e27bf9b85936ba))
* **core:** properly remove event listeners when disposing ([#163](https://github.com/ghiscoding/slickgrid-universal/issues/163)) ([ecfb9a7](https://github.com/ghiscoding/slickgrid-universal/commit/ecfb9a7c623010504a7a2d312ffef185f16cec9e))
* **editor:** SingleSelect Editor should show pick false value ([#75](https://github.com/ghiscoding/slickgrid-universal/issues/75)) ([fdb2c84](https://github.com/ghiscoding/slickgrid-universal/commit/fdb2c8433d443dd8f4fdd86f714354424cfb9ea3))
* **filters:** disregard time when filtering date only format ([#134](https://github.com/ghiscoding/slickgrid-universal/issues/134)) ([7bd2d19](https://github.com/ghiscoding/slickgrid-universal/commit/7bd2d1964de2e809d8b08c737231eec31d146fae))
* **filters:** tree data presets caused regression in any grid w/presets ([#137](https://github.com/ghiscoding/slickgrid-universal/issues/137)) ([bacac83](https://github.com/ghiscoding/slickgrid-universal/commit/bacac8309159a6ed4b9b8750a4f8751476881b45))
* **styling:** SVG icon colors aren't showing up in SF with Firefox ([#131](https://github.com/ghiscoding/slickgrid-universal/issues/131)) ([2ed3cf5](https://github.com/ghiscoding/slickgrid-universal/commit/2ed3cf50358139374d4deeaedb5a8fdb7db27b98))
* **translations:** HeaderMenu & Date Filters not translating ([#58](https://github.com/ghiscoding/slickgrid-universal/issues/58)) ([9416c4d](https://github.com/ghiscoding/slickgrid-universal/commit/9416c4d2642894c5660473419623cee9bebcac4b))

### Features

* **autocomplete:** add much more functionalities to the AutoComplete ([#69](https://github.com/ghiscoding/slickgrid-universal/issues/69)) ([93c3d0a](https://github.com/ghiscoding/slickgrid-universal/commit/93c3d0a9b8d5a30c7a933f95a4333937c95305a3))
* **core:** add "Empty Data" warning message when grid is empty ([#155](https://github.com/ghiscoding/slickgrid-universal/issues/155)) ([13875b4](https://github.com/ghiscoding/slickgrid-universal/commit/13875b455d60f44918d8524aa803374773276e90))
* **core:** add custom entry to Select Editor/Filter collections ([#133](https://github.com/ghiscoding/slickgrid-universal/issues/133)) ([66effcf](https://github.com/ghiscoding/slickgrid-universal/commit/66effcfddd8b5a9d78a1d1ab679ca2721067e4be))
* **core:** add ESLint npm script and add to prebuild script ([#151](https://github.com/ghiscoding/slickgrid-universal/issues/151)) ([4064876](https://github.com/ghiscoding/slickgrid-universal/commit/40648760a33628f0ba85653f5fc99d8250b9a7a2))
* **core:** add loading spinner to AutoComplete Editor/Filter ([#65](https://github.com/ghiscoding/slickgrid-universal/issues/65)) ([4ecd2bd](https://github.com/ghiscoding/slickgrid-universal/commit/4ecd2bd305f2fd2b509e48cf1c7166b666228be3))
* **core:** rewrite "Empty Data" warning component to be in the canvas ([#157](https://github.com/ghiscoding/slickgrid-universal/issues/157)) ([78e2132](https://github.com/ghiscoding/slickgrid-universal/commit/78e213222d6058e1d1d768094801be42dbf4fb05))
* **core:** update few npm packages ([#123](https://github.com/ghiscoding/slickgrid-universal/issues/123)) ([1c25b87](https://github.com/ghiscoding/slickgrid-universal/commit/1c25b87fdd738616879298baeb52074e30e9bf14))
* **core:** update lib to latest jQuery version 3.5.1 ([#56](https://github.com/ghiscoding/slickgrid-universal/issues/56)) ([1af66d5](https://github.com/ghiscoding/slickgrid-universal/commit/1af66d5142bb5bc17cc84c819f9f273874af285c)), closes [#42](https://github.com/ghiscoding/slickgrid-universal/issues/42)
* **core:** update to latest SlickGrid version and update npm packages ([#140](https://github.com/ghiscoding/slickgrid-universal/issues/140)) ([d73a44e](https://github.com/ghiscoding/slickgrid-universal/commit/d73a44e338025da45e990a8a522fb0b9aa1c5279))
* **core:** use barel export everywhere ([#57](https://github.com/ghiscoding/slickgrid-universal/issues/57)) ([d068fc5](https://github.com/ghiscoding/slickgrid-universal/commit/d068fc577566a44217f543f7486be0cc4edc5f69))
* **editor:** add Composite Editor modal dialog ([#76](https://github.com/ghiscoding/slickgrid-universal/issues/76)) ([bba0b80](https://github.com/ghiscoding/slickgrid-universal/commit/bba0b804301195a166f87be610ee85fe77d4a134))
* **editors:** add changeEditorOption to all Editors which supports it ([#142](https://github.com/ghiscoding/slickgrid-universal/issues/142)) ([97b1003](https://github.com/ghiscoding/slickgrid-universal/commit/97b1003f80a72859ae9fc4b4a0ade12e8ec373a5))
* **editors:** add way to change or disable Composite Editor form input ([#139](https://github.com/ghiscoding/slickgrid-universal/issues/139)) ([2a5280f](https://github.com/ghiscoding/slickgrid-universal/commit/2a5280f216b2929c018f4019169db039361f2985))
* **editors:** disable editor when collectionAsync, re-enable after ([#132](https://github.com/ghiscoding/slickgrid-universal/issues/132)) ([75b10de](https://github.com/ghiscoding/slickgrid-universal/commit/75b10de91adecfaab6627e677abe7f5ce91d8769))
* **examples:** add mass update feat to Example 11 ([#31](https://github.com/ghiscoding/slickgrid-universal/issues/31)) ([84e9817](https://github.com/ghiscoding/slickgrid-universal/commit/84e98175686160dfc243435496ac65a757ec30aa))
* **filters:** add Pre-Defined & Custom Filters saved in Local Storage ([#143](https://github.com/ghiscoding/slickgrid-universal/issues/143)) ([dea71ab](https://github.com/ghiscoding/slickgrid-universal/commit/dea71ababb4b06520b06f7e12f4acbd86051110a))
* **icons:** add more Material icons ([9f9377b](https://github.com/ghiscoding/slickgrid-universal/commit/9f9377b2768c0ad6c091731be36125ea73e2ad46))
* **icons:** add some more material icons ([#124](https://github.com/ghiscoding/slickgrid-universal/issues/124)) ([b90fe2d](https://github.com/ghiscoding/slickgrid-universal/commit/b90fe2d231c1005ad137a7f0fbae8f6fb928cb79))
* **plugins:** add "hidden" to all controls/plugins with menu items ([#128](https://github.com/ghiscoding/slickgrid-universal/issues/128)) ([99202de](https://github.com/ghiscoding/slickgrid-universal/commit/99202deb7b452b7ac8d67d4b98545901cf99005e))
* **services:** add 2x new methods hideColumnById or ..byIds ([#160](https://github.com/ghiscoding/slickgrid-universal/issues/160)) ([d396653](https://github.com/ghiscoding/slickgrid-universal/commit/d3966530fab48ee72fab138b8caf97c4eb73ec91))
* **services:** add Toggle Filtering/Sorting & Hide Column methods ([#126](https://github.com/ghiscoding/slickgrid-universal/issues/126)) ([08fe2e1](https://github.com/ghiscoding/slickgrid-universal/commit/08fe2e19c5778941050e42ca207d55dc27564ba8))
* **styling:** add frozen on all possible elements with SASS variables ([#138](https://github.com/ghiscoding/slickgrid-universal/issues/138)) ([c61da91](https://github.com/ghiscoding/slickgrid-universal/commit/c61da911c449949570f54343724bc80523f77bcb)), closes [#537](https://github.com/ghiscoding/slickgrid-universal/issues/537)
* **tests:** add more unit tests to vanilla bundle ([#51](https://github.com/ghiscoding/slickgrid-universal/issues/51)) ([10e5c5a](https://github.com/ghiscoding/slickgrid-universal/commit/10e5c5aa647c0af3e1c5804006acd216ca7d447b))

# [0.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/vanilla-bundle@0.0.2...@slickgrid-universal/vanilla-bundle@0.1.0) (2020-07-28)

### Bug Fixes

* **build:** vscode chrome debugger + webpack prod build should both work ([e148090](https://github.com/ghiscoding/slickgrid-universal/commit/e148090b967119c911c5da2fc7cb2cfdf4c3de39))
* **components:** add "cssText" option to both Footer/Pagination ([abd4fcd](https://github.com/ghiscoding/slickgrid-universal/commit/abd4fcd6ea6c990e1192afaca450dd6b7847e590))
* **components:** both Footer/Pagination should always be 100% width ([#27](https://github.com/ghiscoding/slickgrid-universal/issues/27)) ([e587ef5](https://github.com/ghiscoding/slickgrid-universal/commit/e587ef5084d469c6342c84c5c2f6a0dc65ae4493))
* **components:** fix Footer/Pagination incorrect width, w/right padding ([f8054c9](https://github.com/ghiscoding/slickgrid-universal/commit/f8054c9ce9249ce291a401b53f1c9914735b6864))
* **context:** change copy cell command to make it work in SF ([#8](https://github.com/ghiscoding/slickgrid-universal/issues/8)) ([c0b8ad9](https://github.com/ghiscoding/slickgrid-universal/commit/c0b8ad943dbd6baf08f41c36d6d266382b758206))
* **core:** add missing use of custom datasetIdPropertyName ([917f044](https://github.com/ghiscoding/slickgrid-universal/commit/917f044b1489b19917b15bd146a2d40f8924ea23))
* **debug:** chrome debugger with webpack & TS breakpoints ([6c3ab52](https://github.com/ghiscoding/slickgrid-universal/commit/6c3ab521be42265edd33d30002f342493f12c54b))
* **editor:** disregard Flatpickr error on Date Editor ([e7d7ba5](https://github.com/ghiscoding/slickgrid-universal/commit/e7d7ba57c6a68309aafb0c2082b4e642194067f3))
* **editor:** float validator should accept decimal even without 0 suffix ([87808ce](https://github.com/ghiscoding/slickgrid-universal/commit/87808ce1f0c10e4dd070518b78e35e986580de30))
* **editor:** shouldn't call cell changed when cell value is undefined ([d5796a1](https://github.com/ghiscoding/slickgrid-universal/commit/d5796a1c3d45d5592c56dc9001231b2943f56cc0))
* **editors:** add saveOutputType to finally have proper save format ([#17](https://github.com/ghiscoding/slickgrid-universal/issues/17)) ([ebfd715](https://github.com/ghiscoding/slickgrid-universal/commit/ebfd71582642abe136317dbef8cedee68d472aa7))
* **editors:** Editors should work with undefined item properties ([#25](https://github.com/ghiscoding/slickgrid-universal/issues/25)) ([9bc6f5a](https://github.com/ghiscoding/slickgrid-universal/commit/9bc6f5ad617d7144d8787d4afcfe3b888966dcb7))
* **editors:** invalid date should trigger onvalidationerror ([#19](https://github.com/ghiscoding/slickgrid-universal/issues/19)) ([041087e](https://github.com/ghiscoding/slickgrid-universal/commit/041087ea928b9c53ef118a198b6837a028933b7a))
* **filter:** recreate filter when toggling header row ([e839464](https://github.com/ghiscoding/slickgrid-universal/commit/e839464fa5dbb1db274ebda69daf3f71808f0c93))
* **formatter:** add possibility to parse a date formatter as a UTC date ([e72bcad](https://github.com/ghiscoding/slickgrid-universal/commit/e72bcadae652bb00cb8b51f92ff2b2cf67de37a4))
* **header:** re-create header grouping title after changing picker cols ([872c780](https://github.com/ghiscoding/slickgrid-universal/commit/872c7808d27cae30c414d1e3769728aa083910e7))
* **menu:** context menu to copy cell with queryFieldNameGetterFn ([#21](https://github.com/ghiscoding/slickgrid-universal/issues/21)) ([53c50f9](https://github.com/ghiscoding/slickgrid-universal/commit/53c50f9d716725330681d3617082b1fa33f90c12))
* **pagination:** get pagination working in SF as well ([#24](https://github.com/ghiscoding/slickgrid-universal/issues/24)) ([1132f2e](https://github.com/ghiscoding/slickgrid-universal/commit/1132f2edec251e2f65cce860ebfa57dbe35cf852))
* **resize:** add a patch to fix autoresize on Chrome ([02faae4](https://github.com/ghiscoding/slickgrid-universal/commit/02faae44118dd5adbda57a5363567a84c84e7cb2))
* **resize:** patch for SF when user open different Tab too quickly ([ddb08b1](https://github.com/ghiscoding/slickgrid-universal/commit/ddb08b134f6cbacdc65fe0d0c276fb68acd708a5))
* **sanitizer:** add optional grid option sanitizer anywhere possible ([#9](https://github.com/ghiscoding/slickgrid-universal/issues/9)) ([a6c7997](https://github.com/ghiscoding/slickgrid-universal/commit/a6c7997d75d27cc14892de4460dea28b529b392e))

### Features

* **backend:** add OData & GraphQL packages ([#2](https://github.com/ghiscoding/slickgrid-universal/issues/2)) ([53cf08b](https://github.com/ghiscoding/slickgrid-universal/commit/53cf08bff2eea18e677770f70eedef1bda9aefcc))
* **browser:** add browserslist for packages who uses it ([fc69908](https://github.com/ghiscoding/slickgrid-universal/commit/fc69908a4eccfaedeb1835eb9d00719e7926065f))
* **build:** add correct TS types to all packages ([5ab0833](https://github.com/ghiscoding/slickgrid-universal/commit/5ab0833e07b89504ac603c3d356d2a6bdb0dfee2))
* **build:** add the grid bundle zip file to npm for salesforce ([4f684de](https://github.com/ghiscoding/slickgrid-universal/commit/4f684de440b798c7eac9b4387f43fbeffa8ed957))
* **build:** tweak build to use tsc and test with sf lwc ([e4964b3](https://github.com/ghiscoding/slickgrid-universal/commit/e4964b34513e828d5cc9f2b278d794d892895277))
* **colspan:** add Header Grouping & Column Span example ([b9a155d](https://github.com/ghiscoding/slickgrid-universal/commit/b9a155dcf58c9a7c984ea1b6426883af0ae2f9ca))
* **core:** add `collectionAsync` option for both the Editors & Filters ([#16](https://github.com/ghiscoding/slickgrid-universal/issues/16)) ([f9488ab](https://github.com/ghiscoding/slickgrid-universal/commit/f9488ab350421be771f356b1775559a8e0d8e0c0))
* **core:** add Translation into demo with fetch locale from json file ([#23](https://github.com/ghiscoding/slickgrid-universal/issues/23)) ([b5608e9](https://github.com/ghiscoding/slickgrid-universal/commit/b5608e958f659b839a8460ffee4a555c66774893))
* **core:** dynamically add/remove columns ([#13](https://github.com/ghiscoding/slickgrid-universal/issues/13)) ([959097c](https://github.com/ghiscoding/slickgrid-universal/commit/959097cf8363330c7166d0844048cfde57a5cabc))
* **core:** expose all Extensions in new getter prop & fix draggable ([#29](https://github.com/ghiscoding/slickgrid-universal/issues/29)) ([07257b2](https://github.com/ghiscoding/slickgrid-universal/commit/07257b2564d86cbfad4f69bb4e910e04d7df5688))
* **core:** expose all services, slickgrid, dataview instances ([a33e387](https://github.com/ghiscoding/slickgrid-universal/commit/a33e3876b1134f6839aac10a67193448997ae7c5))
* **core:** use DataView transactions with multiple item changes ([#14](https://github.com/ghiscoding/slickgrid-universal/issues/14)) ([8cbd03a](https://github.com/ghiscoding/slickgrid-universal/commit/8cbd03a678bc6a2a89495685cc781b12946ec404))
* **editors:** add more Editors and update all npm packages ([14b10a1](https://github.com/ghiscoding/slickgrid-universal/commit/14b10a17642b2c7f889f90b58dd3fef084e983b9))
* **examples:** add more Tree View with checkbox selector code ([7d7c644](https://github.com/ghiscoding/slickgrid-universal/commit/7d7c644b0ecc8c3b61dd706d37d31edd0cf92fca))
* **examples:** add new sample to showcase queued editing ([#28](https://github.com/ghiscoding/slickgrid-universal/issues/28)) ([3b8fec6](https://github.com/ghiscoding/slickgrid-universal/commit/3b8fec6e890fc0b8dc9754495c1022d898740b3e))
* **extension:** add latest slickgrid with RowMove improvements ([c10fffd](https://github.com/ghiscoding/slickgrid-universal/commit/c10fffdb2bd8a8ce0221e570cf0bfb4cf03c7c29))
* **filter:** add Filter Service, Filter Conditions and few unit tests ([2baed7f](https://github.com/ghiscoding/slickgrid-universal/commit/2baed7fa0c31d73437b3d08d2d48c91b05602ff9))
* **filters:** add missing Date Filters ([76c66a3](https://github.com/ghiscoding/slickgrid-universal/commit/76c66a3ec2da4b1ff1b296851f46bf58967adc18))
* **footer:** add Custom Footer ([0d3e1da](https://github.com/ghiscoding/slickgrid-universal/commit/0d3e1dabf29c4bc354df598a3b166030f61769fc))
* **footer:** add Custom Footer component ([#5](https://github.com/ghiscoding/slickgrid-universal/issues/5)) ([59d0ba8](https://github.com/ghiscoding/slickgrid-universal/commit/59d0ba8921c2e0886b0c34705ac5a74f35ab4e43))
* **grouping:** add more Grouping & Aggregators code ([8c20808](https://github.com/ghiscoding/slickgrid-universal/commit/8c20808d9a8b0a6166f4fb8fe013d33ae57a223c))
* **libs:** add jQuery libs into folder for SF usage ([9e040a1](https://github.com/ghiscoding/slickgrid-universal/commit/9e040a1ffe65f9fce6bbe70f57a3c6b4c597bc82))
* **package:** add new Excel Export package ([808785e](https://github.com/ghiscoding/slickgrid-universal/commit/808785e0ea9508f817453211d8ed808398aa9c01))
* **package:** add new Export (csv, txt) package ([d6adc5c](https://github.com/ghiscoding/slickgrid-universal/commit/d6adc5ce7aa466fde3c1e1377bd47c9a6cd8b53b))
* **pinning:** add "Freezen Columns" to header menu ([#4](https://github.com/ghiscoding/slickgrid-universal/issues/4)) ([1c7d49f](https://github.com/ghiscoding/slickgrid-universal/commit/1c7d49f838a8cadb093dfbdf81c215ed250fbe14))
* **presets:** add missing row selections preset option ([#11](https://github.com/ghiscoding/slickgrid-universal/issues/11)) ([e0a729c](https://github.com/ghiscoding/slickgrid-universal/commit/e0a729cfbbe7aa75a18301b4db994ac9d3330f10))
* **query:** add queryFieldNameGetterFn callback know which field to use ([6d8955c](https://github.com/ghiscoding/slickgrid-universal/commit/6d8955c1933a88683c2284d9162e43248bc578a2))
* **service:** add GridEvent Service to the lib ([4a4bf6f](https://github.com/ghiscoding/slickgrid-universal/commit/4a4bf6f86ebdb6cbf911d838714440cceee4e07f))
* **services:** add Pagination & Grid State Services ([c15e6e6](https://github.com/ghiscoding/slickgrid-universal/commit/c15e6e63edce6f07751f3380229e9e1777c43d84))
* **services:** add registerServices in Grid Options ([#1](https://github.com/ghiscoding/slickgrid-universal/issues/1)) ([e7c2e91](https://github.com/ghiscoding/slickgrid-universal/commit/e7c2e91842eac2044ccdd82673bfade20b24ab4f))
* **sorting:** header menu clear sort, reset sorting when nothing left ([032886b](https://github.com/ghiscoding/slickgrid-universal/commit/032886bf6da9e3d711a17d23481c47ccf81af353))
* **styling:** add edit icon when hovering editable cell with SF Theme ([eef4403](https://github.com/ghiscoding/slickgrid-universal/commit/eef4403b8e9168ff119eb97ca5c663101104abae))
* **styling:** material theme, replace all built-in Font char to SVG ([ed25d6a](https://github.com/ghiscoding/slickgrid-universal/commit/ed25d6ae4848b614c84da111ff894eedb5be6400))
* **styling:** salesforce theme, replace all built-in Font char to SVG ([1c5f341](https://github.com/ghiscoding/slickgrid-universal/commit/1c5f3414d8bafea7cb393033c9753aef4ad66b2f))
* **tests:** add export abstract classes and add few more unit tests ([13a1bca](https://github.com/ghiscoding/slickgrid-universal/commit/13a1bcac7c21666f2b006f3488036175b29b1b3d))
* **tests:** add more Jest unit tests & commands ([d4da547](https://github.com/ghiscoding/slickgrid-universal/commit/d4da547aaae797767140d73289d7f50874fdd09e))
* **tests:** rename to slick-vanilla-grid-bundle and add unit tests ([#12](https://github.com/ghiscoding/slickgrid-universal/issues/12)) ([006c302](https://github.com/ghiscoding/slickgrid-universal/commit/006c30251ea1d473e5d1ae54d20c050fccf0e6a4))
* **translate:** add namespace prefix + separator grid option ([90b1b2e](https://github.com/ghiscoding/slickgrid-universal/commit/90b1b2ec0c1a55d23ebcc47b6a88d972c9bbcdb7))
* **tree:** get a functional Tree View example working with add item ([c07cdb5](https://github.com/ghiscoding/slickgrid-universal/commit/c07cdb545106fd845a105a28014daabaa2860137))
