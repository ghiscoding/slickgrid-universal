# Change Log
## All-in-One SlickGrid framework agnostic wrapper, visit [Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal) 📦🚀

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.3.1](https://github.com/ghiscoding/slickgrid-universal/compare/v4.3.0...v4.3.1) (2024-01-27)

### Bug Fixes

* **deps:** update all non-major dependencies ([#1368](https://github.com/ghiscoding/slickgrid-universal/issues/1368)) ([b49e895](https://github.com/ghiscoding/slickgrid-universal/commit/b49e89524815006c348917039342e53f00871110)) - by @renovate-bot

### Performance Improvements

* **plugins:** decrease number of calls to translate all extensions only once ([#1359](https://github.com/ghiscoding/slickgrid-universal/issues/1359)) ([3e002f1](https://github.com/ghiscoding/slickgrid-universal/commit/3e002f15a06abd06893783e0667798f5ff8893cf)) - by @ghiscoding

# [4.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.2.0...v4.3.0) (2024-01-20)

### Bug Fixes

* **demo:** Unsaved Cell CSS Styling follow sort/filter/pagination ([#1313](https://github.com/ghiscoding/slickgrid-universal/issues/1313)) ([7619579](https://github.com/ghiscoding/slickgrid-universal/commit/761957987e85ed9829900739e659d8d02230ea12)) - by @ghiscoding
* Editors/Filters should create SlickEventData with event arg ([#1326](https://github.com/ghiscoding/slickgrid-universal/issues/1326)) ([e008902](https://github.com/ghiscoding/slickgrid-universal/commit/e008902e6d85a7a424ed8c9e32786490daac66ce)) - by @ghiscoding

### Features

* add `name` option to CheckboxSelectColumn plugin on columDef ([#1331](https://github.com/ghiscoding/slickgrid-universal/issues/1331)) ([abe344b](https://github.com/ghiscoding/slickgrid-universal/commit/abe344b025b385630077bfb63d5534a88b3b7d71)) - by @ghiscoding
* add `onBeforePasteCell` event to excel copy buffer ([#1298](https://github.com/ghiscoding/slickgrid-universal/issues/1298)) ([22037ca](https://github.com/ghiscoding/slickgrid-universal/commit/22037ca7918fc4bfb55bb4bf619cd280b564a351)) - by @zewa666
* **core:** expose all SlickEvent via internal PubSub Service ([#1311](https://github.com/ghiscoding/slickgrid-universal/issues/1311)) ([f56edef](https://github.com/ghiscoding/slickgrid-universal/commit/f56edef91b76ab044134ddf36d67599e6d80f39c)) - by @ghiscoding
* **editor:** auto commit before save; add `onBeforeEditMode` callback ([#1353](https://github.com/ghiscoding/slickgrid-universal/issues/1353)) ([f33bf52](https://github.com/ghiscoding/slickgrid-universal/commit/f33bf5202e0db30121bf52ce184555f6524dde85)) - by @zewa666
* **plugin:** new Row Based Editor ([#1323](https://github.com/ghiscoding/slickgrid-universal/issues/1323)) ([64d464c](https://github.com/ghiscoding/slickgrid-universal/commit/64d464c2094c014024ddeaf49bd4f6ec898b1c25)) - by @zewa666

# [4.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.1.0...v4.2.0) (2023-12-30)

### Features

* (re)add option to cancel Row Detail opening ([#1286](https://github.com/ghiscoding/slickgrid-universal/issues/1286)) ([f08925c](https://github.com/ghiscoding/slickgrid-universal/commit/f08925c50c1dd18448a04a55c8303736e3cc2289)) - by @ghiscoding
* make DataView Grouping `compileAccumulatorLoop` CSP safe ([#1295](https://github.com/ghiscoding/slickgrid-universal/issues/1295)) ([af82208](https://github.com/ghiscoding/slickgrid-universal/commit/af8220881b2791be2cc3f6605eda3955428094c7)) - by @ghiscoding

# [4.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.3...v4.1.0) (2023-12-21)

**Note:** Version bump only for package slickgrid-universal-vite-demo

## [4.0.3](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.2...v4.0.3) (2023-12-16)

**Note:** Version bump only for package slickgrid-universal-vite-demo

## [4.0.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.2...v4.0.2) (2023-12-15)

### Bug Fixes

* **deps:** update dependency multiple-select-vanilla to ^1.1.1 ([#1267](https://github.com/ghiscoding/slickgrid-universal/issues/1267)) ([f6e5e2c](https://github.com/ghiscoding/slickgrid-universal/commit/f6e5e2c0e094541f2e1783e8f598e0f0fbcfa903)) - by @renovate-bot

* BREAKING CHANGE: merge SlickGrid into Slickgrid-Universal & drop external dep (#1264) ([18b96ce](https://github.com/ghiscoding/slickgrid-universal/commit/18b96ce2a5779b36c8bc2a977d4e03b0a7003006)), closes [#1264](https://github.com/ghiscoding/slickgrid-universal/issues/1264) - by @ghiscoding

### BREAKING CHANGES

* merge SlickGrid into Slickgrid-Universal & drop external dep

## [4.0.1-alpha.1](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.1-alpha.0...v4.0.1-alpha.1) (2023-12-12)

**Note:** Version bump only for package slickgrid-universal-vite-demo

## [4.0.1-alpha.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.0-alpha.0...v4.0.1-alpha.0) (2023-12-10)

### Bug Fixes

* **core:** SlickEventHandler handler args should have Types ([#1261](https://github.com/ghiscoding/slickgrid-universal/issues/1261)) ([a33129b](https://github.com/ghiscoding/slickgrid-universal/commit/a33129b0ce1443443e7dcebb3562ffd538b6a731)) - by @ghiscoding

# [4.0.0-alpha.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.1...v4.0.0-alpha.0) (2023-12-09)

### Bug Fixes

* Draggable shouldn't trigger dragEnd without first dragging ([#1211](https://github.com/ghiscoding/slickgrid-universal/issues/1211)) ([47cb36e](https://github.com/ghiscoding/slickgrid-universal/commit/47cb36e78995f70933807aa33ba3afa0fecf491e)) - by @ghiscoding
* remove CellRange, SlickRange, SlickGroup, ... unused interfaces ([#1219](https://github.com/ghiscoding/slickgrid-universal/issues/1219)) ([a4cc469](https://github.com/ghiscoding/slickgrid-universal/commit/a4cc469e9c21c5ed851bfbaafdc6b580e7389272)) - by @ghiscoding

### Features

* remove unnecessary Formatters, replace by `cssClass` ([#1225](https://github.com/ghiscoding/slickgrid-universal/issues/1225)) ([de26496](https://github.com/ghiscoding/slickgrid-universal/commit/de26496aa5dc462869a4a1ff966b32baf86e188b)) - by @ghiscoding
* rewrite all Formatters as native HTML elements ([#1229](https://github.com/ghiscoding/slickgrid-universal/issues/1229)) ([5cb4dd5](https://github.com/ghiscoding/slickgrid-universal/commit/5cb4dd5757adc401ed4e6deab0e41bcd08a827a3)) - by @ghiscoding

## [3.7.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.1...v3.7.2) (2023-12-12)

### Bug Fixes

* use !important on CSS text utils ([7fdbeb6](https://github.com/ghiscoding/slickgrid-universal/commit/7fdbeb6c46201ae80d6e71e2df7016735b771bf2)) - by @ghiscoding

## [3.7.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.0...v3.7.1) (2023-12-08)

**Note:** Version bump only for package slickgrid-universal-vite-demo

# [3.7.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.6.0...v3.7.0) (2023-12-08)

### Bug Fixes

* registered external resouces should keep singleton ref ([#1242](https://github.com/ghiscoding/slickgrid-universal/issues/1242)) ([adf2054](https://github.com/ghiscoding/slickgrid-universal/commit/adf2054bdc8ef7701e6fab78e685d49b8424da29)) - by @ghiscoding

# 3.6.0 (2023-11-26)

### Features

* Column.excludeFieldFromQuery, exclude field but keep fields array ([#1217](https://github.com/ghiscoding/slickgrid-universal/issues/1217)) ([85cc514](https://github.com/ghiscoding/slickgrid-universal/commit/85cc514c945c1ad6eadd1a93a2839775a95da261)) - by @Harsgalt86

## [3.5.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.5.0...v3.5.1) (2023-11-13)

### Bug Fixes

* **common:** ms-select-vanilla requires `@types/trusted-types` dep ([#1190](https://github.com/ghiscoding/slickgrid-universal/issues/1190)) ([284a379](https://github.com/ghiscoding/slickgrid-universal/commit/284a3791027423d0d7f45a950e0a3b8a8a684612)) - by @ghiscoding
* improve build & types exports for all targets, Node, CJS/ESM ([#1188](https://github.com/ghiscoding/slickgrid-universal/issues/1188)) ([980fd68](https://github.com/ghiscoding/slickgrid-universal/commit/980fd68f6ce9564bb1fcac5f6ee68fd35f839e8f)) - by @ghiscoding

# [3.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.4.2...v3.5.0) (2023-11-10)

### Bug Fixes

* **graphql:** deprecate `isWithCursor` in favor of simpler `useCursor` ([#1187](https://github.com/ghiscoding/slickgrid-universal/issues/1187)) ([7b3590f](https://github.com/ghiscoding/slickgrid-universal/commit/7b3590f323ea2fe3d3f312674205fc94485213fa)) - by @ghiscoding
* **pagination:** should recreate pagination on cursor based changed ([#1175](https://github.com/ghiscoding/slickgrid-universal/issues/1175)) ([c7836aa](https://github.com/ghiscoding/slickgrid-universal/commit/c7836aae4a4ea0892791acc79a7bcb338ddb2038)) - by @ghiscoding
* **styles:** menu command with & without icons aren't aligned ([#1180](https://github.com/ghiscoding/slickgrid-universal/issues/1180)) ([35f040d](https://github.com/ghiscoding/slickgrid-universal/commit/35f040dbd1f2d384aadbfbe351dd0e55f8d34c68)) - by @ghiscoding

### Features

* **common:** add `compoundOperatorAltTexts` grid option ([#1181](https://github.com/ghiscoding/slickgrid-universal/issues/1181)) ([dc0aa5e](https://github.com/ghiscoding/slickgrid-universal/commit/dc0aa5e28351af989e9dd691916af909e3a5fdf5)) - by @ghiscoding

## [3.4.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.4.1...v3.4.2) (2023-11-02)

**Note:** Version bump only for package slickgrid-universal-vite-demo

## [3.4.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.4.0...v3.4.1) (2023-11-02)

**Note:** Version bump only for package slickgrid-universal-vite-demo

# [3.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.3.2...v3.4.0) (2023-11-02)

### Bug Fixes

* deprecate HeaderMenu `items` in favor of `commandItems` ([634441c](https://github.com/ghiscoding/slickgrid-universal/commit/634441c34e17a0a11c672df32c71014309efc13e)) - by @ghiscoding
* deprecate HeaderMenu `items` in favor of `commandItems` ([#1159](https://github.com/ghiscoding/slickgrid-universal/issues/1159)) ([2b26d6d](https://github.com/ghiscoding/slickgrid-universal/commit/2b26d6da1232f4ad4a7d0db8ad077b3b2e3c6bd7)) - by @ghiscoding
* **deps:** update all non-major dependencies ([#1136](https://github.com/ghiscoding/slickgrid-universal/issues/1136)) ([a755b0f](https://github.com/ghiscoding/slickgrid-universal/commit/a755b0f0ff8af47c6d1d534930b1354fd28a781f)) - by @renovate-bot

### Features

* add sub-menu(s) to CellMenu & ContextMenu plugins ([#1141](https://github.com/ghiscoding/slickgrid-universal/issues/1141)) ([bd18af1](https://github.com/ghiscoding/slickgrid-universal/commit/bd18af1ee960f9417cb7625ff8c3fb5d9567d16e)) - by @ghiscoding
* add sub-menu(s) to GridMenu plugin ([#1151](https://github.com/ghiscoding/slickgrid-universal/issues/1151)) ([5178310](https://github.com/ghiscoding/slickgrid-universal/commit/5178310c0247d5524300841aac7aea7c4f3df733)) - by @ghiscoding
* add sub-menu(s) to HeaderMenu plugin ([#1158](https://github.com/ghiscoding/slickgrid-universal/issues/1158)) ([eeab42e](https://github.com/ghiscoding/slickgrid-universal/commit/eeab42e270e53341a8572ab55ed758276a4d30d6)) - by @ghiscoding
* add support for grid inside Shadow DOM ([#1166](https://github.com/ghiscoding/slickgrid-universal/issues/1166)) ([f7b8c46](https://github.com/ghiscoding/slickgrid-universal/commit/f7b8c46593c71b7114ac85610c12ad6187e3f6de)) - by @ghiscoding
* **graphql:** add optional cursor pagination to GraphQL backend service ([#1153](https://github.com/ghiscoding/slickgrid-universal/issues/1153)) ([29579b2](https://github.com/ghiscoding/slickgrid-universal/commit/29579b23ab1e531b3323cbf10eb9e9882e244b8f)) - by @Harsgalt86

## [3.3.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.3.1...v3.3.2) (2023-10-06)

**Note:** Version bump only for package slickgrid-universal-vite-demo

# [3.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.2.2...v3.3.0) (2023-10-05)

### Features

* add pageUp/pageDown/home/end to SlickCellSelection ([#1126](https://github.com/ghiscoding/slickgrid-universal/issues/1126)) ([b7e9e0d](https://github.com/ghiscoding/slickgrid-universal/commit/b7e9e0db9fde184c76cb835858d195ad28657b05)) - by @ghiscoding

## [3.2.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.2.1...v3.2.2) (2023-09-24)

### Bug Fixes

* **deps:** update all non-major dependencies ([#1113](https://github.com/ghiscoding/slickgrid-universal/issues/1113)) ([37741fe](https://github.com/ghiscoding/slickgrid-universal/commit/37741fe572e866ca5e1c7c53280eb9a1a2da6518)) - by @renovate-bot
* **deps:** update dependency multiple-select-vanilla to ^0.4.10 ([#1098](https://github.com/ghiscoding/slickgrid-universal/issues/1098)) ([ab97b9d](https://github.com/ghiscoding/slickgrid-universal/commit/ab97b9df3205f1a55f69f3722d276c8c71d8fd29)) - by @renovate-bot
* **resizer:** resize without container ([#1117](https://github.com/ghiscoding/slickgrid-universal/issues/1117)) ([9013522](https://github.com/ghiscoding/slickgrid-universal/commit/90135223130dacfdd376b56d4cf49437328b08ae)) - by @zewa666

## [3.2.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.2.0...v3.2.1) (2023-09-05)

### Bug Fixes

* **common:** Select Filter/Editor enableRenderHtml was wrong ([#1096](https://github.com/ghiscoding/slickgrid-universal/issues/1096)) ([1f09eef](https://github.com/ghiscoding/slickgrid-universal/commit/1f09eefaf2dbb13434fd90b54b5361ef9f08116c)) - by @ghiscoding

## [3.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.1.0...v3.2.0) (2023-08-21)

### Features

* **export:** add `autoDetectCellFormat` flag to Excel Export Options ([#1083](https://github.com/ghiscoding/slickgrid-universal/issues/1083)) ([839b09a](https://github.com/ghiscoding/slickgrid-universal/commit/839b09a10ceba889bc96a7f229f58412a6d5649c)) - by @ghiscoding
* **TreeData:** add auto-recalc feature for Tree Totals w/Aggregators ([#1084](https://github.com/ghiscoding/slickgrid-universal/issues/1084)) ([e884c03](https://github.com/ghiscoding/slickgrid-universal/commit/e884c0356595c161b746ca370efa4bd74088c458)) - by @ghiscoding
* **TreeData:** add optional Aggregators to Tree Data grids  ([#1074](https://github.com/ghiscoding/slickgrid-universal/issues/1074)) ([6af5fd1](https://github.com/ghiscoding/slickgrid-universal/commit/6af5fd17b582834b24655b06c34c634a99c93c6e)) - by @ghiscoding

## [3.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.0.1...v3.1.0) (2023-07-20)

### Features

* **common:** add optional `scrollIntoView` to GridService `addItems` ([#1043](https://github.com/ghiscoding/slickgrid-universal/issues/1043)) ([a6d194a](https://github.com/ghiscoding/slickgrid-universal/commit/a6d194a4352f22a23c493250ceef67e5acd86ce4)) - by @ghiscoding

### Bug Fixes

* **deps:** update dependency dompurify to ^3.0.5 ([#1030](https://github.com/ghiscoding/slickgrid-universal/issues/1030)) ([728bc58](https://github.com/ghiscoding/slickgrid-universal/commit/728bc58b6844544479695f29984221c9ea099936)) - by @renovate-bot

## [3.0.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.0.0...v3.0.1) (2023-07-01)

### Bug Fixes

* **common:** Select Filter/Editor regular text shouldn't be html encoded ([#1011](https://github.com/ghiscoding/slickgrid-universal/issues/1011)) ([c203a2c](https://github.com/ghiscoding/slickgrid-universal/commit/c203a2ce4d4e5cf6dfb0e05a25f5fd6b0c4cbe4d)), closes [#976](https://github.com/ghiscoding/slickgrid-universal/issues/976) - by @ghiscoding
* **deps:** update all non-major dependencies ([#1016](https://github.com/ghiscoding/slickgrid-universal/issues/1016)) ([c34ed84](https://github.com/ghiscoding/slickgrid-universal/commit/c34ed84c8c5aa20876c70b6350f711e16fe6b965)) - by @renovate-bot

## [3.0.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.4...v3.0.0) (2023-05-29)

### ⚠ BREAKING CHANGES

* drop jQuery requirement & use multiple-select-vanilla dependency (#976)

### Features

* drop jQuery requirement & use multiple-select-vanilla dependency ([#976](https://github.com/ghiscoding/slickgrid-universal/issues/976)) ([4e3e1d3](https://github.com/ghiscoding/slickgrid-universal/commit/4e3e1d394247be75d1717feece833e200fce21dc)), closes [#919](https://github.com/ghiscoding/slickgrid-universal/issues/919) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#981](https://github.com/ghiscoding/slickgrid-universal/issues/981)) ([349715b](https://github.com/ghiscoding/slickgrid-universal/commit/349715bc4391d2469347fb0d11446ceea8b76444)) - by @renovate-bot

## [3.0.0-beta.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.4...v3.0.0-beta.0) (2023-05-20)

### ⚠ BREAKING CHANGES

* drop jQuery requirement (#962)
* **common:** migrate to multiple-select-vanilla (#919)

### Features

* **common:** migrate to multiple-select-vanilla ([#919](https://github.com/ghiscoding/slickgrid-universal/issues/919)) ([bc74207](https://github.com/ghiscoding/slickgrid-universal/commit/bc74207e9b2ec46209e87b126e1fcff596c162af)) - by @ghiscoding
* drop jQuery requirement ([#962](https://github.com/ghiscoding/slickgrid-universal/issues/962)) ([3da21da](https://github.com/ghiscoding/slickgrid-universal/commit/3da21daacc391a0fb309fcddd78442642c5269f6)) - by @ghiscoding

## [2.6.4](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.3...v2.6.4) (2023-05-20)

### Bug Fixes

* **core:** add better aria accessibility missing on menus and checkboxes ([#968](https://github.com/ghiscoding/slickgrid-universal/issues/968)) ([8041c11](https://github.com/ghiscoding/slickgrid-universal/commit/8041c1189afd7460bbcc0226c49086878c3b5f90)) - by @ghiscoding
* **deps:** update all non-major dependencies ([#975](https://github.com/ghiscoding/slickgrid-universal/issues/975)) ([c4313b0](https://github.com/ghiscoding/slickgrid-universal/commit/c4313b014da67826b46324c2933f923ea90e7088)) - by @renovate-bot
* **deps:** update dependency @faker-js/faker to v8 ([#973](https://github.com/ghiscoding/slickgrid-universal/issues/973)) ([0f2837e](https://github.com/ghiscoding/slickgrid-universal/commit/0f2837e61862016cbbdeef8e4e2517ccfaea2202)) - by @renovate-bot
* **export:** fix negative number exports to Excel ([#977](https://github.com/ghiscoding/slickgrid-universal/issues/977)) ([edf5721](https://github.com/ghiscoding/slickgrid-universal/commit/edf5721007ce0745fc81f3f0261fb7e25340cbc1)) - by @ghiscoding

## [2.6.3](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.2...v2.6.3) (2023-03-23)

**Note:** Version bump only for package slickgrid-universal-vite-demo
