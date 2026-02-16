# Change Log
## All-in-One SlickGrid agnostic library, visit [Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal) 📦🚀

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [10.0.0-beta.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.12.0...v10.0.0-beta.0) (2026-02-14)

### ⚠ BREAKING CHANGES

* migrate Row/Hybrid Selection flag into a single `enableSelection` flag (#2331)
* drop Cell/Row Selection Models & keep only HybridSelectionModel (#2330)
* remove all Deprecated code (#2302)
* drop OperatorType enums and keep only type literal (#2301)
* replacing multiple TypeScript `enum` with `type` to decrease build size (#2300)
* **vue** rename `v-model:data` to `v-model:dataset` (#2298)
* make Row Detail plugin as optional in all framework wrappers (#2291)
* switch to column `hidden` property and always keep all columns (#2281)

### Features

* add custom menu slot renderers ([#2375](https://github.com/ghiscoding/slickgrid-universal/issues/2375)) ([7ebbda5](https://github.com/ghiscoding/slickgrid-universal/commit/7ebbda58233bb5ce94b81b5b2b578af0ea6a068d)) - by @ghiscoding
* auto-enabled external resources with their associated flags ([#2362](https://github.com/ghiscoding/slickgrid-universal/issues/2362)) ([16dd8a7](https://github.com/ghiscoding/slickgrid-universal/commit/16dd8a77dd5d136a5a99321f0fc4c50571fdb0c0)) - by @ghiscoding
* drop Cell/Row Selection Models & keep only HybridSelectionModel ([#2330](https://github.com/ghiscoding/slickgrid-universal/issues/2330)) ([4398cf4](https://github.com/ghiscoding/slickgrid-universal/commit/4398cf42e03f6971b81db8cea4ed11138c0aa452)) - by @ghiscoding
* make Row Detail plugin as optional in all framework wrappers ([#2291](https://github.com/ghiscoding/slickgrid-universal/issues/2291)) ([fa1a14c](https://github.com/ghiscoding/slickgrid-universal/commit/fa1a14c16c987bfaf7725c46e8114b20ea5a505d)) - by @ghiscoding
* migrate Row/Hybrid Selection flag into a single `enableSelection` flag ([#2331](https://github.com/ghiscoding/slickgrid-universal/issues/2331)) ([5be5e6a](https://github.com/ghiscoding/slickgrid-universal/commit/5be5e6a862ecd024cf43d404769d65c6c1dd335e)) - by @ghiscoding
* **vue** rename `v-model:data` to `v-model:dataset` ([#2298](https://github.com/ghiscoding/slickgrid-universal/issues/2298)) ([34f42f2](https://github.com/ghiscoding/slickgrid-universal/commit/34f42f2d14c9a1b39a2695c8a885ff2bee53d0b5)) - by @ghiscoding
* switch to column `hidden` property and always keep all columns ([#2281](https://github.com/ghiscoding/slickgrid-universal/issues/2281)) ([075c649](https://github.com/ghiscoding/slickgrid-universal/commit/075c64961cb7400500df46b792866d39fba2d9e0)) - by @ghiscoding
* **tooltip:** add global tooltip observation for non-grid elements ([#2371](https://github.com/ghiscoding/slickgrid-universal/issues/2371)) ([1bbc8de](https://github.com/ghiscoding/slickgrid-universal/commit/1bbc8de895e370843286eadd08574efc552ad8fd)) - by @ghiscoding

### Bug Fixes

* **plugin:** SlickCustomTooltip should work with parent+child tooltips ([#2374](https://github.com/ghiscoding/slickgrid-universal/issues/2374)) ([8af7f45](https://github.com/ghiscoding/slickgrid-universal/commit/8af7f45eb19f0a00da2f3de7c729504be7d043eb)) - by @ghiscoding
* remove all Deprecated code ([#2302](https://github.com/ghiscoding/slickgrid-universal/issues/2302)) ([f42c46c](https://github.com/ghiscoding/slickgrid-universal/commit/f42c46cd1f05b5c72c62f552f124b5bfe776f8b0)) - by @ghiscoding

### Code Refactoring

* drop OperatorType enums and keep only type literal ([#2301](https://github.com/ghiscoding/slickgrid-universal/issues/2301)) ([5dd0807](https://github.com/ghiscoding/slickgrid-universal/commit/5dd08079460dc9af798ab29527997a6d4b31abdd)) - by @ghiscoding
* replacing multiple TypeScript `enum` with `type` to decrease build size ([#2300](https://github.com/ghiscoding/slickgrid-universal/issues/2300)) ([ea79395](https://github.com/ghiscoding/slickgrid-universal/commit/ea79395cf663b3abce8e43cf27ba6ffea7cfe113)) - by @ghiscoding

## [9.13.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.12.0...v9.13.0) (2026-01-30)

### Features

* **export:** add new optional PDF Export package ([#2317](https://github.com/ghiscoding/slickgrid-universal/issues/2317)) ([42347f6](https://github.com/ghiscoding/slickgrid-universal/commit/42347f605388d3c080568d8bbe93dcf7c5ed1ff4)) - by @ghiscoding

### Bug Fixes

* allow single row selection via click without checkbox column ([#2311](https://github.com/ghiscoding/slickgrid-universal/issues/2311)) ([b2c6594](https://github.com/ghiscoding/slickgrid-universal/commit/b2c659445c5c39b2b76613c113cef833bdd99f97)) - by @ghiscoding
* only assign CellRangeSelector when Hybrid has `dragToSelect` set ([#2329](https://github.com/ghiscoding/slickgrid-universal/issues/2329)) ([a941819](https://github.com/ghiscoding/slickgrid-universal/commit/a941819649dfa1b54f7887603b930cab27d67c3a)) - by @ghiscoding

## [9.12.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.11.0...v9.12.0) (2025-12-29)

### Bug Fixes

* **deps:** update all non-major dependencies ([#2288](https://github.com/ghiscoding/slickgrid-universal/issues/2288)) ([67c0630](https://github.com/ghiscoding/slickgrid-universal/commit/67c0630e4a95a65954d841d9b2176352a65cf9ef)) - by @renovate-bot

## [9.11.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.10.0...v9.11.0) (2025-11-24)

### Features

* add new `autoEditByKeypress` to open editor by typing a char, fix [#2185](https://github.com/ghiscoding/slickgrid-universal/issues/2185) ([#2236](https://github.com/ghiscoding/slickgrid-universal/issues/2236)) ([7e3b6e3](https://github.com/ghiscoding/slickgrid-universal/commit/7e3b6e35eed15bd37dc7d14d71f4b42bc82084dd)) - by @ghiscoding
* add new Cell/Row override to Hybrid Selection Model ([#2229](https://github.com/ghiscoding/slickgrid-universal/issues/2229)) ([1471ebb](https://github.com/ghiscoding/slickgrid-universal/commit/1471ebb361bd2d302db7c1cc5e4f14cd06ce6f0c)) - by @ghiscoding

### Bug Fixes

* add full event Types to Slickgrid-React/Vue ([4766128](https://github.com/ghiscoding/slickgrid-universal/commit/476612899f73f699531b6eef421e9fd055de2380)) - by @ghiscoding

## [9.10.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.9.0...v9.10.0) (2025-11-04)

### Features

* Drag-Fill capability and Hybrid SelectionModel plugin ([#2162](https://github.com/ghiscoding/slickgrid-universal/issues/2162)) ([bb8fb3e](https://github.com/ghiscoding/slickgrid-universal/commit/bb8fb3ee83210755b36713764972c02ad658c12c)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#2218](https://github.com/ghiscoding/slickgrid-universal/issues/2218)) ([da0dfe3](https://github.com/ghiscoding/slickgrid-universal/commit/da0dfe37ccfabc3ac7d13c25e8615c0674363358)) - by @renovate-bot
* toggling Row Detail under a Group should become out of viewport ([#2170](https://github.com/ghiscoding/slickgrid-universal/issues/2170)) ([d14f057](https://github.com/ghiscoding/slickgrid-universal/commit/d14f057c358b5fdf34252e83067c2747d57ce826)) - by @ghiscoding

## [9.9.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.8.0...v9.9.0) (2025-09-20)

### Bug Fixes

* make Row Detail plugin work with Grouping ([#2165](https://github.com/ghiscoding/slickgrid-universal/issues/2165)) ([af51395](https://github.com/ghiscoding/slickgrid-universal/commit/af51395d3c73fab7afdcfc2abe0282847b442f71)) - by @ghiscoding
* **vue:** Row Detail in Vue shouldn't re-render same html twice ([#2166](https://github.com/ghiscoding/slickgrid-universal/issues/2166)) ([94a51c7](https://github.com/ghiscoding/slickgrid-universal/commit/94a51c7c94f3e17c9ae70bf945da2f716c515568)) - by @ghiscoding

## [9.8.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.7.0...v9.8.0) (2025-08-23)

### Bug Fixes

* **deps:** update all non-major dependencies ([#2122](https://github.com/ghiscoding/slickgrid-universal/issues/2122)) ([fe0a878](https://github.com/ghiscoding/slickgrid-universal/commit/fe0a8788ab8942edd19f33751baa952b22fa8154)) - by @renovate-bot

## [9.7.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.6.1...v9.7.0) (2025-08-12)

### Features

* add Grouping to Grid State ([#2101](https://github.com/ghiscoding/slickgrid-universal/issues/2101)) ([df23257](https://github.com/ghiscoding/slickgrid-universal/commit/df23257d8435fa4f14a5bfec732fe00ad11a0606)) - by @ghiscoding
* add Tree Data Lazy Loading option ([#2090](https://github.com/ghiscoding/slickgrid-universal/issues/2090)) ([ae7bde8](https://github.com/ghiscoding/slickgrid-universal/commit/ae7bde8b6827fdb07839222cd97d8bcc33c77d49)) - by @ghiscoding

### Bug Fixes

* `initiallyCollapsed` should work with hierarchical tree dataset ([#2083](https://github.com/ghiscoding/slickgrid-universal/issues/2083)) ([e676246](https://github.com/ghiscoding/slickgrid-universal/commit/e676246d0f1305eb17b9ba6818cd81783eab8cce)) - by @ghiscoding
* deprecate `mdi-...px` (icon size) and `text-color-...` ([#2089](https://github.com/ghiscoding/slickgrid-universal/issues/2089)) ([3b24a18](https://github.com/ghiscoding/slickgrid-universal/commit/3b24a187503dfb0b71b3adf3faa9a4622bf2b962)) - by @ghiscoding

### Performance Improvements

* improve expand/collapse all tree data items ([#2098](https://github.com/ghiscoding/slickgrid-universal/issues/2098)) ([45c6ead](https://github.com/ghiscoding/slickgrid-universal/commit/45c6ead12b1bc638c10f14134ff1d268d480df75)) - by @ghiscoding

## [9.6.1](https://github.com/ghiscoding/slickgrid-universal/compare/v9.6.0...v9.6.1) (2025-07-27)

**Note:** Version bump only for package slickgrid-vue-demo

## [9.6.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.5.0...v9.6.0) (2025-07-27)

**Note:** Version bump only for package slickgrid-vue-demo

## [9.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.4.0...v9.5.0) (2025-07-19)

**Note:** Version bump only for package slickgrid-vue-demo

## [9.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.3.0...v9.4.0) (2025-07-12)

**Note:** Version bump only for package slickgrid-vue-demo

## [9.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.2.0...v9.3.0) (2025-07-05)

### Bug Fixes

* **filters:** Grid State/Presets text filter w/operator+empty value ([#2012](https://github.com/ghiscoding/slickgrid-universal/issues/2012)) ([6af9737](https://github.com/ghiscoding/slickgrid-universal/commit/6af97370e6feae65d7efb5767df5a3f549673a9d)) - by @ghiscoding

## [9.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.1.0...v9.2.0) (2025-06-14)

**Note:** Version bump only for package slickgrid-vue-demo

## [9.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.0.3...v9.1.0) (2025-05-31)

### Features

* Composite Editor should support cell selection ([#1990](https://github.com/ghiscoding/slickgrid-universal/issues/1990)) ([0a7ab6e](https://github.com/ghiscoding/slickgrid-universal/commit/0a7ab6e3b59176a3d4a6af67bdca8c31b681aad3)), closes [#1987](https://github.com/ghiscoding/slickgrid-universal/issues/1987) - by @wscherphof

## [9.0.3](https://github.com/ghiscoding/slickgrid-universal/compare/v9.0.2...v9.0.3) (2025-05-16)

**Note:** Version bump only for package slickgrid-vue-demo

## [9.0.2](https://github.com/ghiscoding/slickgrid-universal/compare/v9.0.0...v9.0.2) (2025-05-16)

**Note:** Version bump only for package slickgrid-vue-demo

## [9.0.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.14.0...v9.0.0) (2025-05-10)

### ⚠ BREAKING CHANGES

* remove Arrow pointer from Custom Tooltip (#1964)
* prepare next major release v9.0 (#1947)

### Features

* prepare next major release v9.0 ([#1947](https://github.com/ghiscoding/slickgrid-universal/issues/1947)) ([0bbc398](https://github.com/ghiscoding/slickgrid-universal/commit/0bbc39803c6956f74f6a6b46dc39eb3a97ec84a5)) - by @ghiscoding

### Bug Fixes

* **deps:** update vuejs dependencies ([#1967](https://github.com/ghiscoding/slickgrid-universal/issues/1967)) ([42d8cb1](https://github.com/ghiscoding/slickgrid-universal/commit/42d8cb127701045976d9feba0269e95809e295d7)) - by @renovate-bot
* incorrect grid container box size calculation border not showing ([#1961](https://github.com/ghiscoding/slickgrid-universal/issues/1961)) ([237ae51](https://github.com/ghiscoding/slickgrid-universal/commit/237ae51cbf406c3dd93078cd44f98f3f35d4bd58)) - by @ghiscoding
* remove Arrow pointer from Custom Tooltip ([#1964](https://github.com/ghiscoding/slickgrid-universal/issues/1964)) ([018169d](https://github.com/ghiscoding/slickgrid-universal/commit/018169df816441d0a8d780299ecabbc81163caba)) - by @ghiscoding
* Row Detail open/close multiple times should always re-render ([#1959](https://github.com/ghiscoding/slickgrid-universal/issues/1959)) ([8b1437c](https://github.com/ghiscoding/slickgrid-universal/commit/8b1437cab5c1a445406414157adacef78854862c)) - by @ghiscoding
