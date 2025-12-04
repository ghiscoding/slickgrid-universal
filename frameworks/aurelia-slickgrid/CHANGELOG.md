# Change Log
## All-in-One SlickGrid agnostic library, visit [Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal) 📦🚀

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [9.11.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.10.0...v9.11.0) (2025-11-24)

### Features

* add new `autoEditByKeypress` to open editor by typing a char, fix [#2185](https://github.com/ghiscoding/slickgrid-universal/issues/2185) ([#2236](https://github.com/ghiscoding/slickgrid-universal/issues/2236)) ([7e3b6e3](https://github.com/ghiscoding/slickgrid-universal/commit/7e3b6e35eed15bd37dc7d14d71f4b42bc82084dd)) - by @ghiscoding

### Bug Fixes

* add full event Types to Slickgrid-React/Vue ([4766128](https://github.com/ghiscoding/slickgrid-universal/commit/476612899f73f699531b6eef421e9fd055de2380)) - by @ghiscoding

## [9.10.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.9.0...v9.10.0) (2025-11-04)

### Features

* Drag-Fill capability and Hybrid SelectionModel plugin ([#2162](https://github.com/ghiscoding/slickgrid-universal/issues/2162)) ([bb8fb3e](https://github.com/ghiscoding/slickgrid-universal/commit/bb8fb3ee83210755b36713764972c02ad658c12c)) - by @ghiscoding

## [9.9.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.8.0...v9.9.0) (2025-09-20)

### Bug Fixes

* make Row Detail plugin work with Grouping ([#2165](https://github.com/ghiscoding/slickgrid-universal/issues/2165)) ([af51395](https://github.com/ghiscoding/slickgrid-universal/commit/af51395d3c73fab7afdcfc2abe0282847b442f71)) - by @ghiscoding
* validate allowed frozen column only when setting grid options ([#2139](https://github.com/ghiscoding/slickgrid-universal/issues/2139)) ([9d74f01](https://github.com/ghiscoding/slickgrid-universal/commit/9d74f0146cc0dbbea549d11a25325edb38fc40fb)) - by @ghiscoding
* validate allowed frozen column or alert when setting option ([#2145](https://github.com/ghiscoding/slickgrid-universal/issues/2145)) ([f550a99](https://github.com/ghiscoding/slickgrid-universal/commit/f550a99a40a5453c3c9a18e159720a1f6db6fb60)) - by @ghiscoding
* validate to always have 1 or more column on right freeze section ([#2154](https://github.com/ghiscoding/slickgrid-universal/issues/2154)) ([cacfb70](https://github.com/ghiscoding/slickgrid-universal/commit/cacfb704adbc16844ba9ce5564f0a4354054a749)) - by @ghiscoding

## [9.8.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.7.0...v9.8.0) (2025-08-23)

### Bug Fixes

* hiding a column, freezing another column should keep freeze index ([#2114](https://github.com/ghiscoding/slickgrid-universal/issues/2114)) ([424a86b](https://github.com/ghiscoding/slickgrid-universal/commit/424a86b4677d6b66e622161693c5b151acb67f80)) - by @ghiscoding

## [9.7.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.6.1...v9.7.0) (2025-08-12)

### Features

* add Grouping to Grid State ([#2101](https://github.com/ghiscoding/slickgrid-universal/issues/2101)) ([df23257](https://github.com/ghiscoding/slickgrid-universal/commit/df23257d8435fa4f14a5bfec732fe00ad11a0606)) - by @ghiscoding
* add Tree Data Lazy Loading option ([#2090](https://github.com/ghiscoding/slickgrid-universal/issues/2090)) ([ae7bde8](https://github.com/ghiscoding/slickgrid-universal/commit/ae7bde8b6827fdb07839222cd97d8bcc33c77d49)) - by @ghiscoding

### Bug Fixes

* `initiallyCollapsed` should work with hierarchical tree dataset ([#2083](https://github.com/ghiscoding/slickgrid-universal/issues/2083)) ([e676246](https://github.com/ghiscoding/slickgrid-universal/commit/e676246d0f1305eb17b9ba6818cd81783eab8cce)) - by @ghiscoding
* deprecate `mdi-...px` (icon size) and `text-color-...` ([#2089](https://github.com/ghiscoding/slickgrid-universal/issues/2089)) ([3b24a18](https://github.com/ghiscoding/slickgrid-universal/commit/3b24a187503dfb0b71b3adf3faa9a4622bf2b962)) - by @ghiscoding

## [9.6.1](https://github.com/ghiscoding/slickgrid-universal/compare/v9.6.0...v9.6.1) (2025-07-27)

### Bug Fixes

* add missing "Unfreeze Columns" translations ([477e2c7](https://github.com/ghiscoding/slickgrid-universal/commit/477e2c7f1a9c248a46a69754eeba9f6b2aa1a2ff)) - by @ghiscoding

## [9.6.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.5.0...v9.6.0) (2025-07-27)

**Note:** Version bump only for package aurelia-slickgrid

## [9.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.4.0...v9.5.0) (2025-07-19)

### Features

* add unfreeze command to HeaderMenu, toggle command after calling ([#2058](https://github.com/ghiscoding/slickgrid-universal/issues/2058)) ([eb7cdd4](https://github.com/ghiscoding/slickgrid-universal/commit/eb7cdd40717a3e09d5d3961c54ab360c48c2d65b)) - by @ghiscoding

## [9.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.3.0...v9.4.0) (2025-07-12)

### Features

* **deps:** update to latest Aurelia 2 Beta.25 ([#2046](https://github.com/ghiscoding/slickgrid-universal/issues/2046)) ([d07dd73](https://github.com/ghiscoding/slickgrid-universal/commit/d07dd73d402d7d0c4f85bbd9ec793519c6d704e2)) - by @ghiscoding

### Bug Fixes

* **editor:** change console error to a console warning ([#2045](https://github.com/ghiscoding/slickgrid-universal/issues/2045)) ([8a40d3d](https://github.com/ghiscoding/slickgrid-universal/commit/8a40d3dd7d1ad35f104c3deefb6988086884a774)) - by @ghiscoding

## [9.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.2.0...v9.3.0) (2025-07-05)

### Features

* add `commandLabels` to ContextMenu & HeaderMenu ([#2035](https://github.com/ghiscoding/slickgrid-universal/issues/2035)) ([b8f7612](https://github.com/ghiscoding/slickgrid-universal/commit/b8f76122f5ab2e3c9d0453beed9b3efbffe18811)) - by @ghiscoding

### Bug Fixes

* **filter:** input filter empty values & save GridState/Preset ([#2041](https://github.com/ghiscoding/slickgrid-universal/issues/2041)) ([8c77f27](https://github.com/ghiscoding/slickgrid-universal/commit/8c77f27f8c60066173f43ef7a170b75e4393ebe2)) - by @ghiscoding

## [9.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.1.0...v9.2.0) (2025-06-14)

### Features

* **core:** add slick group totals formatter font weight style variable ([#2001](https://github.com/ghiscoding/slickgrid-universal/issues/2001)) ([3b33891](https://github.com/ghiscoding/slickgrid-universal/commit/3b338913992d0332cb20d4bd9088dd9490957679)) - by @anton-gustafsson

## [9.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.0.3...v9.1.0) (2025-05-31)

### Features

* Composite Editor should support cell selection ([#1990](https://github.com/ghiscoding/slickgrid-universal/issues/1990)) ([0a7ab6e](https://github.com/ghiscoding/slickgrid-universal/commit/0a7ab6e3b59176a3d4a6af67bdca8c31b681aad3)), closes [#1987](https://github.com/ghiscoding/slickgrid-universal/issues/1987) - by @wscherphof

### Bug Fixes

* **aurelia:** upgrade to Aurelia 2 Beta 24 ([#1985](https://github.com/ghiscoding/slickgrid-universal/issues/1985)) ([4b560e3](https://github.com/ghiscoding/slickgrid-universal/commit/4b560e3585dc67c9adfec8566bc69f7043401d8f)) - by @ghiscoding

## [9.0.3](https://github.com/ghiscoding/slickgrid-universal/compare/v9.0.2...v9.0.3) (2025-05-16)

**Note:** Version bump only for package aurelia-slickgrid

## [9.0.2](https://github.com/ghiscoding/slickgrid-universal/compare/v9.0.0...v9.0.2) (2025-05-16)

**Note:** Version bump only for package aurelia-slickgrid

## [9.0.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v5.14.0...v9.0.0) (2025-05-10)

> [!NOTE]
> #### Follow the [Migration to 9.0](https://ghiscoding.gitbook.io/aurelia-slickgrid/migrations/migration-to-9.x) for all the changes and take a look at the [v9.0.0](https://github.com/ghiscoding/slickgrid-universal/releases/tag/v9.0.0) release for the announcement and quick info.

### ⚠ BREAKING CHANGES

* remove Arrow pointer from Custom Tooltip (#1964)
* prepare next major release v9.0 (#1947)

### Features

* prepare next major release v9.0 ([#1947](https://github.com/ghiscoding/aurelia-slickgrid/issues/1947)) ([0bbc398](https://github.com/ghiscoding/aurelia-slickgrid/commit/0bbc39803c6956f74f6a6b46dc39eb3a97ec84a5)) - by @ghiscoding

### Bug Fixes

* remove Arrow pointer from Custom Tooltip ([#1964](https://github.com/ghiscoding/aurelia-slickgrid/issues/1964)) ([018169d](https://github.com/ghiscoding/aurelia-slickgrid/commit/018169df816441d0a8d780299ecabbc81163caba)) - by @ghiscoding
* Row Detail open/close multiple times should always re-render ([#1959](https://github.com/ghiscoding/aurelia-slickgrid/issues/1959)) ([8b1437c](https://github.com/ghiscoding/aurelia-slickgrid/commit/8b1437cab5c1a445406414157adacef78854862c)) - by @ghiscoding

## [8.13.3](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.13.2...v8.13.3) (2025-04-02)

### Bug Fixes

* findItemInTreeStructure() shouldn't throw w/large dataset ([#1336](https://github.com/ghiscoding/aurelia-slickgrid/issues/1336)) ([7f94b1e](https://github.com/ghiscoding/aurelia-slickgrid/commit/7f94b1ef9ce9cac6ae31690463e2845bc96bbffa)) - by @ghiscoding

## [8.13.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.13.1...v8.13.2) (2025-03-29)

### Bug Fixes

* shift + a should not select all cells upwards ([#1334](https://github.com/ghiscoding/aurelia-slickgrid/issues/1334)) ([5327ab5](https://github.com/ghiscoding/aurelia-slickgrid/commit/5327ab5929e34ec1679f5239d4385048d0eb3e9b)) - by @ghiscoding

## [8.13.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.13.0...v8.13.1) (2025-03-19)

### Bug Fixes

* Row Detail code cleanup, remove unnecessary if condition wrappers ([#1319](https://github.com/ghiscoding/aurelia-slickgrid/issues/1319)) ([4d190a1](https://github.com/ghiscoding/aurelia-slickgrid/commit/4d190a137503cd2636d3b1b40c3f512839397b28)) - by @ghiscoding
* Row Detail redraw all should work as expected ([#1322](https://github.com/ghiscoding/aurelia-slickgrid/issues/1322)) ([6f72d1a](https://github.com/ghiscoding/aurelia-slickgrid/commit/6f72d1a483d28d56faad179a98bcf213b2a33830)) - by @ghiscoding
* Row Detail should also work with fixed grid height or w/o autoHeight ([#1324](https://github.com/ghiscoding/aurelia-slickgrid/issues/1324)) ([3af3e8f](https://github.com/ghiscoding/aurelia-slickgrid/commit/3af3e8f1528c106d292b7f4a402a573387495283)) - by @ghiscoding

## [8.13.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.12.2...v8.13.0) (2025-03-01)

### Features

* Row Detail with inner grids ([#1318](https://github.com/ghiscoding/aurelia-slickgrid/issues/1318)) ([26990c4](https://github.com/ghiscoding/aurelia-slickgrid/commit/26990c4f1c01e3eb7030a533130a3eaf5749c7ae)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#1313](https://github.com/ghiscoding/aurelia-slickgrid/issues/1313)) ([4ec5aac](https://github.com/ghiscoding/aurelia-slickgrid/commit/4ec5aac338e5d31f5d76d3dea1cdde8bf35a715a)) - by @renovate-bot
* Row Detail could end up unmounting wrong panel index ([#1316](https://github.com/ghiscoding/aurelia-slickgrid/issues/1316)) ([92e4f32](https://github.com/ghiscoding/aurelia-slickgrid/commit/92e4f32185315c25a0670ad0148b052e7d8a1cfa)) - by @ghiscoding
* Row Detail preload comp should call dispose lifecycle ([#1315](https://github.com/ghiscoding/aurelia-slickgrid/issues/1315)) ([bdb16e7](https://github.com/ghiscoding/aurelia-slickgrid/commit/bdb16e715a90e4416258a54d7f0d99a23bf89430)) - by @ghiscoding

## [8.12.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.12.1...v8.12.2) (2025-02-08)

### Bug Fixes

* **deps:** update to Aurelia 2 Beta 23 ([9f5e987](https://github.com/ghiscoding/aurelia-slickgrid/commit/9f5e9872cf88f859355212e32299da1f8546ecf9)) - by @ghiscoding

## [8.12.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.12.0...v8.12.1) (2025-01-25)

### Bug Fixes

* add `autoResize.autoHeight` to resize by dataset length ([#1310](https://github.com/ghiscoding/aurelia-slickgrid/issues/1310)) ([1070d19](https://github.com/ghiscoding/aurelia-slickgrid/commit/1070d19643bf5af8311bb2e2dff5ccf8bde7f96d)) - by @ghiscoding
* RowSpan should work with Excel Export and merge cells ([#1309](https://github.com/ghiscoding/aurelia-slickgrid/issues/1309)) ([b7ef2a8](https://github.com/ghiscoding/aurelia-slickgrid/commit/b7ef2a82410d2e2a65d42a28295f8122246e0513)) - by @ghiscoding

## [8.12.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.11.0...v8.12.0) (2025-01-21)

### Features

* add `rowspan` implementation ([#1307](https://github.com/ghiscoding/aurelia-slickgrid/issues/1307)) ([9be6b78](https://github.com/ghiscoding/aurelia-slickgrid/commit/9be6b7826169d48c1d3b5f82a03881b1b2614abb)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#1302](https://github.com/ghiscoding/aurelia-slickgrid/issues/1302)) ([1e23bcf](https://github.com/ghiscoding/aurelia-slickgrid/commit/1e23bcf2c783128a830e707db7ab9a1611a6458c)) - by @renovate-bot

## [8.11.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.10.2...v8.11.0) (2024-12-14)

### Features

* allow using AureliaSlickgrid component w/o grid options ([#1298](https://github.com/ghiscoding/aurelia-slickgrid/issues/1298)) ([0345ecd](https://github.com/ghiscoding/aurelia-slickgrid/commit/0345ecd29f96d21a12fd43605a5682284d64d00c)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#1294](https://github.com/ghiscoding/aurelia-slickgrid/issues/1294)) ([9b84a11](https://github.com/ghiscoding/aurelia-slickgrid/commit/9b84a11b5bebae8436c3482006f35cd93e24be3c)) - by @renovate-bot

## [8.10.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.10.1...v8.10.2) (2024-11-30)

### Bug Fixes

* update Slickgrid-Universal to fix a few UI issues ([#1293](https://github.com/ghiscoding/aurelia-slickgrid/issues/1293)) ([64fcf52](https://github.com/ghiscoding/aurelia-slickgrid/commit/64fcf52e62379e40f476be1392ba64646666ff60)) - by @ghiscoding

## [8.10.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.10.0...v8.10.1) (2024-11-09)

### Bug Fixes

* few more Styling Theme fixes & Grid Service fixes ([#1284](https://github.com/ghiscoding/aurelia-slickgrid/issues/1284)) ([e43c5d4](https://github.com/ghiscoding/aurelia-slickgrid/commit/e43c5d4e7fdeb6460bd909a3f8e10ff327603d1b)) - by @ghiscoding

## [8.10.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.9.1...v8.10.0) (2024-11-02)

### Features

* switch to SASS `@use` and remove any `@import` to fix deprecations ([#1278](https://github.com/ghiscoding/aurelia-slickgrid/issues/1278)) ([d1a90af](https://github.com/ghiscoding/aurelia-slickgrid/commit/d1a90afd85822eca4e911abbce6b5c869acfbbf0)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#1279](https://github.com/ghiscoding/aurelia-slickgrid/issues/1279)) ([0af14d2](https://github.com/ghiscoding/aurelia-slickgrid/commit/0af14d23c2ec9c9f314126aea3ac14af9c16336f)) - by @renovate-bot
* more styling fixes after switching to `@use` instead of `@import` ([#1281](https://github.com/ghiscoding/aurelia-slickgrid/issues/1281)) ([00acc4a](https://github.com/ghiscoding/aurelia-slickgrid/commit/00acc4a86035ab908b566c1b5f2f42edbe975a40)) - by @ghiscoding

## [8.9.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.8.0...v8.9.0) (2024-10-19)

### Features

* allow providing a Custom Pagination Component ([#1275](https://github.com/ghiscoding/aurelia-slickgrid/issues/1275)) ([247aa56](https://github.com/ghiscoding/aurelia-slickgrid/commit/247aa56229098041de9dd8a9dc99c70dd9b31ee9)) - by @ghiscoding

### Bug Fixes

* **deps:** update Aurelia 2.Beta 22 ([#1270](https://github.com/ghiscoding/aurelia-slickgrid/issues/1270)) ([7d8ae06](https://github.com/ghiscoding/aurelia-slickgrid/commit/7d8ae06acd91e5e9251d221445f8dc5a3851d04c)) - by @ghiscoding
* improve project exports & types ([3786f34](https://github.com/ghiscoding/aurelia-slickgrid/commit/3786f343cc565cab270df09717d3cc5d521b10fe)) - by @ghiscoding
* Row Detail redraw all Views when GridMenu/ColPicker columns changes ([#1277](https://github.com/ghiscoding/aurelia-slickgrid/issues/1277)) ([8f549b0](https://github.com/ghiscoding/aurelia-slickgrid/commit/8f549b0e83d5e228e1e6ddd65bb57c0c4e81ef9b)) - by @ghiscoding

### Reverts

* Revert "fix: redraw all open row details whenever the grid is re-rendered (#1…" (#1276) ([8527bb2](https://github.com/ghiscoding/aurelia-slickgrid/commit/8527bb2494e4baa8c77a049cb2e920d63c6b7a60)), closes [#1](https://github.com/ghiscoding/aurelia-slickgrid/issues/1) [#1276](https://github.com/ghiscoding/aurelia-slickgrid/issues/1276) - by @ghiscoding

## [8.8.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.7.0...v8.8.0) (2024-09-29)

### Features

* option to improve Date Sorting by pre-parsing date items only once ([#1268](https://github.com/ghiscoding/aurelia-slickgrid/issues/1268)) ([3161d98](https://github.com/ghiscoding/aurelia-slickgrid/commit/3161d98adb1ae19887f170a42f93a4e5a1389803)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#1267](https://github.com/ghiscoding/aurelia-slickgrid/issues/1267)) ([64f3cb2](https://github.com/ghiscoding/aurelia-slickgrid/commit/64f3cb24e0867a0a9ab5a8fc8bd1310445d3354f)) - by @renovate-bot
* redraw all open row details whenever the grid is re-rendered ([#1269](https://github.com/ghiscoding/aurelia-slickgrid/issues/1269)) ([4ecb439](https://github.com/ghiscoding/aurelia-slickgrid/commit/4ecb4393a8033ddc4c0f68a2c6242dc6cb0da21f)) - by @ghiscoding

## [8.7.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.6.2...v8.7.0) (2024-09-14)

### Bug Fixes

* sort imports ([21fca2d](https://github.com/ghiscoding/aurelia-slickgrid/commit/21fca2dc331903265fdc2d5574adc5af527ea127)) - by @ghiscoding

## [8.6.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.6.1...v8.6.2) (2024-09-14)

### Performance Improvements

* don't invalidate grid rows more than once ([#1265](https://github.com/ghiscoding/aurelia-slickgrid/issues/1265)) ([740995c](https://github.com/ghiscoding/aurelia-slickgrid/commit/740995c5a7d7b12c2da157f39d9f98568e945cef)) - by @ghiscoding
* upgrade Slickgrid-Universal with perf improvements ([#1266](https://github.com/ghiscoding/aurelia-slickgrid/issues/1266)) ([f56b0c8](https://github.com/ghiscoding/aurelia-slickgrid/commit/f56b0c87f0f5d077e0d38cb107ea863e5c401d4b)) - by @ghiscoding

## [8.6.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.6.0...v8.6.1) (2024-08-31)

### Bug Fixes

* unflattening tree->flat array multiple times ([#1260](https://github.com/ghiscoding/aurelia-slickgrid/issues/1260)) ([a636297](https://github.com/ghiscoding/aurelia-slickgrid/commit/a6362978e0db52f101e84409edecf077bf9e0582)) - by @ghiscoding

## [8.6.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.5.2...v8.6.0) (2024-08-24)

### Features

* migrate back to Vanilla-Calendar-Pro ([#1256](https://github.com/ghiscoding/aurelia-slickgrid/issues/1256)) ([40f2c34](https://github.com/ghiscoding/aurelia-slickgrid/commit/40f2c346415a3f19917ec9667856a3a05e8df798)) - by @ghiscoding

### Bug Fixes

* register RowDetail and dispose of it only once ([#1253](https://github.com/ghiscoding/aurelia-slickgrid/issues/1253)) ([d598c6d](https://github.com/ghiscoding/aurelia-slickgrid/commit/d598c6d2a6e53255eb9b9b6361c3e9e465e6c3a7)) - by @ghiscoding

## [8.5.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.5.1...v8.5.2) (2024-08-17)

### Bug Fixes

* use setTimeout/setInterval from window object with correct TS type ([#1252](https://github.com/ghiscoding/aurelia-slickgrid/issues/1252)) ([f272174](https://github.com/ghiscoding/aurelia-slickgrid/commit/f27217482cbea03885da23feb23a29d152b214db)) - by @ghiscoding

## [8.5.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.5.0...v8.5.1) (2024-08-17)

### Bug Fixes

* **deps:** update all non-major dependencies ([#1249](https://github.com/ghiscoding/aurelia-slickgrid/issues/1249)) ([e439c05](https://github.com/ghiscoding/aurelia-slickgrid/commit/e439c05c3af2d8e0e9c89bd9e415cfe2e330325e)) - by @renovate-bot
* Tree Data should work without initial sort ([#1251](https://github.com/ghiscoding/aurelia-slickgrid/issues/1251)) ([98546d0](https://github.com/ghiscoding/aurelia-slickgrid/commit/98546d063c29a5611b26780861ec349c1d9ae046)) - by @ghiscoding

## [8.5.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.4.0...v8.5.0) (2024-08-07)

### Features

* Infinite Scroll for Backend Services (OData/GraphQL) ([#1244](https://github.com/ghiscoding/aurelia-slickgrid/issues/1244)) ([c19ddbb](https://github.com/ghiscoding/aurelia-slickgrid/commit/c19ddbb37b72ea79430a1bb0a46e9151ec2874c7)) - by @ghiscoding

## [8.4.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.3.2...v8.4.0) (2024-07-20)

### Features

* add `columnPickerLabel` for custom label ([#1239](https://github.com/ghiscoding/aurelia-slickgrid/issues/1239)) ([a83e958](https://github.com/ghiscoding/aurelia-slickgrid/commit/a83e958eb86d0d07bde5058ffeff1613d21d4644)) - by @ghiscoding

### Bug Fixes

* `filterQueryOverride` provide all search values ([#1238](https://github.com/ghiscoding/aurelia-slickgrid/issues/1238)) ([0c2aea3](https://github.com/ghiscoding/aurelia-slickgrid/commit/0c2aea374b220bdffea11da81d0005710808d9c1)) - by @ghiscoding

## [8.3.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.3.1...v8.3.2) (2024-07-13)

### Bug Fixes

* SASS warnings & other unit test fixes ([#1235](https://github.com/ghiscoding/aurelia-slickgrid/issues/1235)) ([7b9965a](https://github.com/ghiscoding/aurelia-slickgrid/commit/7b9965a07f94a7ce8f0e28d7ffa5efa91b355e09)) - by @ghiscoding

## [8.3.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.3.0...v8.3.1) (2024-07-06)

### Bug Fixes

* Composite Editor should work with Cell Menu ([#1230](https://github.com/ghiscoding/aurelia-slickgrid/issues/1230)) ([f799cf9](https://github.com/ghiscoding/aurelia-slickgrid/commit/f799cf911a8c4c3922be5c14b1e61aa1dab0895f)) - by @ghiscoding

## [8.3.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.2.0...v8.3.0) (2024-06-29)

### Features

* add onPreHeaderContextMenu for Column Picker usage ([#1228](https://github.com/ghiscoding/aurelia-slickgrid/issues/1228)) ([fc43fa8](https://github.com/ghiscoding/aurelia-slickgrid/commit/fc43fa89dd75d3940cb07ad1892585a5c73c8dcf)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#1226](https://github.com/ghiscoding/aurelia-slickgrid/issues/1226)) ([c98dd52](https://github.com/ghiscoding/aurelia-slickgrid/commit/c98dd52a8bfb86a2589a521fb0417cb0e0011338)) - by @renovate-bot

## [8.2.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.1.0...v8.2.0) (2024-06-18)

### Features

* add new optional `filterShortcuts` to Column Filter ([#1223](https://github.com/ghiscoding/aurelia-slickgrid/issues/1223)) ([d4b1e28](https://github.com/ghiscoding/aurelia-slickgrid/commit/d4b1e281f64ebde50d939e1410ba9ecc3aa4ebd5)) - by @ghiscoding

## [8.1.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.0.1...v8.1.0) (2024-06-08)

### Features

* add a `filterPredicate` option for user customization ([#1213](https://github.com/ghiscoding/aurelia-slickgrid/issues/1213)) ([9caf80e](https://github.com/ghiscoding/aurelia-slickgrid/commit/9caf80ed58e12a904532027662c67490e5b67f5f)) - by @ghiscoding
* add optional Top-Header for Draggable Grouping & Header Grouping ([#1219](https://github.com/ghiscoding/aurelia-slickgrid/issues/1219)) ([3e555f5](https://github.com/ghiscoding/aurelia-slickgrid/commit/3e555f53c137563eba4a5ddf80aae830f12f7617)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#1207](https://github.com/ghiscoding/aurelia-slickgrid/issues/1207)) ([c3bb68e](https://github.com/ghiscoding/aurelia-slickgrid/commit/c3bb68e797dd5b241737cc2017b49eb1a049c3f0)) - by @renovate-bot
* using caret `^` to get latest Aurelia 2 Beta 17 version ([#1206](https://github.com/ghiscoding/aurelia-slickgrid/issues/1206)) ([e1d412d](https://github.com/ghiscoding/aurelia-slickgrid/commit/e1d412dfa9f215b3b1161a8c28b1e442d46015fa)) - by @ghiscoding

## [8.0.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v8.0.0...v8.0.1) (2024-05-12)

### Bug Fixes

* small styling issues & better primary color support w/Dark Mode ([#1204](https://github.com/ghiscoding/aurelia-slickgrid/issues/1204)) ([9636a5b](https://github.com/ghiscoding/aurelia-slickgrid/commit/9636a5bdbb5a5fdbfebc5c1a54e54d412361c344)) - by @ghiscoding

## [8.0.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v7.7.0...v8.0.0) (2024-05-10)

### ⚠ BREAKING CHANGES

* pure SVG icons, Moment to Tempo, Flatpickr to Vanilla-Calendar (#1203)
* make DOMPurify as optional (#1195)
* migrate from Moment to Tempo (#1194)
* remove Font-Awesome and use new SVG icons (#1191)
* **common:** migrate from Flatpickr to Vanilla-Calendar (#1193)

### Features

* **common:** migrate from Flatpickr to Vanilla-Calendar ([#1193](https://github.com/ghiscoding/aurelia-slickgrid/issues/1193)) ([27ee287](https://github.com/ghiscoding/aurelia-slickgrid/commit/27ee2873ad7f11b802169c599bd338706138c7bd)) - by @ghiscoding
* make DOMPurify as optional ([#1195](https://github.com/ghiscoding/aurelia-slickgrid/issues/1195)) ([5a84ff8](https://github.com/ghiscoding/aurelia-slickgrid/commit/5a84ff81d8b6d2e2321b4b219391eae38e42cdd0)) - by @ghiscoding
* migrate from Moment to Tempo ([#1194](https://github.com/ghiscoding/aurelia-slickgrid/issues/1194)) ([58831dd](https://github.com/ghiscoding/aurelia-slickgrid/commit/58831dd3fa8a9a7a70b3bd590ef234aca96bfcce)) - by @ghiscoding
* pure SVG icons, Moment to Tempo, Flatpickr to Vanilla-Calendar ([#1203](https://github.com/ghiscoding/aurelia-slickgrid/issues/1203)) ([8a11310](https://github.com/ghiscoding/aurelia-slickgrid/commit/8a113105ead1f164e4bc2eb17e8d772b573c1b2f)) - by @ghiscoding
* remove Font-Awesome and use new SVG icons ([#1191](https://github.com/ghiscoding/aurelia-slickgrid/issues/1191)) ([6f7b6fe](https://github.com/ghiscoding/aurelia-slickgrid/commit/6f7b6fe632ea080cbf81c6f2a63c5de80592a541)) - by @ghiscoding

### Bug Fixes

* we shouldn't always commit on focusout/blur ([#1192](https://github.com/ghiscoding/aurelia-slickgrid/issues/1192)) ([5b9b543](https://github.com/ghiscoding/aurelia-slickgrid/commit/5b9b54382cce9df559289a05b7ea4b49f14062f6)) - by @ghiscoding

# [7.7.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v7.6.1...v7.7.0) (2024-04-20)

### Features

* add global `defaultEditorOptions` & `defaultFilterOptions` ([#1183](https://github.com/ghiscoding/aurelia-slickgrid/issues/1183)) ([eefca81](https://github.com/ghiscoding/aurelia-slickgrid/commit/eefca818d6819046572fe969778ab8b7f659435c)) - by @ghiscoding

## [7.6.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v7.6.0...v7.6.1) (2024-04-01)

### Bug Fixes

* allow multiple tooltips per grid cell ([#1176](https://github.com/ghiscoding/aurelia-slickgrid/issues/1176)) ([8fbf543](https://github.com/ghiscoding/aurelia-slickgrid/commit/8fbf5438c2a4672a13f843460e201f3d21053152)) - by @ghiscoding

# [7.6.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v7.5.0...v7.6.0) (2024-03-23)

### Bug Fixes

* hide Toggle Dark Mode from Grid Menu by default ([#1167](https://github.com/ghiscoding/aurelia-slickgrid/issues/1167)) ([f9be216](https://github.com/ghiscoding/aurelia-slickgrid/commit/f9be2165ba3bf83cc348f3c8930b38b285b181fa)) - by @ghiscoding

### Features

* rename SG `editorClass` & deprecate `internalColumnEditor` ([#1168](https://github.com/ghiscoding/aurelia-slickgrid/issues/1168)) ([bb958ff](https://github.com/ghiscoding/aurelia-slickgrid/commit/bb958ff42f69aa12fafdef37d173d2b34ef01a2c)) - by @ghiscoding

# [7.5.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v7.4.1...v7.5.0) (2024-03-05)

### Bug Fixes

* remove width style on grid container for CSP safe ([03acd4a](https://github.com/ghiscoding/aurelia-slickgrid/commit/03acd4a7c3874734f7f6de72b27c2f5c39034a0c)) - by @ghiscoding
* switch to `isomorphic-dompurify` for SSR support ([#1164](https://github.com/ghiscoding/aurelia-slickgrid/issues/1164)) ([8ebeed2](https://github.com/ghiscoding/aurelia-slickgrid/commit/8ebeed25252d49b50bbe0ef512d486d33f253028)), closes [/github.com/ghiscoding/Angular-Slickgrid/discussions/838#discussioncomment-8574215](https://github.com//github.com/ghiscoding/Angular-Slickgrid/discussions/838/issues/discussioncomment-8574215) - by @ghiscoding

### Features

* add Dark Mode grid option ([#1163](https://github.com/ghiscoding/aurelia-slickgrid/issues/1163)) ([2dc9e1d](https://github.com/ghiscoding/aurelia-slickgrid/commit/2dc9e1d5ed160cab5d4f67318e866ed0fc551e9f)) - by @ghiscoding

## [7.4.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v7.4.0...v7.4.1) (2024-02-13)

### Bug Fixes

* update to latest Slickgrid-Universal v4.4.1 ([44f933e](https://github.com/ghiscoding/aurelia-slickgrid/commit/44f933ec6dc3b2306f5139b63eeb68777aacfdcb)) - by @ghiscoding

# [7.4.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v7.3.1...v7.4.0) (2024-02-13)

### Features

* **ExcelExport:** migrate to Excel-Builder-Vanilla (ESM) ([#1157](https://github.com/ghiscoding/aurelia-slickgrid/issues/1157)) ([92e24a4](https://github.com/ghiscoding/aurelia-slickgrid/commit/92e24a49a72b21e0c9d9fed22e6606c82112f64b)) - by @ghiscoding

## [7.3.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v7.3.0...v7.3.1) (2024-01-27)

### Performance Improvements

* decrease number of calls to translate all extensions only once ([#1151](https://github.com/ghiscoding/aurelia-slickgrid/issues/1151)) ([97966a1](https://github.com/ghiscoding/aurelia-slickgrid/commit/97966a1c2cd406f6826d0283d23e620ac7c2bdc4)) - by @ghiscoding

# [7.3.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v7.2.1...v7.3.0) (2024-01-21)

### Features

* **plugin:** new Row Based Editing ([#1150](https://github.com/ghiscoding/aurelia-slickgrid/issues/1150)) ([9baf115](https://github.com/ghiscoding/aurelia-slickgrid/commit/9baf115cf6b5ba15014e5a2d9b99282dbbca349a)) - by @ghiscoding

### Performance Improvements

* **resizer:** `autosizeColumns` is called too many times on page load ([#1148](https://github.com/ghiscoding/aurelia-slickgrid/issues/1148)) ([f4f64b3](https://github.com/ghiscoding/aurelia-slickgrid/commit/f4f64b37127054d32326d9c2c497752462e2a1a0)) - by @ghiscoding

## [7.2.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v7.2.0...v7.2.1) (2023-12-30)

### Bug Fixes

* sync row defatil grid option to fix build ([#1138](https://github.com/ghiscoding/aurelia-slickgrid/issues/1138)) ([f51220f](https://github.com/ghiscoding/aurelia-slickgrid/commit/f51220fd66d5426bafca7765d13be2bd203a255d)) - by @ghiscoding

# [7.2.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v7.1.0...v7.2.0) (2023-12-30)

### Features

* (re)add option to cancel Row Detail opening ([#1136](https://github.com/ghiscoding/aurelia-slickgrid/issues/1136)) ([b4980ec](https://github.com/ghiscoding/aurelia-slickgrid/commit/b4980ecf93493c791c244f39ea3e88f9ab5470a1)) - by @ghiscoding

# [7.1.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v7.0.3...v7.1.0) (2023-12-21)

### Bug Fixes

* I18N could be optional when providing single locale ([#1129](https://github.com/ghiscoding/aurelia-slickgrid/issues/1129)) ([94fcfce](https://github.com/ghiscoding/aurelia-slickgrid/commit/94fcfce9d6dbfdee9033b50c7a8074fd76a04df4)) - by @ghiscoding

### Features

* reimplement highlight row, node-extend & fix few issues ([#1134](https://github.com/ghiscoding/aurelia-slickgrid/issues/1134)) ([c047781](https://github.com/ghiscoding/aurelia-slickgrid/commit/c047781245dbe7a825651c57a03eaa3f99f62e0d)) - by @ghiscoding

## [7.0.3](https://github.com/ghiscoding/aurelia-slickgrid/compare/v7.0.2...v7.0.3) (2023-12-19)

## [7.0.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v7.0.1...v7.0.2) (2023-12-16)

### Bug Fixes

* add missing types in pkg and fix cjs/esm exports ([17eb5e8](https://github.com/ghiscoding/aurelia-slickgrid/commit/17eb5e8ae92220870761e3c40404d3d6e140b310))

## [7.0.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v7.0.0...v7.0.1) (2023-12-15)

### Bug Fixes

* spreading 2 grids options causes duplicate ext resources ([#1126](https://github.com/ghiscoding/aurelia-slickgrid/issues/1126)) ([00a0be2](https://github.com/ghiscoding/aurelia-slickgrid/commit/00a0be22ea0cd95a759bd02592b19ad52f2049b5))

# [7.0.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v6.6.5...v7.0.0) (2023-12-15)

* BREAKING CHANGE: migrate to Slickgrid-Universal v4.0 and Aurelia 2, fixes #709 (#1124) ([8d0aa70](https://github.com/ghiscoding/aurelia-slickgrid/commit/8d0aa70f582f7f1dadaded0b2042e2a80d8759ea)), closes [#709](https://github.com/ghiscoding/aurelia-slickgrid/issues/709) [#1124](https://github.com/ghiscoding/aurelia-slickgrid/issues/1124)

### BREAKING CHANGES

* migrate to Slickgrid-Universal v4.0 and Aurelia 2, fixes #709

# Change Log

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.6.4](https://github.com/ghiscoding/aurelia-slickgrid/compare/v6.6.3...v6.6.4) (2023-12-08)

### Features

* introduce `devMode` to support nodejs based unit testing ([#1123](https://github.com/ghiscoding/aurelia-slickgrid/issues/1123)) ([dd61a39](https://github.com/ghiscoding/aurelia-slickgrid/commit/dd61a390dac4cf9efbc0d84198fcb1a9321d6626))

## [6.6.3](https://github.com/ghiscoding/aurelia-slickgrid/compare/v6.6.2...v6.6.3) (2023-12-08)

### Bug Fixes

* registered external resouces should keep singleton ref ([#1118](https://github.com/ghiscoding/aurelia-slickgrid/issues/1118)) ([fc3bdd6](https://github.com/ghiscoding/aurelia-slickgrid/commit/fc3bdd69762c51476d9582e836b9fadc2eee0d76))

## [6.6.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v6.6.1...v6.6.2) (2023-11-26)

# Change Log

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.6.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v6.5.1...v6.6.0) (2023-11-26)

### Features

* **GraphQL:** .excludeFieldFromQuery, exclude field but keep fields ([#1117](https://github.com/ghiscoding/aurelia-slickgrid/issues/1117)) ([6865408](https://github.com/ghiscoding/aurelia-slickgrid/commit/6865408763766d798943cadc8d8d0b35859094ab))

## [6.5.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v6.5.0...v6.5.1) (2023-11-13)

### Bug Fixes

* add ms-select-vanilla missing type & improve pkg exports ([#1114](https://github.com/ghiscoding/aurelia-slickgrid/issues/1114)) ([ea02c54](https://github.com/ghiscoding/aurelia-slickgrid/commit/ea02c54b14c5a4cd658a947f7447d5fb163dc3a0)), closes [#1313](https://github.com/ghiscoding/aurelia-slickgrid/issues/1313)
* improve build & types exports for all targets, Node, CJS/ESM ([#1113](https://github.com/ghiscoding/aurelia-slickgrid/issues/1113)) ([2cbfc68](https://github.com/ghiscoding/aurelia-slickgrid/commit/2cbfc68a00a39b16240a6dc8977a7fdb03433b03))

# [6.5.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v6.4.0...v6.5.0) (2023-11-11)

### Bug Fixes

* SlickCellRangeSelector stopped event bubbling in editor ([#1110](https://github.com/ghiscoding/aurelia-slickgrid/issues/1110)) ([17a6ee0](https://github.com/ghiscoding/aurelia-slickgrid/commit/17a6ee016e8c93bbb122e05017be87d78e0940b7))

# [6.4.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v6.3.1...v6.4.0) (2023-11-02)

### Bug Fixes

* remove unused code editor files from npm publish ([1379f60](https://github.com/ghiscoding/aurelia-slickgrid/commit/1379f60967c1ba7293778b4be5a50c5a1f9ebeec))

### Features

* add sub-menus to all Menu extensions/plugins ([#1103](https://github.com/ghiscoding/aurelia-slickgrid/issues/1103)) ([e55fa67](https://github.com/ghiscoding/aurelia-slickgrid/commit/e55fa6733f88e91dcb5320bd2448075093ffd0cd))
* update GraphQL demo with cursor pagination ([#1104](https://github.com/ghiscoding/aurelia-slickgrid/issues/1104)) ([c735465](https://github.com/ghiscoding/aurelia-slickgrid/commit/c735465ae35ddbfcf7b37fb893b42869ee723202))

## [6.3.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v6.3.0...v6.3.1) (2023-10-07)

### Bug Fixes

* **graphql:** column with complex object could throw null pointer exception ([#1091](https://github.com/ghiscoding/aurelia-slickgrid/issues/1091)) ([f26ee4b](https://github.com/ghiscoding/aurelia-slickgrid/commit/f26ee4b32d5d6072cfdf7593274b5b24499d64d1))

# [6.3.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v6.2.2...v6.3.0) (2023-10-05)

### Features

* add pageUp/pageDown/home/end to SlickCellSelection ([#1088](https://github.com/ghiscoding/aurelia-slickgrid/issues/1088)) ([411ccb6](https://github.com/ghiscoding/aurelia-slickgrid/commit/411ccb64d52d6dbb7506f764911a29226e86bbc9))

## [6.2.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v6.2.1...v6.2.2) (2023-09-24)

### Bug Fixes

* bump Slickgrid-Universal w/auto-resize w/o container ([#1079](https://github.com/ghiscoding/aurelia-slickgrid/issues/1079)) ([1141ede](https://github.com/ghiscoding/aurelia-slickgrid/commit/1141edef7c63bb6680382d6e3c3397737c19b8a8))

### Reverts

* Revert "chore(deps): update codecov/codecov-action action to v4 (#1069)" (#1071) ([0f90a1d](https://github.com/ghiscoding/aurelia-slickgrid/commit/0f90a1de5dbb41633245a80849d1ced2f84122ce)), closes [#1069](https://github.com/ghiscoding/aurelia-slickgrid/issues/1069) [#1071](https://github.com/ghiscoding/aurelia-slickgrid/issues/1071)

## [6.2.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v6.2.0...v6.2.1) (2023-09-05)

### Bug Fixes

* **common:** Select Filter/Editor enableRenderHtml invalid displays ([#1060](https://github.com/ghiscoding/aurelia-slickgrid/issues/1060)) ([42b5f78](https://github.com/ghiscoding/aurelia-slickgrid/commit/42b5f787ef7ad10a04b4da275a11ccf05a09ac29))

# [6.2.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v6.1.0...v6.2.0) (2023-08-21)

### Bug Fixes

* adding dataset hierarchical item shouldn't cause scroll flickering ([#1044](https://github.com/ghiscoding/aurelia-slickgrid/issues/1044)) ([ddcfb35](https://github.com/ghiscoding/aurelia-slickgrid/commit/ddcfb352082fdab8ebad84a701945ab82617dcb5))

### Features

* **TreeData:** add optional Aggregators for Tree Data totals calc ([#1048](https://github.com/ghiscoding/aurelia-slickgrid/issues/1048)) ([3abea9e](https://github.com/ghiscoding/aurelia-slickgrid/commit/3abea9ee4650a49e38bf216526642b282f1ee840))

# [6.1.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v6.0.1...v6.1.0) (2023-07-21)

### Features

* **common:** add optional `scrollIntoView` to GridService `addItems` ([#1027](https://github.com/ghiscoding/aurelia-slickgrid/issues/1027)) ([7b426bd](https://github.com/ghiscoding/aurelia-slickgrid/commit/7b426bd43ee0230e12ea51fcf14ba2b862729717))

## [6.0.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v6.0.0...v6.0.1) (2023-07-01)

### Bug Fixes

* **grouping:** DraggableGrouping could throw when leaving page ([#1004](https://github.com/ghiscoding/aurelia-slickgrid/issues/1004)) ([7cfb864](https://github.com/ghiscoding/aurelia-slickgrid/commit/7cfb864c15d3953a8d9214f571953778bcb3d4d3))

# [6.0.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v5.6.4...v6.0.0) (2023-05-29)

### Follow the [Migration 6.x Guide](https://github.com/ghiscoding/aurelia-slickgrid/wiki/Migration-to-6.x)

### ⚠ BREAKING CHANGES

* drop jQuery requirement & use ms-select-vanilla dependency (#981) (#983)

## [5.6.4](https://github.com/ghiscoding/aurelia-slickgrid/compare/v5.6.3...v5.6.4) (2023-05-20)

### Bug Fixes

* **export:** fix negative number exports to Excel ([#980](https://github.com/ghiscoding/aurelia-slickgrid/issues/980)) ([021b534](https://github.com/ghiscoding/aurelia-slickgrid/commit/021b534d076fb6e85c92c7aa455a8070aaa1d918))

## [5.6.3](https://github.com/ghiscoding/aurelia-slickgrid/compare/v5.6.2...v5.6.3) (2023-03-23)

### Bug Fixes

* **deps:** update all non-major dependencies to ~2.6.3 ([#954](https://github.com/ghiscoding/aurelia-slickgrid/issues/954)) ([3331db9](https://github.com/ghiscoding/aurelia-slickgrid/commit/3331db94fd03e10ebbc9f068e374478ab12b6b4e))
* **presets:** dynamic columns should be auto-inserted with Grid Presets ([#955](https://github.com/ghiscoding/aurelia-slickgrid/issues/955)) ([ea47f46](https://github.com/ghiscoding/aurelia-slickgrid/commit/ea47f469027f6e75e2ec63d832caf15bf124c7a9))

## [5.6.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v5.6.1...v5.6.2) (2023-03-03)

### Bug Fixes

* draggable grouping shouldn't throw when dynamically changing cols ([#945](https://github.com/ghiscoding/aurelia-slickgrid/issues/945)) ([025196c](https://github.com/ghiscoding/aurelia-slickgrid/commit/025196c7b624e751528a7652aebcc1e0bf338a98))

## [5.6.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v5.6.0...v5.6.1) (2023-02-24)

### Bug Fixes

* **common:** remove jQuery import to avoid duplicate jQuery load ([60bf262](https://github.com/ghiscoding/aurelia-slickgrid/commit/60bf262f5dfd0986d1ec165b9fe78d357a989ee0))

# [5.6.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v5.5.0...v5.6.0) (2023-02-24)

### Bug Fixes

* regression Edit cell mouseout should save & excel copy should work ([#941](https://github.com/ghiscoding/aurelia-slickgrid/issues/941)) ([2fa2761](https://github.com/ghiscoding/aurelia-slickgrid/commit/2fa276161a939082c08da5f010476795660e2a39)), closes [#1103](https://github.com/ghiscoding/aurelia-slickgrid/issues/1103)

# Change Log

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.5.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v5.4.0...v5.5.0) (2023-02-17)

### Bug Fixes

* **deps:** update dependency dompurify to v3 ([#935](https://github.com/ghiscoding/aurelia-slickgrid/issues/935)) ([0b3a8f5](https://github.com/ghiscoding/aurelia-slickgrid/commit/0b3a8f55ad865addc4940dc5fd9c185cf28ac05e))
* **RowDetail:** Row Detail extension should work with editable grid ([#938](https://github.com/ghiscoding/aurelia-slickgrid/issues/938)) ([1786415](https://github.com/ghiscoding/aurelia-slickgrid/commit/1786415d63c8fb9011e47bb4559dffe333a599b0))
* use DOMPurify correct namespace for dts file ([#931](https://github.com/ghiscoding/aurelia-slickgrid/issues/931)) ([06f008a](https://github.com/ghiscoding/aurelia-slickgrid/commit/06f008ac2749f8a7fb4422dba78ca6657ce4f630))

# Change Log

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.4.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v5.3.0...v5.4.0) (2023-02-04)

### Features

* **dataView:** add option to apply row selection to all pages ([#930](https://github.com/ghiscoding/aurelia-slickgrid/issues/930)) ([38effc2](https://github.com/ghiscoding/aurelia-slickgrid/commit/38effc2fadf253d8f2fac9ef19bf31b79c7f7424))

# [5.3.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v5.2.2...v5.3.0) (2023-01-21)

## [5.2.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v5.2.1...v5.2.2) (2022-12-24)

### Bug Fixes

* **common:** cell selection in Firefox not working ([#918](https://github.com/ghiscoding/aurelia-slickgrid/issues/918)) ([fcda15a](https://github.com/ghiscoding/aurelia-slickgrid/commit/fcda15aa0f509214b6a709b7e614ff19ad266f13))

## [5.2.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v5.2.0...v5.2.1) (2022-12-22)

### Bug Fixes

* **styling:** make Grid Menu item full width instead of max-content ([5da05fb](https://github.com/ghiscoding/aurelia-slickgrid/commit/5da05fb7721261e265ce21f17120c1c24b9c49ee))

# [5.2.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v5.1.3...v5.2.0) (2022-12-22)

### Features

* **exports:** add auto-detect and Excel custom cell (column) styling ([#916](https://github.com/ghiscoding/aurelia-slickgrid/issues/916)) ([06d28d7](https://github.com/ghiscoding/aurelia-slickgrid/commit/06d28d7820b0ba9e534e9d9b544cc393b754c561))

# Change Log

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.1.3](https://github.com/ghiscoding/aurelia-slickgrid/compare/v5.1.2...v5.1.3) (2022-12-08)

### Bug Fixes

* **pinning:** cols reorder & freezing shouldn't affect order ([#909](https://github.com/ghiscoding/aurelia-slickgrid/issues/909)) ([426725d](https://github.com/ghiscoding/aurelia-slickgrid/commit/426725d63279133ca389a391235112ba8cb5c0d7))
* **sorting:** update Slickgrid-Universal, fixes date sort shuffling ([#914](https://github.com/ghiscoding/aurelia-slickgrid/issues/914)) ([e50c676](https://github.com/ghiscoding/aurelia-slickgrid/commit/e50c676ff512e6f8bafba2f78819bfccaafb4c2d))

## [5.1.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v5.1.1...v5.1.2) (2022-12-02)

### Bug Fixes

* **addons:** onGroupChanged callback should be executed with Draggable ([#903](https://github.com/ghiscoding/aurelia-slickgrid/issues/903)) ([ff57b64](https://github.com/ghiscoding/aurelia-slickgrid/commit/ff57b6426b81fa44964da69cb22f5ab51c1bc707))
* **core:** grid service `resetGrid` method wasn't always resetting ([#901](https://github.com/ghiscoding/aurelia-slickgrid/issues/901)) ([28de038](https://github.com/ghiscoding/aurelia-slickgrid/commit/28de0380fb3b80cb4ad8b81c1e9bf44aaa75bd31))

## [5.1.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v5.1.0...v5.1.1) (2022-11-19)

# [5.1.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v5.0.0...v5.1.0) (2022-11-17)

### Bug Fixes

* **deps:** move i18next as regular dependencies to avoid fulll install ([#875](https://github.com/ghiscoding/aurelia-slickgrid/issues/875)) ([b064d81](https://github.com/ghiscoding/aurelia-slickgrid/commit/b064d81454d238512c1ab21a3006647ce875c185))
* **deps:** update dependency dompurify to ^2.4.1 ([#891](https://github.com/ghiscoding/aurelia-slickgrid/issues/891)) ([7833109](https://github.com/ghiscoding/aurelia-slickgrid/commit/7833109a9ebed8e23b1dba2f6d40966b1de5d025))

### Features

* **common:** add "targetSelector" to onFilterChanged & Grid State ([#892](https://github.com/ghiscoding/aurelia-slickgrid/issues/892)) ([306f247](https://github.com/ghiscoding/aurelia-slickgrid/commit/306f247c5f1e1ad529b32b0ccc58db93d705be09))
* **core:** expose EventPubSub Service on AureliaGridInstance ([#879](https://github.com/ghiscoding/aurelia-slickgrid/issues/879)) ([015bc5b](https://github.com/ghiscoding/aurelia-slickgrid/commit/015bc5bb7cb03b57741bdcd7857218d886017e73))
* **filters:** add back Slider Range filter in pure JS ([#886](https://github.com/ghiscoding/aurelia-slickgrid/issues/886)) ([d3bff2d](https://github.com/ghiscoding/aurelia-slickgrid/commit/d3bff2d1657ff119429ecfb9d7a27476b5f497d3))
* **plugins:** sync column definitions to user after plugin adds column ([#881](https://github.com/ghiscoding/aurelia-slickgrid/issues/881)) ([e453905](https://github.com/ghiscoding/aurelia-slickgrid/commit/e453905a71e7589b20669e138a5c7a67128f71f3))

# [5.0.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v4.3.0...v5.0.0) (2022-10-18)

### Bug Fixes

* **demo:** edit outline should follow on filter/pagination changed ([#857](https://github.com/ghiscoding/aurelia-slickgrid/issues/857)) ([7a484d6](https://github.com/ghiscoding/aurelia-slickgrid/commit/7a484d6f54fe5254f0a26e7d51e5d34f13c8b62f))

### Features

* **core:** BREAKING CHANGE replace jQueryUI by SortableJS ([3c2f8e3](https://github.com/ghiscoding/aurelia-slickgrid/commit/3c2f8e3080a248a8399ceb6c7c6791866284a7ec))
* **deps:** BREAKING CHANGE upgrade `aurelia-i18n` to major v4 ([#828](https://github.com/ghiscoding/aurelia-slickgrid/issues/828)) ([d992286](https://github.com/ghiscoding/aurelia-slickgrid/commit/d99228628ee037266265fd3f07a6462131057b16))

# Change Log

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0-alpha.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v4.3.0...v5.0.0-alpha.0) (2022-10-16)

### Bug Fixes

* **demo:** edit outline should follow on filter/pagination changed ([#857](https://github.com/ghiscoding/aurelia-slickgrid/issues/857)) ([7a484d6](https://github.com/ghiscoding/aurelia-slickgrid/commit/7a484d6f54fe5254f0a26e7d51e5d34f13c8b62f))

### Features

* **deps:** BREAKING CHANGE upgrade `aurelia-i18n` to major v4 ([#828](https://github.com/ghiscoding/aurelia-slickgrid/issues/828)) ([d992286](https://github.com/ghiscoding/aurelia-slickgrid/commit/d99228628ee037266265fd3f07a6462131057b16))

## [4.3.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v4.2.4...v4.3.0) (2022-08-15)

### Bug Fixes

* **collectionAsync:** hidden column does not load edit field selection ([#855](https://github.com/ghiscoding/aurelia-slickgrid/issues/855)) ([d51b806](https://github.com/ghiscoding/aurelia-slickgrid/commit/d51b8069434286018fcf7b2a28d6cb44a4b58377))
* **deps:** switch from jquery-ui-dist to the official jquery-ui ([#856](https://github.com/ghiscoding/aurelia-slickgrid/issues/856)) ([4eebd14](https://github.com/ghiscoding/aurelia-slickgrid/commit/4eebd14594b5ce4fdd16c16957f4e74366ccdb6c))

### [4.2.4](https://github.com/ghiscoding/aurelia-slickgrid/compare/v4.2.3...v4.2.4) (2022-08-03)

### Bug Fixes

* **version:** update to latest Slickgrid-Universal versions ([#850](https://github.com/ghiscoding/aurelia-slickgrid/issues/850)) ([b9e2364](https://github.com/ghiscoding/aurelia-slickgrid/commit/b9e236473d5b403def40bb436096ded1692162df))

### [4.2.3](https://github.com/ghiscoding/aurelia-slickgrid/compare/v4.2.2...v4.2.3) (2022-07-28)

### Bug Fixes

* **deps:** loosen up RxJS min version to avoid interface out of sync ([1637175](https://github.com/ghiscoding/aurelia-slickgrid/commit/163717561f682aaad874a60476a3d0afc9d85368))
* **build:** use patch version when releasing from slickgrid-universal ([1637175](https://github.com/ghiscoding/aurelia-slickgrid/commit/163717561f682aaad874a60476a3d0afc9d85368))

### [4.2.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v4.2.1...v4.2.2) (2022-07-07)

### [4.2.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v4.2.0...v4.2.1) (2022-07-07)

## [4.2.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v4.1.3...v4.2.0) (2022-06-18)

### Features

* **core:** upgrade to jQuery 3.6 and jQuery-UI 1.13 ([#824](https://github.com/ghiscoding/aurelia-slickgrid/issues/824)) ([342ee33](https://github.com/ghiscoding/aurelia-slickgrid/commit/342ee339c5b329f98b067b68d4dbc177225399f5))

### Bug Fixes

* **core:** throw error when `gridOptions` missing in View ([#788](https://github.com/ghiscoding/aurelia-slickgrid/issues/788)) ([f57aa2b](https://github.com/ghiscoding/aurelia-slickgrid/commit/f57aa2b132e50453687b40aa46724c3466975819))

### [4.1.3](https://github.com/ghiscoding/aurelia-slickgrid/compare/v4.1.2...v4.1.3) (2022-04-28)

### Bug Fixes

* **deps:** remove unnecessary npm dependency ([d9c37da](https://github.com/ghiscoding/aurelia-slickgrid/commit/d9c37dad976da4e9fba254ab9fd74747eb6c361c))

### [4.1.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v4.1.1...v4.1.2) (2022-04-28)

### [4.1.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v4.1.0...v4.1.1) (2022-01-19)

### Bug Fixes

* **graphql:** fix range filtering with ".." ([#701](https://github.com/ghiscoding/aurelia-slickgrid/issues/701)) ([fd37034](https://github.com/ghiscoding/aurelia-slickgrid/commit/fd37034b67ffb41dc7e8ddfe45a7ff37a78dfd60))
* **odata:** fix range filtering with ".." ([#700](https://github.com/ghiscoding/aurelia-slickgrid/issues/700)) ([f9a6ac7](https://github.com/ghiscoding/aurelia-slickgrid/commit/f9a6ac715de9d7a8699aeb3e30ccd2298faf4e77))

## [4.1.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v4.0.0...v4.1.0) (2022-01-07)

### Features

* **demo:** add new Example 34 to demo Real-time Market Trading ([#690](https://github.com/ghiscoding/aurelia-slickgrid/issues/690)) ([6c76be9](https://github.com/ghiscoding/aurelia-slickgrid/commit/6c76be991345f2a85037dbc1dbc974fc02587a4f))
* **demo:** add new Example 34 to demo Realtime Trading ([#698](https://github.com/ghiscoding/aurelia-slickgrid/issues/698)) ([7820e39](https://github.com/ghiscoding/aurelia-slickgrid/commit/7820e3983191afecc085fa1591e89a38dbab6815))
* **OData:** add `$select` and `$expand` query options ([#697](https://github.com/ghiscoding/aurelia-slickgrid/issues/697)) ([5ced150](https://github.com/ghiscoding/aurelia-slickgrid/commit/5ced150998fa9e902fea8488e382d336204ce017)), closes [#588](https://github.com/ghiscoding/aurelia-slickgrid/issues/588)

## [4.0.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.12.1...v4.0.0) (2021-12-11)

### ⚠ BREAKING CHANGES

* add slick prefix to all SASS variables `$slick-`

* refactor(styling): use new cell menu minWidth default

* fix(styling): better support of auto width on drop menu

* feat(plugins): show bullet when command menu icon missing

* refactor: remove/replace all deprecated code

* fix: update with newer slick-menu common styling classes

* refacor: tweak with latest universal code

* chore(deps): upgrade to latest Slickgrid-Universal version

* tests: fix failing Cypress E2E test

* tests: comment failing Cypress E2E test

* BREAKING CHANGE: upgrade to Slickgrid-Universal official 1.x major version (#689) ([1caea1a](https://github.com/ghiscoding/aurelia-slickgrid/commit/1caea1aac3375d47914f500eaf17d4eb144d528a)), closes [#689](https://github.com/ghiscoding/aurelia-slickgrid/issues/689)

### [3.12.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.12.0...v3.12.1) (2021-11-16)

### Bug Fixes

* **extensions:** add missing DI in Grid Menu ([#672](https://github.com/ghiscoding/aurelia-slickgrid/issues/672)) ([96c15bd](https://github.com/ghiscoding/aurelia-slickgrid/commit/96c15bda9f1b9dc42743a448bf1aca6eb2ecc826))

## [3.12.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.11.0...v3.12.0) (2021-10-28)

### Features

* **plugin:** add example for new Custom Tooltip plugin ([#663](https://github.com/ghiscoding/aurelia-slickgrid/issues/663)) ([c61e3b0](https://github.com/ghiscoding/aurelia-slickgrid/commit/c61e3b0bf43895b6c284c2b9616730c6a579c789))
* **plugin:** add row move shadow item while moving/dragging row ([#664](https://github.com/ghiscoding/aurelia-slickgrid/issues/664)) ([d4dfff7](https://github.com/ghiscoding/aurelia-slickgrid/commit/d4dfff75f145e1250c2f1a7aed814eb790cdf0d8))

## [3.11.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.10.1...v3.11.0) (2021-09-29)

### Features

* **core:** use Slickgrid-Universal Pagination reusable component ([#656](https://github.com/ghiscoding/aurelia-slickgrid/issues/656)) ([4af5ac5](https://github.com/ghiscoding/aurelia-slickgrid/commit/4af5ac51152682023f0ba529c38a55977e463fcb))
* **tree:** demo new `excludeChildrenWhenFilteringTree` ([#657](https://github.com/ghiscoding/aurelia-slickgrid/issues/657)) ([0a6c8f5](https://github.com/ghiscoding/aurelia-slickgrid/commit/0a6c8f55ef3ac7d0bdd69906ec402565cad44bc0))

### [3.10.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.10.0...v3.10.1) (2021-09-09)

### Bug Fixes

* **export:** add missing PubSubService in DI ([32a724e](https://github.com/ghiscoding/aurelia-slickgrid/commit/32a724ed993ef03e7d30ce2fcfa5cd1448abedf8))

## [3.10.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.9.2...v3.10.0) (2021-09-09)

### Features

* **backend:** rollback on error & add cancellable events ([#647](https://github.com/ghiscoding/aurelia-slickgrid/issues/647)) ([4b28424](https://github.com/ghiscoding/aurelia-slickgrid/commit/4b2842408fefb8ddcb5aa1f71cd818b3decc3681))
* **tree:** add `dynamicallyToggledItemState` method to toggle parent(s) ([#649](https://github.com/ghiscoding/aurelia-slickgrid/issues/649)) ([7a48d2a](https://github.com/ghiscoding/aurelia-slickgrid/commit/7a48d2a9cd6d4f5f1ffd66a6652ed708052f3049))

### Bug Fixes

* **composite:** calling Edit change shouldn't affect Mass-Update ([#648](https://github.com/ghiscoding/aurelia-slickgrid/issues/648)) ([c35415c](https://github.com/ghiscoding/aurelia-slickgrid/commit/c35415c79b70fab4823ca7232b35401c2cf6d787))
* **footer:** use `getFilteredItemCount` to show correct item count ([#651](https://github.com/ghiscoding/aurelia-slickgrid/issues/651)) ([e93354c](https://github.com/ghiscoding/aurelia-slickgrid/commit/e93354c582ec4f50427159b058746851d58f2f2e))
* **grid:** invalidate grid after setItems to re-render grid ([#650](https://github.com/ghiscoding/aurelia-slickgrid/issues/650)) ([de5a906](https://github.com/ghiscoding/aurelia-slickgrid/commit/de5a906932ed236b128823805d03d8d8e05d58d7))
* **grouping:** Draggable Grouping should clear preheader when called ([#652](https://github.com/ghiscoding/aurelia-slickgrid/issues/652)) ([3b7a41a](https://github.com/ghiscoding/aurelia-slickgrid/commit/3b7a41a0b1cdebb090c19f909bef9ebe61c013c8))

### [3.9.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.9.1...v3.9.2) (2021-07-24)

### Bug Fixes

* **aurelia-slickgrid:** reference html explicitly ([#617](https://github.com/ghiscoding/aurelia-slickgrid/issues/617)) ([25a7218](https://github.com/ghiscoding/aurelia-slickgrid/commit/25a7218f749a1e45fd268fb6c58511d7f263e0c1))

### [3.9.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.9.0...v3.9.1) (2021-07-17)

## [3.9.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.8.0...v3.9.0) (2021-07-17)

### Bug Fixes

* **pagination:** should be able to toggle Pagination ([#616](https://github.com/ghiscoding/aurelia-slickgrid/issues/616)) ([77cf111](https://github.com/ghiscoding/aurelia-slickgrid/commit/77cf11166056f9edce5c7330c82168ee42b6bb34))
* **tree:** same dataset length but w/different prop should refresh Tree ([#612](https://github.com/ghiscoding/aurelia-slickgrid/issues/612)) ([425aa03](https://github.com/ghiscoding/aurelia-slickgrid/commit/425aa0310839e2f1106e4174dddc95e094751892))

## [3.8.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.7.1...v3.8.0) (2021-07-07)

### Features

* **footer:** reuse Footer Component from Slickgrid-Universal ([#609](https://github.com/ghiscoding/aurelia-slickgrid/issues/609)) ([a9a6c21](https://github.com/ghiscoding/aurelia-slickgrid/commit/a9a6c21e15e9eb96d2dab1e8a14af53e32262b88))
* **tree:** add Tree Data as Grid State/Presets ([#596](https://github.com/ghiscoding/aurelia-slickgrid/issues/596)) ([8670544](https://github.com/ghiscoding/aurelia-slickgrid/commit/86705443952b46cb74555310d9bf3566f77d31ae))

### Bug Fixes

* **demo:** we should be able to move row(s) and keep selections ([#587](https://github.com/ghiscoding/aurelia-slickgrid/issues/587)) ([ac36ed7](https://github.com/ghiscoding/aurelia-slickgrid/commit/ac36ed755d24f02ea3fedbe8a0302d859ea97f88))
* **formatters:** shouldn't auto-add editor formatter multiple times ([#595](https://github.com/ghiscoding/aurelia-slickgrid/issues/595)) ([695eac8](https://github.com/ghiscoding/aurelia-slickgrid/commit/695eac8122d002e1f42420f122057c288aea96c7))
* make sure dataset is array before getting his length ([6466671](https://github.com/ghiscoding/aurelia-slickgrid/commit/646667131c0d09ec1f6e6c2a45e560d085813272))
* **styling:** upgrade dart-sass to latest ([#590](https://github.com/ghiscoding/aurelia-slickgrid/issues/590)) ([d2af93a](https://github.com/ghiscoding/aurelia-slickgrid/commit/d2af93a9c9ca5221c65ec636d7e89879c6e0409a))

### [3.7.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.7.0...v3.7.1) (2021-05-23)

### Bug Fixes

* **build:** target es2017 instead of es2018 to fix aurelia-cli/requireJS ([7eeff02](https://github.com/ghiscoding/aurelia-slickgrid/commit/7eeff025057ae2548f1d8033132ef9265e93195a))

## [3.7.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.6.0...v3.7.0) (2021-05-23)

### Features

* **resizer:** add `resizeByContentOnlyOnFirstLoad` grid option ([#576](https://github.com/ghiscoding/aurelia-slickgrid/issues/576)) ([424aea4](https://github.com/ghiscoding/aurelia-slickgrid/commit/424aea469b1390b005335f5f3bc3cb5cd8ad39f7))
* **resizer:** add single Column Resize by Content dblClick & headerMenu ([#579](https://github.com/ghiscoding/aurelia-slickgrid/issues/579)) ([631465a](https://github.com/ghiscoding/aurelia-slickgrid/commit/631465a7dbdd35f961834993982dfc831ac2f726))

### Bug Fixes

* **backend:** able to preset filters on hidden columns & all queried ([#582](https://github.com/ghiscoding/aurelia-slickgrid/issues/582)) ([9953dd9](https://github.com/ghiscoding/aurelia-slickgrid/commit/9953dd9bd7a48dc527f5cdba967b72ded9f46823))
* **grid:** make sure dataset is an array before passing it to dataview ([bfd8344](https://github.com/ghiscoding/aurelia-slickgrid/commit/bfd8344f5651a8238c6da8f4b9386a0984998f0d))
* **presets:** loading columns presets should only be done once ([#577](https://github.com/ghiscoding/aurelia-slickgrid/issues/577)) ([91d0ea6](https://github.com/ghiscoding/aurelia-slickgrid/commit/91d0ea6fd637224d8dce3b69d25503720fa715df)), closes [#341](https://github.com/ghiscoding/aurelia-slickgrid/issues/341)
* **resizer:** fix a regression bug caused by previous PR ([#580](https://github.com/ghiscoding/aurelia-slickgrid/issues/580)) ([95185f0](https://github.com/ghiscoding/aurelia-slickgrid/commit/95185f06396cbf4c9130d40e5a52a6f677bff524))
* **resizer:** remove delay to call resize by content to avoid flickering ([#578](https://github.com/ghiscoding/aurelia-slickgrid/issues/578)) ([1661c7e](https://github.com/ghiscoding/aurelia-slickgrid/commit/1661c7e32290e625d0c5ae807f1635476f555667))
* **sorting:** multi-column sort shouldn't work when option is disabled ([#581](https://github.com/ghiscoding/aurelia-slickgrid/issues/581)) ([e752b2c](https://github.com/ghiscoding/aurelia-slickgrid/commit/e752b2ccddfac29627fb156517fff988b9b5f8ca))
* **tree:** few issues and huge improvement found in Tree Data ([#567](https://github.com/ghiscoding/aurelia-slickgrid/issues/567)) ([0febdf0](https://github.com/ghiscoding/aurelia-slickgrid/commit/0febdf00b4a48b55b670750bfe8b68a7b36c7ef7))

## [3.6.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.5.0...v3.6.0) (2021-04-28)

### Features

* **footer:** add row selection count to the footer component ([#563](https://github.com/ghiscoding/aurelia-slickgrid/issues/563)) ([dcf61f6](https://github.com/ghiscoding/aurelia-slickgrid/commit/dcf61f6b440648891a9ded15fe568292da2cff27))
* **resize:** add column resize by cell content ([#560](https://github.com/ghiscoding/aurelia-slickgrid/issues/560)) ([f5211c3](https://github.com/ghiscoding/aurelia-slickgrid/commit/f5211c398970ec90c47ea67f69506ac9a3985901))

### Bug Fixes

* **deps:** remove unused npm packages reported as security risk ([#562](https://github.com/ghiscoding/aurelia-slickgrid/issues/562)) ([12e420a](https://github.com/ghiscoding/aurelia-slickgrid/commit/12e420a9e582b545b5f29e33d4b95a9e8b323576))

## [3.5.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.4.0...v3.5.0) (2021-03-25)

### Features

* **build:** compile build with TSC strict mode enabled ([#539](https://github.com/ghiscoding/aurelia-slickgrid/issues/539)) ([483c4ba](https://github.com/ghiscoding/aurelia-slickgrid/commit/483c4ba57fd85edc0658aacbd7db1eb5aa83be65))
* **filters:** add optional `filterTypingDebounce` for filters w/keyup ([#538](https://github.com/ghiscoding/aurelia-slickgrid/issues/538)) ([66e7cfc](https://github.com/ghiscoding/aurelia-slickgrid/commit/66e7cfc01c53a26ac81c1ea3be939ef637a15d15))
* **resources:** add RxJS support via Slickgrid-Universal package ([#541](https://github.com/ghiscoding/aurelia-slickgrid/issues/541)) ([9c01edc](https://github.com/ghiscoding/aurelia-slickgrid/commit/9c01edcec5d74c43a13f1fe51ada4fb21ae63af9))
* **state:** add Pinning (frozen) to Grid State & Presets ([#543](https://github.com/ghiscoding/aurelia-slickgrid/issues/543)) ([cbd07d2](https://github.com/ghiscoding/aurelia-slickgrid/commit/cbd07d2b6851d8b0e697cb5a122386c80c0e6d28))

### Bug Fixes

* **metrics:** use `onRowCountChanged` event to refresh metrics ([#544](https://github.com/ghiscoding/aurelia-slickgrid/issues/544)) ([2f16407](https://github.com/ghiscoding/aurelia-slickgrid/commit/2f164077de2f946313d0be9c9fa70101b3e52d1e))
* **resizer:** allow gridHeight/Width to be passed as string, fixes [#284](https://github.com/ghiscoding/aurelia-slickgrid/issues/284) ([#535](https://github.com/ghiscoding/aurelia-slickgrid/issues/535)) ([f324071](https://github.com/ghiscoding/aurelia-slickgrid/commit/f3240717bbf5a818201655d78e27c483c6609580))
* **tests:** add Cypress tests to cover grid presets ([#542](https://github.com/ghiscoding/aurelia-slickgrid/issues/542)) ([ec24aed](https://github.com/ghiscoding/aurelia-slickgrid/commit/ec24aed90ed7ca460cb4d0de9e79538eeb9102c5))

## [3.4.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.3.1...v3.4.0) (2021-02-27)

### Features

* **editors:** add form/input reset to Composite Editor modal & fix touched value ([#529](https://github.com/ghiscoding/aurelia-slickgrid/issues/529)) ([9c17ba5](https://github.com/ghiscoding/aurelia-slickgrid/commit/9c17ba511f50224b984f6cf7215921a8e6be9763))
* **filters:** add updateSingleFilter for a single external filter ([#526](https://github.com/ghiscoding/aurelia-slickgrid/issues/526)) ([9abf86d](https://github.com/ghiscoding/aurelia-slickgrid/commit/9abf86da58450697030af3c671909b1c7b5db188))

### Bug Fixes

* **backend:** incorrect item count with GraphQL and useLocalFiltering ([#524](https://github.com/ghiscoding/aurelia-slickgrid/issues/524)) ([24f5a2e](https://github.com/ghiscoding/aurelia-slickgrid/commit/24f5a2e4f34255a9c15afa80ba7ecb5d152a2f28))
* **deps:** update typedoc to fix marked package security issue ([3c7125b](https://github.com/ghiscoding/aurelia-slickgrid/commit/3c7125b866979ba9b0e88638c845c1ef48331826))
* **deps:** update typedoc to fix marked package security issue ([#523](https://github.com/ghiscoding/aurelia-slickgrid/issues/523)) ([2ac1780](https://github.com/ghiscoding/aurelia-slickgrid/commit/2ac1780280e2476926f1ac3cc8ea99d547dd42b8))
* **examples:** multiple grids in tab should show be resized ([#525](https://github.com/ghiscoding/aurelia-slickgrid/issues/525)) ([daa0ea4](https://github.com/ghiscoding/aurelia-slickgrid/commit/daa0ea4a144cff00fef084fba57bda722a583860))
* **plugin:** recreate header menu when adding column dynamically ([#522](https://github.com/ghiscoding/aurelia-slickgrid/issues/522)) ([7e82343](https://github.com/ghiscoding/aurelia-slickgrid/commit/7e82343a9d5eae70da7bd4d24f3498f1092fcf00))

### [3.3.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.3.0...v3.3.1) (2021-01-29)

### Bug Fixes

* **components:** Composite Editor Clone was sometime throwing error ([#513](https://github.com/ghiscoding/aurelia-slickgrid/issues/513)) ([c284799](https://github.com/ghiscoding/aurelia-slickgrid/commit/c28479900b054c1979dd3afba79e436248a144ad))

## [3.3.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.2.1...v3.3.0) (2021-01-28)

### Features

* **editors:** add Clone functionality to Composite Editor ([#510](https://github.com/ghiscoding/aurelia-slickgrid/issues/510)) ([6eb972b](https://github.com/ghiscoding/aurelia-slickgrid/commit/6eb972b561f5cb5667bd678595915471fd57cdad))
* **formatters:** add grid option to auto add custom editor formatter ([#512](https://github.com/ghiscoding/aurelia-slickgrid/issues/512)) ([7952a5e](https://github.com/ghiscoding/aurelia-slickgrid/commit/7952a5e377e76289a0f41de76dc16bd230269236))

### Bug Fixes

* **comp:** empty data warning should work with autoheight grid ([#507](https://github.com/ghiscoding/aurelia-slickgrid/issues/507)) ([9d31098](https://github.com/ghiscoding/aurelia-slickgrid/commit/9d310988c153ab091e264f0fca66f188891911b3))
* **filters:** Grid State filters should always include an operator ([6c989c2](https://github.com/ghiscoding/aurelia-slickgrid/commit/6c989c2337b7d59a0c89339046f9ba257f0c286b))
* **metrics:** refresh metrics also when providing new data to DataView ([#508](https://github.com/ghiscoding/aurelia-slickgrid/issues/508)) ([2ce3bfc](https://github.com/ghiscoding/aurelia-slickgrid/commit/2ce3bfcc7b02732e285891d5a02946104a1da3f2))
* **metrics:** use onRowsOrCountChanged to refresh metrics ([#509](https://github.com/ghiscoding/aurelia-slickgrid/issues/509)) ([9df5974](https://github.com/ghiscoding/aurelia-slickgrid/commit/9df5974f5c1f4d55e4df2d16659a62b3dae6ae71))
* **plugins:** throw error when Tree Data used with Pagination ([#506](https://github.com/ghiscoding/aurelia-slickgrid/issues/506)) ([92789fc](https://github.com/ghiscoding/aurelia-slickgrid/commit/92789fc5764f7de27bfd0066604891350208f23c))

### [3.2.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.2.0...v3.2.1) (2021-01-07)

## [3.2.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.1.0...v3.2.0) (2021-01-07)

### Features

* **ci:** replace CircleCI by GitHub Actions ([#492](https://github.com/ghiscoding/aurelia-slickgrid/issues/492)) ([c7600e0](https://github.com/ghiscoding/aurelia-slickgrid/commit/c7600e0a29b358f27960f0b868da8ef931c68ecd))

### Bug Fixes

* **build:** import Flatpickr Locale on demand via regular imports ([#504](https://github.com/ghiscoding/aurelia-slickgrid/issues/504)) ([78239b6](https://github.com/ghiscoding/aurelia-slickgrid/commit/78239b637e8bbd68654798fd38dbbcf838c77e6e))
* **plugin:** Row Detail loses html content when used with Row Selection ([#503](https://github.com/ghiscoding/aurelia-slickgrid/issues/503)) ([5e3d067](https://github.com/ghiscoding/aurelia-slickgrid/commit/5e3d067237c747a618a76ff25352b39e2eef4b34))

## [3.1.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.0.2...v3.1.0) (2020-12-22)

### Features

* **core:** add Autocomplete/Select Filters collection watch ([#488](https://github.com/ghiscoding/aurelia-slickgrid/issues/488)) ([612fb68](https://github.com/ghiscoding/aurelia-slickgrid/commit/612fb682c88c81b4c0f204a93121fc0f21105b96))

### Bug Fixes

* **core:** use regular imports instead of require to load plugins ([#489](https://github.com/ghiscoding/aurelia-slickgrid/issues/489)) ([0f6ae07](https://github.com/ghiscoding/aurelia-slickgrid/commit/0f6ae0758baa70bdb283b3473a97a393f05dd4f7))

### [3.0.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.0.1...v3.0.2) (2020-12-20)

### [3.0.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v3.0.0...v3.0.1) (2020-12-20)

### [2.23.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.23.0...v2.23.1) (2020-12-05)

### Features

* **core:** add enableMouseWheelScrollHandler grid option ([#468](https://github.com/ghiscoding/aurelia-slickgrid/issues/468)) ([412b93d](https://github.com/ghiscoding/aurelia-slickgrid/commit/412b93db7c43a8ee5abc838874c778d4deebbd05)), closes [#618](https://github.com/ghiscoding/aurelia-slickgrid/issues/618) [#619](https://github.com/ghiscoding/aurelia-slickgrid/issues/619) [#555](https://github.com/ghiscoding/aurelia-slickgrid/issues/555)

### Bug Fixes

* **core:** showing/hiding column shouldn't affect its freezing position ([c2794cc](https://github.com/ghiscoding/aurelia-slickgrid/commit/c2794cc90296e7d160b3c6ea2548343cad5508d6))
* **formatters:** date US Formatters should accept ISO date input ([#467](https://github.com/ghiscoding/aurelia-slickgrid/issues/467)) ([fbffe5d](https://github.com/ghiscoding/aurelia-slickgrid/commit/fbffe5d08314e8a1b8292c43a3e15cb172a1396e))

## [2.23.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.22.2...v2.23.0) (2020-11-20)

### Features

* **chore:** update all npm packages and project to WebPack 4 ([#447](https://github.com/ghiscoding/aurelia-slickgrid/issues/447)) ([1f8daac](https://github.com/ghiscoding/aurelia-slickgrid/commit/1f8daac863c4a7075886688da74d614b53899649))
* **core:** add "Empty Data" warning message when grid is empty ([#458](https://github.com/ghiscoding/aurelia-slickgrid/issues/458)) ([5175fb6](https://github.com/ghiscoding/aurelia-slickgrid/commit/5175fb67da5ebd5d393e11753def638c55a954ca))
* **core:** switch to ESLint since TSLint was deprecated ([#452](https://github.com/ghiscoding/aurelia-slickgrid/issues/452)) ([95f6ca9](https://github.com/ghiscoding/aurelia-slickgrid/commit/95f6ca95b4fc31ea1bf7bd6f12cd80e5323ed24f))
* **formatters:** add a fake hyperlink formatter ([#459](https://github.com/ghiscoding/aurelia-slickgrid/issues/459)) ([94618e7](https://github.com/ghiscoding/aurelia-slickgrid/commit/94618e7a9319459b60487cc3852d6dc81c40e805))
* **formatters:** add AlignRight and AlignCenter Formatters ([#462](https://github.com/ghiscoding/aurelia-slickgrid/issues/462)) ([a047b8c](https://github.com/ghiscoding/aurelia-slickgrid/commit/a047b8c3ca3205a9ea44f0a3753c8b68edb02b51))
* **services:** add 2x new methods hideColumnById(s) ([#461](https://github.com/ghiscoding/aurelia-slickgrid/issues/461)) ([4cd1ecf](https://github.com/ghiscoding/aurelia-slickgrid/commit/4cd1ecf9bca629ef9efa0d022ff08f2a334e2a95))
* **tests:** update to aurelia-pal-nodejs 2.x and few newer npm packages ([#453](https://github.com/ghiscoding/aurelia-slickgrid/issues/453)) ([0fd5b0c](https://github.com/ghiscoding/aurelia-slickgrid/commit/0fd5b0cc6279a81f8f6a8faa5c621d91acd316a4))

### Bug Fixes

* **backend:** OData/GraphQL pagination should display warning on empty ([#460](https://github.com/ghiscoding/aurelia-slickgrid/issues/460)) ([a597eca](https://github.com/ghiscoding/aurelia-slickgrid/commit/a597eca3b2968eccf13f6c712b79501c97877db3))
* **core:** clear dataset when disposing and fix few unsubscribed events to avoid leak ([#456](https://github.com/ghiscoding/aurelia-slickgrid/issues/456)) ([7171d24](https://github.com/ghiscoding/aurelia-slickgrid/commit/7171d24bf29e00b04f8433c690963057d34e7170))
* **core:** header columns grouping misbehave after hiding column ([#464](https://github.com/ghiscoding/aurelia-slickgrid/issues/464)) ([a8f6a3f](https://github.com/ghiscoding/aurelia-slickgrid/commit/a8f6a3f1e2e88257495d77f5195a0eb63916aa81))
* **core:** properly dispose plugins to avoid detached DOM elements ([#455](https://github.com/ghiscoding/aurelia-slickgrid/issues/455)) ([9bb173f](https://github.com/ghiscoding/aurelia-slickgrid/commit/9bb173fb556f0afd3adb9aae0a4d2830f68e74b5))
* **core:** properly remove event listeners when disposing ([2215b18](https://github.com/ghiscoding/aurelia-slickgrid/commit/2215b180f3b344796e0ef8616a8928c271c2599c))
* **core:** revert to use WebPack to run Cypress E2E tests ([ef474d8](https://github.com/ghiscoding/aurelia-slickgrid/commit/ef474d8877b2b146a320534d5d7781c072f18955))
* **extensions:** CellExternalCopyBuffer plugin onKeyDown event leaking ([8e6d325](https://github.com/ghiscoding/aurelia-slickgrid/commit/8e6d3250f380af94aede42a556a745954ee93882))

### [2.22.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.22.1...v2.22.2) (2020-10-31)

### Bug Fixes

* **core:** unsubscribe all subscriptions on compose dispose ([#446](https://github.com/ghiscoding/aurelia-slickgrid/issues/446)) ([9b20b61](https://github.com/ghiscoding/aurelia-slickgrid/commit/9b20b619456a9d2095e6f95f451fa11baf99313f))
* **core:** unsubscribe every possible events ([#448](https://github.com/ghiscoding/aurelia-slickgrid/issues/448)) ([09f596e](https://github.com/ghiscoding/aurelia-slickgrid/commit/09f596e7f20fcb3cc52232fb4697474cad427a11))
* **extensions:** import jQuery mousewheel only with frozen ([#450](https://github.com/ghiscoding/aurelia-slickgrid/issues/450)) ([c327833](https://github.com/ghiscoding/aurelia-slickgrid/commit/c327833fb44922120764c9802f291e58e74e4b7b)), closes [#618](https://github.com/ghiscoding/aurelia-slickgrid/issues/618)
* **filters:** slider filter setValues really change input value ([#451](https://github.com/ghiscoding/aurelia-slickgrid/issues/451)) ([cc4417b](https://github.com/ghiscoding/aurelia-slickgrid/commit/cc4417b40a2ac0b4f1978b42b628bc2c4954f6b0))
* **interfaces:** column types in GridStateChange ([#445](https://github.com/ghiscoding/aurelia-slickgrid/issues/445)) ([91d81c8](https://github.com/ghiscoding/aurelia-slickgrid/commit/91d81c82b09171fbfb2a1c9e27284798f6bc95cb))
* **styling:** flatpickr bg-color should be using SASS variable ([#449](https://github.com/ghiscoding/aurelia-slickgrid/issues/449)) ([33dc40d](https://github.com/ghiscoding/aurelia-slickgrid/commit/33dc40dc4411d33e5ce6be51b7585f8e0f34cdd3))

### [2.22.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.22.0...v2.22.1) (2020-10-14)

### Features

* **styling:** add frozen on all possible elements with SASS variables ([#437](https://github.com/ghiscoding/aurelia-slickgrid/issues/437)) ([5a1af0d](https://github.com/ghiscoding/aurelia-slickgrid/commit/5a1af0db72c3a6913cbe5d2fa57ec5bd1a696867))

### Bug Fixes

* **core:** don't override alwaysShowVerticalScroll flag ([#438](https://github.com/ghiscoding/aurelia-slickgrid/issues/438)) ([07687e0](https://github.com/ghiscoding/aurelia-slickgrid/commit/07687e0ee7fb71883e421d2454338ee9a2d5d2fe)), closes [#537](https://github.com/ghiscoding/aurelia-slickgrid/issues/537) [6pac/SlickGrid#537](https://github.com/6pac/SlickGrid/issues/537)
* **core:** hide Grid Menu Filter/Sort cmd when disabling functionality ([#444](https://github.com/ghiscoding/aurelia-slickgrid/issues/444)) ([735baf2](https://github.com/ghiscoding/aurelia-slickgrid/commit/735baf2b980623d02ba30a3e458b4c5a1c953318))

## [2.22.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.21.0...v2.22.0) (2020-10-02)

### Features

* **core:** add custom entry to Select Editor/Filter collections ([#430](https://github.com/ghiscoding/aurelia-slickgrid/issues/430)) ([0e49313](https://github.com/ghiscoding/aurelia-slickgrid/commit/0e493136b5c2d16bb11d9bb2273475af82ffe334))
* **services:** add Toggle Filtering/Sorting & Hide Column methods ([#426](https://github.com/ghiscoding/aurelia-slickgrid/issues/426)) ([1ae2f6a](https://github.com/ghiscoding/aurelia-slickgrid/commit/1ae2f6a76f42c93e592d134632eff995ca738f08))
* **styling:** add description to Compound Filter Operators ([#427](https://github.com/ghiscoding/aurelia-slickgrid/issues/427)) ([deaca78](https://github.com/ghiscoding/aurelia-slickgrid/commit/deaca78571b3d444ad51a8213c759fa272786622))
* **styling:** add Pagination button height sass variable ([#433](https://github.com/ghiscoding/aurelia-slickgrid/issues/433)) ([cba49ba](https://github.com/ghiscoding/aurelia-slickgrid/commit/cba49ba3cdca4cacbd1b213176d00e4af6615e34))
* **tests:** add more Cypress E2E tests for grouping ([#423](https://github.com/ghiscoding/aurelia-slickgrid/issues/423)) ([e58b0cd](https://github.com/ghiscoding/aurelia-slickgrid/commit/e58b0cd2bcc12dd5d404497a93e8ddafc69a93d8))

### Bug Fixes

* **editors:** add blank entry on Select Editor should happen once ([#429](https://github.com/ghiscoding/aurelia-slickgrid/issues/429)) ([b6ce803](https://github.com/ghiscoding/aurelia-slickgrid/commit/b6ce8037f165c7dd0e6ccf403b43aa821e904714))
* **filters:** disregard time when filtering date only format ([#431](https://github.com/ghiscoding/aurelia-slickgrid/issues/431)) ([b61e902](https://github.com/ghiscoding/aurelia-slickgrid/commit/b61e902f5c1f87ff7e0a521d12b12e3e8d4d431f))
* **filters:** tree data presets caused regression in any grid w/presets ([#435](https://github.com/ghiscoding/aurelia-slickgrid/issues/435)) ([e91af6d](https://github.com/ghiscoding/aurelia-slickgrid/commit/e91af6daabf837e9b60c1dba02cc181b41f3ef21))
* **pinning:** put back vertical scroll on grid after removing freezing ([#421](https://github.com/ghiscoding/aurelia-slickgrid/issues/421)) ([06da37b](https://github.com/ghiscoding/aurelia-slickgrid/commit/06da37bd03eaa5cb7ed48d5ba3a24a5eb2d4921c))
* **select:** make a collection array copy to avoid change by ref ([#432](https://github.com/ghiscoding/aurelia-slickgrid/issues/432)) ([5fb5285](https://github.com/ghiscoding/aurelia-slickgrid/commit/5fb5285e3b89570df64a9dcdf1b2847296cd66a0))
* **styling:** Compound Filter Operator dropdown too wide in BS4 ([#436](https://github.com/ghiscoding/aurelia-slickgrid/issues/436)) ([f5750e6](https://github.com/ghiscoding/aurelia-slickgrid/commit/f5750e6ad82e557cefed142c8d2c40f1fd210e7d))
* **styling:** grouping with checkbox should be aligned left ([#422](https://github.com/ghiscoding/aurelia-slickgrid/issues/422)) ([ea613d0](https://github.com/ghiscoding/aurelia-slickgrid/commit/ea613d0b08be75e8225691d835c20e84f447b4de))
* **styling:** support other unit of measure in SASS, fixes [#420](https://github.com/ghiscoding/aurelia-slickgrid/issues/420) ([#428](https://github.com/ghiscoding/aurelia-slickgrid/issues/428)) ([3fc3bdd](https://github.com/ghiscoding/aurelia-slickgrid/commit/3fc3bdd3c7c1c529f165a1f8e358d5e58b78a48b))

## [2.21.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.20.1...v2.21.0) (2020-09-15)

### Features

* **autocomplete:** add much more functionalities to the AutoComplete ([#405](https://github.com/ghiscoding/aurelia-slickgrid/issues/405)) ([40db84e](https://github.com/ghiscoding/aurelia-slickgrid/commit/40db84e2e604af112f4d4b8195a8fcffa9ec0f8a))
* **core:** add loading spinner to AutoComplete Editor/Filter ([#402](https://github.com/ghiscoding/aurelia-slickgrid/issues/402)) ([30bfec5](https://github.com/ghiscoding/aurelia-slickgrid/commit/30bfec5d364ab4186e71cbd043bc9ab3b2364810))
* **editors:** add Clear Date button to Date Editor ([#418](https://github.com/ghiscoding/aurelia-slickgrid/issues/418)) ([659304d](https://github.com/ghiscoding/aurelia-slickgrid/commit/659304dde27a9fad9d099ac19c8d2e727faf98e0))
* **styling:** add extra SASS utilities and icon colors ([#408](https://github.com/ghiscoding/aurelia-slickgrid/issues/408)) ([897f4df](https://github.com/ghiscoding/aurelia-slickgrid/commit/897f4dfc38cb53846e8a9c3526fb54c87bf9794a))
* **styling:** find way to add colors to SVGs used by the lib ([#404](https://github.com/ghiscoding/aurelia-slickgrid/issues/404)) ([482711b](https://github.com/ghiscoding/aurelia-slickgrid/commit/482711b5df2b2c8cc7f09a4d23a4f9e13a530a5a))
* **tests:** add more Cypress E2E tests for Language change ([fd904e3](https://github.com/ghiscoding/aurelia-slickgrid/commit/fd904e3d8fb715176fc4eed80eac6274dc226fd4))
* **tests:** add more Cypress E2E tests for Pagination Lang change ([dc19c30](https://github.com/ghiscoding/aurelia-slickgrid/commit/dc19c30a802d0b6ca34a7f203cb745c933881ce2))

### Bug Fixes

* **core:** latest Flatpickr breaks Date Filters/Editors ([#403](https://github.com/ghiscoding/aurelia-slickgrid/issues/403)) ([d969afc](https://github.com/ghiscoding/aurelia-slickgrid/commit/d969afc25041cce112aab3b2c4315a6b4c06a05e))
* **core:** use latest excel-builder-webpacker to fix CLI 2.0 ([#419](https://github.com/ghiscoding/aurelia-slickgrid/issues/419)) ([b902782](https://github.com/ghiscoding/aurelia-slickgrid/commit/b902782f99b5244b6d2e78c947413ad04156abac))
* **editor:** SingleSelect Editor should show pick false value ([#407](https://github.com/ghiscoding/aurelia-slickgrid/issues/407)) ([0dce0d2](https://github.com/ghiscoding/aurelia-slickgrid/commit/0dce0d2371de044b535524868e3d1734b3b34a96))
* **editors:** all Editors should call commitChanges even when invalid ([#416](https://github.com/ghiscoding/aurelia-slickgrid/issues/416)) ([9fc066a](https://github.com/ghiscoding/aurelia-slickgrid/commit/9fc066a78cc94a662c365a710251882aebd7a892))
* **editors:** AutoComplete Editor might have undefined object label ([#401](https://github.com/ghiscoding/aurelia-slickgrid/issues/401)) ([c0b6224](https://github.com/ghiscoding/aurelia-slickgrid/commit/c0b62242b296463b4352ab27cc240637dea1034f))
* **editors:** fix couple of small editor bugs found ([#409](https://github.com/ghiscoding/aurelia-slickgrid/issues/409)) ([f59dcbe](https://github.com/ghiscoding/aurelia-slickgrid/commit/f59dcbec931ce38563e68cef8c4cd6874f247fe3))
* **editors:** update to latest Flatpickr version ([#417](https://github.com/ghiscoding/aurelia-slickgrid/issues/417)) ([3447549](https://github.com/ghiscoding/aurelia-slickgrid/commit/3447549133fe232ceb693adc4e4fd9db834c5301))
* **styling:** extra styling shouldn't override default bootstrap style ([#415](https://github.com/ghiscoding/aurelia-slickgrid/issues/415)) ([db5ad2f](https://github.com/ghiscoding/aurelia-slickgrid/commit/db5ad2fb1dd2877d594271654ede1b0126e00274))
* **styling:** remove unwanted source map from css output files ([#411](https://github.com/ghiscoding/aurelia-slickgrid/issues/411)) ([514bab1](https://github.com/ghiscoding/aurelia-slickgrid/commit/514bab1068ac980a4a07f98210446f20216b70e3))

### [2.20.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.20.0...v2.20.1) (2020-08-04)

### Features

* **examples:** add fetch to autoComplete sample ([#397](https://github.com/ghiscoding/aurelia-slickgrid/issues/397)) ([70edd27](https://github.com/ghiscoding/aurelia-slickgrid/commit/70edd27ca0a1c1a77d88979712eac2018535bf51))

### Bug Fixes

* **core:** add missing `inlineFilters` DataView optional flag ([#398](https://github.com/ghiscoding/aurelia-slickgrid/issues/398)) ([cde443b](https://github.com/ghiscoding/aurelia-slickgrid/commit/cde443ba400927f0c489a6e127658374c3920d2b))
* **extension:** Row Detail gets blanked out for no reason ([#400](https://github.com/ghiscoding/aurelia-slickgrid/issues/400)) ([f4591de](https://github.com/ghiscoding/aurelia-slickgrid/commit/f4591defd67bef09be66b5d996ef8e79a5640612))
* **extensions:** adding Context Menu custom commands was not working ([#396](https://github.com/ghiscoding/aurelia-slickgrid/issues/396)) ([097c558](https://github.com/ghiscoding/aurelia-slickgrid/commit/097c55865631ba107441471a8294c3a9a7719b3d))
* **extensions:** Row Detail not always refreshing with customId ([#399](https://github.com/ghiscoding/aurelia-slickgrid/issues/399)) ([b6d746d](https://github.com/ghiscoding/aurelia-slickgrid/commit/b6d746d374551a6c0684c2a44fb7b77a4f6d1e8e)), closes [#546](https://github.com/ghiscoding/aurelia-slickgrid/issues/546)

## [2.20.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.19.1...v2.20.0) (2020-07-30)

### Features

* **core:** expose all services, slickgrid, dataview instances ([#392](https://github.com/ghiscoding/aurelia-slickgrid/issues/392)) ([6b7603f](https://github.com/ghiscoding/aurelia-slickgrid/commit/6b7603f338a3f8c70c1f2aa4e59b529ee2d3415b))
* **editors:** add min/max length options to text editors ([#395](https://github.com/ghiscoding/aurelia-slickgrid/issues/395)) ([99ff929](https://github.com/ghiscoding/aurelia-slickgrid/commit/99ff929fe1c3df53505d29d67024f8a6c7f0e506))

### Bug Fixes

* **editors:** Editors should work with undefined item properties ([#390](https://github.com/ghiscoding/aurelia-slickgrid/issues/390)) ([e2d94ad](https://github.com/ghiscoding/aurelia-slickgrid/commit/e2d94ad80512dc0a82f3a46484301b5dc7f8feb9))
* **extensions:** draggable grouping called wrong check ([#389](https://github.com/ghiscoding/aurelia-slickgrid/issues/389)) ([1107d90](https://github.com/ghiscoding/aurelia-slickgrid/commit/1107d90a24000c21f84476f166c889575abe8094))
* **footer:** remove unnecessary row class to avoid negative margins ([#391](https://github.com/ghiscoding/aurelia-slickgrid/issues/391)) ([9b4020c](https://github.com/ghiscoding/aurelia-slickgrid/commit/9b4020c1b629db33abbec39885ff8bfff2b49365))
* **interfaces:** grid option enableColumnReorder can also be a function ([#394](https://github.com/ghiscoding/aurelia-slickgrid/issues/394)) ([d6266ea](https://github.com/ghiscoding/aurelia-slickgrid/commit/d6266ea4e75b940aa2a6b92b6ad9b1fca8fa6c3d))
* **styling:** tweak styling so that we won't need to use css !important ([#393](https://github.com/ghiscoding/aurelia-slickgrid/issues/393)) ([6f73bc6](https://github.com/ghiscoding/aurelia-slickgrid/commit/6f73bc6581f03e34eae3ff449954e4de8c49b56c))

### [2.19.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.19.0...v2.19.1) (2020-07-20)

### Features

* **core:** use DataView transactions with multiple item changes ([62e2026](https://github.com/ghiscoding/aurelia-slickgrid/commit/62e2026a2de7abd5601941c2f0500a48815e1d48))
* **styling:** add custom footer font-size SASS variable ([#380](https://github.com/ghiscoding/aurelia-slickgrid/issues/380)) ([858ec2d](https://github.com/ghiscoding/aurelia-slickgrid/commit/858ec2ded26d9469b6d7b9b5d37aa6e4dd791f38))
* **tests:** add more Cypress E2E tests for grid with Editors ([#384](https://github.com/ghiscoding/aurelia-slickgrid/issues/384)) ([4881aa3](https://github.com/ghiscoding/aurelia-slickgrid/commit/4881aa3b998baaa5e1e5c038c1d890f29f4a5d4a))
* **tests:** add more Cypress E2E tests for Tree Data ([#383](https://github.com/ghiscoding/aurelia-slickgrid/issues/383)) ([2867137](https://github.com/ghiscoding/aurelia-slickgrid/commit/2867137cef32f7f470f022a31a3ced8553a32478))

### Bug Fixes

* **editors:** add saveOutputType to finally have proper save format ([#386](https://github.com/ghiscoding/aurelia-slickgrid/issues/386)) ([0bf11cd](https://github.com/ghiscoding/aurelia-slickgrid/commit/0bf11cd009fde030c991424361d869b5d19d6943))
* **filter:** Grid Preset Filters should work with Tree Data View ([#382](https://github.com/ghiscoding/aurelia-slickgrid/issues/382)) ([5d8fc85](https://github.com/ghiscoding/aurelia-slickgrid/commit/5d8fc85ac83bbcda42f4e23e26824d25b5909f00))
* **footer:** incorrect date format in custom footer ([#379](https://github.com/ghiscoding/aurelia-slickgrid/issues/379)) ([5297b7c](https://github.com/ghiscoding/aurelia-slickgrid/commit/5297b7c086995d730c433d7fd482e16a52fb6443))
* **menu:** context menu to copy cell with queryFieldNameGetterFn ([#388](https://github.com/ghiscoding/aurelia-slickgrid/issues/388)) ([d5a5d63](https://github.com/ghiscoding/aurelia-slickgrid/commit/d5a5d6392345da3ed157008597d5f5c3020ca821))
* **styling:** sass variable should be interpolate before using calc ([#387](https://github.com/ghiscoding/aurelia-slickgrid/issues/387)) ([c5c3c9f](https://github.com/ghiscoding/aurelia-slickgrid/commit/c5c3c9f0b3e6e49952b84d0f05a6e81aad20158f)), closes [#385](https://github.com/ghiscoding/aurelia-slickgrid/issues/385)

## [2.19.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.18.2...v2.19.0) (2020-06-30)

### Features

* **editor:** use better error message for inclusive values ([#368](https://github.com/ghiscoding/aurelia-slickgrid/issues/368)) ([130e5dd](https://github.com/ghiscoding/aurelia-slickgrid/commit/130e5dd4768e6bdf2813faaf957ac5bce840b33d))
* **pinning:** add "Frozen Columns" to header menu ([#363](https://github.com/ghiscoding/aurelia-slickgrid/issues/363)) ([e518eef](https://github.com/ghiscoding/aurelia-slickgrid/commit/e518eefa3a0c4d5ab9cbecfd7b1133bf7f5984fb))
* **sorting:** header menu clear sort, reset sorting when nothing left ([#374](https://github.com/ghiscoding/aurelia-slickgrid/issues/374)) ([3f09823](https://github.com/ghiscoding/aurelia-slickgrid/commit/3f098232efc645ce5934581bf51b127c0f6ba241))
* **typing:** add SlickGrid and DataView interfaces ([#360](https://github.com/ghiscoding/aurelia-slickgrid/issues/360)) ([28003c1](https://github.com/ghiscoding/aurelia-slickgrid/commit/28003c100ccd27a19431b691b0a430d387b28b04))
* **typings:** add more TS Generic Types ([#378](https://github.com/ghiscoding/aurelia-slickgrid/issues/378)) ([9f7adb8](https://github.com/ghiscoding/aurelia-slickgrid/commit/9f7adb84efdb5f6f4d9fb61616d9331ecceb4762))

### Bug Fixes

* **core:** add missing use of custom datasetIdPropertyName ([#354](https://github.com/ghiscoding/aurelia-slickgrid/issues/354)) ([c083853](https://github.com/ghiscoding/aurelia-slickgrid/commit/c083853f40828157f9957090de2c18ff82e88f16))
* **editor:** float validator should accept decimal even without 0 suffix ([#375](https://github.com/ghiscoding/aurelia-slickgrid/issues/375)) ([0e32c3f](https://github.com/ghiscoding/aurelia-slickgrid/commit/0e32c3f9adb309ef645dbd9024b8cb813278e513))
* **editor:** shouldn't call cell changed when cell value is undefined ([#377](https://github.com/ghiscoding/aurelia-slickgrid/issues/377)) ([0397719](https://github.com/ghiscoding/aurelia-slickgrid/commit/03977197dbcb74e899aee38891a8c08b195fe02a))
* **example:** use highest id as new id in addItem example ([#366](https://github.com/ghiscoding/aurelia-slickgrid/issues/366)) ([7ed0c31](https://github.com/ghiscoding/aurelia-slickgrid/commit/7ed0c31eec005468980af2ffc02015c5b1598259))
* **excel:** Excel Export add mime type to work in Firefox ([#369](https://github.com/ghiscoding/aurelia-slickgrid/issues/369)) ([2a7b0ba](https://github.com/ghiscoding/aurelia-slickgrid/commit/2a7b0ba91aeb944e53bf145e2687d340c3ff642e))
* **extension:** registerPlugin not implemented correctly ([#359](https://github.com/ghiscoding/aurelia-slickgrid/issues/359)) ([bc3d0a9](https://github.com/ghiscoding/aurelia-slickgrid/commit/bc3d0a9c0ecdb09ba2bba3e95747349b91a627f1))
* **filter:** recreate filters when toggling header row ([#365](https://github.com/ghiscoding/aurelia-slickgrid/issues/365)) ([554ce32](https://github.com/ghiscoding/aurelia-slickgrid/commit/554ce3250e57f773fe310b180e6e13e97faec60b))
* **filter:** Select Filter should use default locale without translation ([#371](https://github.com/ghiscoding/aurelia-slickgrid/issues/371)) ([35d4a01](https://github.com/ghiscoding/aurelia-slickgrid/commit/35d4a0106b9dc7377571a7380fa0448d3ee0d1b6))
* **formatter:** add possibility to parse a date formatter as a UTC date ([#376](https://github.com/ghiscoding/aurelia-slickgrid/issues/376)) ([881f234](https://github.com/ghiscoding/aurelia-slickgrid/commit/881f234a1150b11cf65d5bb296a5c404e57b3254))
* **header:** re-create header grouping title after changing picker cols ([#370](https://github.com/ghiscoding/aurelia-slickgrid/issues/370)) ([3c2248d](https://github.com/ghiscoding/aurelia-slickgrid/commit/3c2248d6693f12440bd4e250e8ccfbc91f10aaeb))
* **lint:** adhere to strict triple equality check ([#355](https://github.com/ghiscoding/aurelia-slickgrid/issues/355)) ([adccd1b](https://github.com/ghiscoding/aurelia-slickgrid/commit/adccd1bee09b0d2d72c2bfa81b676f05daccc842))
* **pagination:** disabled page buttons should not be clickable ([#372](https://github.com/ghiscoding/aurelia-slickgrid/issues/372)) ([5909dea](https://github.com/ghiscoding/aurelia-slickgrid/commit/5909deae2a8f1ece5a5d2a0a19eb1f75195106cc))
* **picker:** add missing pre-header title grouping extractor ([#367](https://github.com/ghiscoding/aurelia-slickgrid/issues/367)) ([b6a171d](https://github.com/ghiscoding/aurelia-slickgrid/commit/b6a171d2eaeda6b42346e5c653cc5978cc62fdb6))
* **presets:** compound filters operator not working correctly w/presets ([#373](https://github.com/ghiscoding/aurelia-slickgrid/issues/373)) ([27b8c21](https://github.com/ghiscoding/aurelia-slickgrid/commit/27b8c21f5210120350b7f4354af5f7c305f11457))
* **styling:** cell/context menus get re-position below the grid ([#356](https://github.com/ghiscoding/aurelia-slickgrid/issues/356)) ([8079e65](https://github.com/ghiscoding/aurelia-slickgrid/commit/8079e653dba96af623ac1f66160aff8624355e9a))
* **treeData:** should support use of custom datasetIdPropertyName ([#353](https://github.com/ghiscoding/aurelia-slickgrid/issues/353)) ([6a0b0b3](https://github.com/ghiscoding/aurelia-slickgrid/commit/6a0b0b3f47f2781ca8a3ef8f7a81c53ed0c867ec))
* **types:** add missing option flags in grouping interface ([#357](https://github.com/ghiscoding/aurelia-slickgrid/issues/357)) ([46273bf](https://github.com/ghiscoding/aurelia-slickgrid/commit/46273bf2c96f0065ee3872f6108562afcc947b80))

### [2.18.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.18.1...v2.18.2) (2020-05-26)

### Features

* **gridMenu:** update to latest SlickGrid & add new Grid Menu options ([#351](https://github.com/ghiscoding/aurelia-slickgrid/issues/351)) ([e55b7e7](https://github.com/ghiscoding/aurelia-slickgrid/commit/e55b7e7a418894c047a3b38c92f05d483b76edd5))

### Bug Fixes

* **filters:** add all Filters as Transient ([#348](https://github.com/ghiscoding/aurelia-slickgrid/issues/348)) ([1d39b2e](https://github.com/ghiscoding/aurelia-slickgrid/commit/1d39b2e9b8542fb3f5c70415d61fd3ffd98ff8f8))
* **footer:** custom footer metric texts could not be changed ([#350](https://github.com/ghiscoding/aurelia-slickgrid/issues/350)) ([c5c6b63](https://github.com/ghiscoding/aurelia-slickgrid/commit/c5c6b63828ed2c3f861beac67946ec6161a2d35e))
* **gridMenu:** command "Toggle Filter Row" header row ([#347](https://github.com/ghiscoding/aurelia-slickgrid/issues/347)) ([4d0491a](https://github.com/ghiscoding/aurelia-slickgrid/commit/4d0491adea967fc7f9bb2b3e7b38853872735768)), closes [#334](https://github.com/ghiscoding/aurelia-slickgrid/issues/334)
* **odata:** encode uri also for IN/NIN operators ([#349](https://github.com/ghiscoding/aurelia-slickgrid/issues/349)) ([7be2d3b](https://github.com/ghiscoding/aurelia-slickgrid/commit/7be2d3b6152cee6861867aad93ba1a2449b70cbb))
* **resizer:** check for undefined option instead of fallback ([#352](https://github.com/ghiscoding/aurelia-slickgrid/issues/352)) ([7d03e9a](https://github.com/ghiscoding/aurelia-slickgrid/commit/7d03e9acc3d1aa50413104bdce69251e25b2859e))

### [2.18.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.18.0...v2.18.1) (2020-05-20)

### Bug Fixes

* **excel:** update excel builder dependency ([86fce02](https://github.com/ghiscoding/aurelia-slickgrid/commit/86fce0243b25e3fe039e197f8885c00390909edf))

## [2.18.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.17.9...v2.18.0) (2020-05-20)

### Features

* **core:** update to latest TypeScript version ([330f8ad](https://github.com/ghiscoding/aurelia-slickgrid/commit/330f8ad8628e550d3eb85d9954e58e44b2c3d52f))
* **editor:** add new Dual Input Editor & extract all Editor Validators ([#333](https://github.com/ghiscoding/aurelia-slickgrid/issues/333)) ([25ff639](https://github.com/ghiscoding/aurelia-slickgrid/commit/25ff6394df3681f1980fc0cf58f2d7aa0486f492))
* **extension:** add column position option for checkbox row selector ([#317](https://github.com/ghiscoding/aurelia-slickgrid/issues/317)) ([1de66f4](https://github.com/ghiscoding/aurelia-slickgrid/commit/1de66f45e00895532c3a77b02eb7d38e907ea61c))
* **extension:** add column position option for Row Detail icon ([5e496fe](https://github.com/ghiscoding/aurelia-slickgrid/commit/5e496fe16566f9fa151e1f3ee7147b062d1b55b9))
* **extension:** add latest slickgrid with RowMove improvements ([#321](https://github.com/ghiscoding/aurelia-slickgrid/issues/321)) ([bf767c5](https://github.com/ghiscoding/aurelia-slickgrid/commit/bf767c5a488dfa57b32a3cd85ed46cd09750f48f))
* **grouping:** add missing Grouping interface properties ([#325](https://github.com/ghiscoding/aurelia-slickgrid/issues/325)) ([35e2c67](https://github.com/ghiscoding/aurelia-slickgrid/commit/35e2c676c786f086134a2caab215d6fe660a7971))
* **i18n:** add namespace prefix + separator grid option, closes [#338](https://github.com/ghiscoding/aurelia-slickgrid/issues/338) ([#344](https://github.com/ghiscoding/aurelia-slickgrid/issues/344)) ([115989d](https://github.com/ghiscoding/aurelia-slickgrid/commit/115989de00e5b5c280c96871c1b0d1c1e64cd3ac))
* **query:** add queryFieldNameGetterFn callback know which field to use ([#326](https://github.com/ghiscoding/aurelia-slickgrid/issues/326)) ([2d7ebbc](https://github.com/ghiscoding/aurelia-slickgrid/commit/2d7ebbca5b86f0aadb8381ed7017ef752ccad116))
* **sort:** add valueCouldBeUndefined column flag to help sorting ([#323](https://github.com/ghiscoding/aurelia-slickgrid/issues/323)) ([9c5996c](https://github.com/ghiscoding/aurelia-slickgrid/commit/9c5996c27a65f90bdf3fd3e618cd52951af5026e))
* **style:** add Sort icon hint on hover when column is sortable ([#327](https://github.com/ghiscoding/aurelia-slickgrid/issues/327)) ([357fabd](https://github.com/ghiscoding/aurelia-slickgrid/commit/357fabd75255ef291a3ec5eca1efae3c0816a79f))
* **styling:** add CSS/SASS Material Design & Salesforce styling themes ([#337](https://github.com/ghiscoding/aurelia-slickgrid/issues/337)) ([6c57616](https://github.com/ghiscoding/aurelia-slickgrid/commit/6c5761686e2f62bef591a6cdf850ab80c895b0d4))
* **treeData:** add new Tree Data View feature ([#339](https://github.com/ghiscoding/aurelia-slickgrid/issues/339)) ([1526b87](https://github.com/ghiscoding/aurelia-slickgrid/commit/1526b879b6cd73cf7aa8290fda5f3b269095db4e))

### Bug Fixes

* **editor:** disregard Date Editor Flatpickr error and fix output format ([#332](https://github.com/ghiscoding/aurelia-slickgrid/issues/332)) ([c60a51c](https://github.com/ghiscoding/aurelia-slickgrid/commit/c60a51cbfb2b4d36812e316c36e771e91a19b02f))
* **export:** remove unsupported file type ([#341](https://github.com/ghiscoding/aurelia-slickgrid/issues/341)) ([ffa66fd](https://github.com/ghiscoding/aurelia-slickgrid/commit/ffa66fdceba6a8c1316cbe8e59b6fe3fb3e99c5c))
* **filter:** string filter should also work when using Contains ([#320](https://github.com/ghiscoding/aurelia-slickgrid/issues/320)) ([90a752b](https://github.com/ghiscoding/aurelia-slickgrid/commit/90a752b70ee1de46311b4fe3c1f124969deed024))
* **filter:** when entering filter operator it shouldn't do any filtering ([#324](https://github.com/ghiscoding/aurelia-slickgrid/issues/324)) ([0f3bab6](https://github.com/ghiscoding/aurelia-slickgrid/commit/0f3bab6019ad35d86c1b1c56e87e6b5039deae63))
* **formatter:** exportWithFormatter should work with undefined item prop ([#340](https://github.com/ghiscoding/aurelia-slickgrid/issues/340)) ([5e12d80](https://github.com/ghiscoding/aurelia-slickgrid/commit/5e12d80aa9c5f28a74f139cef238c9994c020a11))
* **gridMenu:** column picker list should include grouped header titles ([#343](https://github.com/ghiscoding/aurelia-slickgrid/issues/343)) ([ae08a87](https://github.com/ghiscoding/aurelia-slickgrid/commit/ae08a87e8707cd82768144a502966ee395c03a3f))
* **gridMenu:** the command "Toggle Filter Row" disappeared ([#334](https://github.com/ghiscoding/aurelia-slickgrid/issues/334)) ([23c94f2](https://github.com/ghiscoding/aurelia-slickgrid/commit/23c94f2bfcd76f909d06894e3b279aedab2ffe6b))
* **gridService:** crud methods should support custom dataset id ([#336](https://github.com/ghiscoding/aurelia-slickgrid/issues/336)) ([c942929](https://github.com/ghiscoding/aurelia-slickgrid/commit/c9429296fe5af3df395d36ee1f04e7e1d8b84d44))
* **pagination:** passing custom pagination sizes should work ([#342](https://github.com/ghiscoding/aurelia-slickgrid/issues/342)) ([1ca62a4](https://github.com/ghiscoding/aurelia-slickgrid/commit/1ca62a423eabadc0622628776dd7092acca33e26))
* **resizer:** remove scrollbar measure compensate patch ([#319](https://github.com/ghiscoding/aurelia-slickgrid/issues/319)) ([2527589](https://github.com/ghiscoding/aurelia-slickgrid/commit/25275897f72e0e08b98ae635b768ae45464a99d9))
* **rowDetail:** use latest SlickGrid version to fix issue with id ([#335](https://github.com/ghiscoding/aurelia-slickgrid/issues/335)) ([d89e707](https://github.com/ghiscoding/aurelia-slickgrid/commit/d89e707b4fc8d81e374f2e40530b10b2a026990d))
* **sort:** header menu sorting should include columnId property ([d0cdfbe](https://github.com/ghiscoding/aurelia-slickgrid/commit/d0cdfbec67bbc5541788fa3957e85b59224327e2))

### [2.17.9](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.17.8...v2.17.9) (2020-03-19)

### Features

* **sort:** add default sort field as grid option ([5886b24](https://github.com/ghiscoding/aurelia-slickgrid/commit/5886b24b2f5439170564fc0b262b677f326a82ea))

### Bug Fixes

* **formatters:** decimalSeparator & thousandSeparator work tgt ([c46ef46](https://github.com/ghiscoding/aurelia-slickgrid/commit/c46ef46f7c999b57ded70454edefa57181a781d6))

<a name="2.17.8"></a>
## [2.17.8](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.17.7...v2.17.8) (2020-03-04)

### Bug Fixes

* **columns:** remove columns dynamically with Editors ([7157ed3](https://github.com/ghiscoding/aurelia-slickgrid/commit/7157ed3))

<a name="2.17.7"></a>
## [2.17.7](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.17.6...v2.17.7) (2020-03-03)

### Bug Fixes

* **columns:** add/remove columns dynamically ([a0fba0d](https://github.com/ghiscoding/aurelia-slickgrid/commit/a0fba0d))
* **example:** should re-render after clearing groups ([ee591f8](https://github.com/ghiscoding/aurelia-slickgrid/commit/ee591f8))

<a name="2.17.5"></a>
## [2.17.5](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.17.4...v2.17.5) (2020-02-21)

### Features

* **aurelia:** add Custom Editor/Filter with Aurelia Custom Elements ([#307](https://github.com/ghiscoding/aurelia-slickgrid/issues/307)) ([afe110a](https://github.com/ghiscoding/aurelia-slickgrid/commit/afe110a))
* **excel:** add some extra styling & width options for Excel export ([#308](https://github.com/ghiscoding/aurelia-slickgrid/issues/308)) ([a070d60](https://github.com/ghiscoding/aurelia-slickgrid/commit/a070d60))

<a name="2.17.4"></a>
## [2.17.4](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.17.3...v2.17.4) (2020-02-07)

### Bug Fixes

* **selection:** row selection always be kept ([#306](https://github.com/ghiscoding/aurelia-slickgrid/issues/306)) ([b7e62e8](https://github.com/ghiscoding/aurelia-slickgrid/commit/b7e62e8))

<a name="2.17.3"></a>
## [2.17.3](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.17.2...v2.17.3) (2020-02-06)

### Bug Fixes

* **pagination:** on filter change pagination should reset to 1st page ([#304](https://github.com/ghiscoding/aurelia-slickgrid/issues/304)) ([c633413](https://github.com/ghiscoding/aurelia-slickgrid/commit/c633413))
* **selection:** filter data should work with row selection ([#303](https://github.com/ghiscoding/aurelia-slickgrid/issues/303)) ([7bab709](https://github.com/ghiscoding/aurelia-slickgrid/commit/7bab709))

<a name="2.17.2"></a>
## [2.17.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.17.1...v2.17.2) (2020-02-04)

### Bug Fixes

* **footer:** custom footer should work anytime pagination is disabled ([ebd4aec](https://github.com/ghiscoding/aurelia-slickgrid/commit/ebd4aec))

<a name="2.17.1"></a>
## [2.17.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.17.0...v2.17.1) (2020-02-01)

### Bug Fixes

* **backend:** updateOptions can be use with partial options - TS type ([2a8a0a4](https://github.com/ghiscoding/aurelia-slickgrid/commit/2a8a0a4))
* **locales:** fix some Locales not showing up when not using I18N ([#300](https://github.com/ghiscoding/aurelia-slickgrid/issues/300)) ([a07bf23](https://github.com/ghiscoding/aurelia-slickgrid/commit/a07bf23))

<a name="2.17.0"></a>
# [2.17.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.16.5...v2.17.0) (2020-02-01)

### Bug Fixes

* **build:** create & use separate excel-builder package to fix security ([#290](https://github.com/ghiscoding/aurelia-slickgrid/issues/290)) ([06bc52a](https://github.com/ghiscoding/aurelia-slickgrid/commit/06bc52a))
* **filter:** creating blank entry should only be entered once ([8f6533f](https://github.com/ghiscoding/aurelia-slickgrid/commit/8f6533f))
* **filters:** remove filter DOM element IDs to avoid duplicate IDs ([#288](https://github.com/ghiscoding/aurelia-slickgrid/issues/288)) ([35dd3d7](https://github.com/ghiscoding/aurelia-slickgrid/commit/35dd3d7))
* **footer:** fix Custom Footer styling issues with Bootstrap 4 ([#289](https://github.com/ghiscoding/aurelia-slickgrid/issues/289)) ([9d8f3f3](https://github.com/ghiscoding/aurelia-slickgrid/commit/9d8f3f3))
* **formatter:** refine condition to display a checkmark icon ([e6edfd5](https://github.com/ghiscoding/aurelia-slickgrid/commit/e6edfd5))
* **graphql:** the query could use a different dataset "id" property ([60a9c45](https://github.com/ghiscoding/aurelia-slickgrid/commit/60a9c45))
* **header:** column header grouping should be re-render after a resize ([2ef9ea4](https://github.com/ghiscoding/aurelia-slickgrid/commit/2ef9ea4))
* **menu:** remove unused code in Context Menu to select cell ([b746b5c](https://github.com/ghiscoding/aurelia-slickgrid/commit/b746b5c))
* **paginations:** fix Grid State dbl event and some Pagination issues ([#294](https://github.com/ghiscoding/aurelia-slickgrid/issues/294)) ([efe5748](https://github.com/ghiscoding/aurelia-slickgrid/commit/efe5748))
* **resizer:** grid size fix for backend service with pagination disabled ([77aa5eb](https://github.com/ghiscoding/aurelia-slickgrid/commit/77aa5eb))
* **rowDetail:** add datasetIdPropertyName option in Row Detail ([#299](https://github.com/ghiscoding/aurelia-slickgrid/issues/299)) ([e8ce045](https://github.com/ghiscoding/aurelia-slickgrid/commit/e8ce045))
* **test:** fix failing Cypress E2E test after GraphQL changes ([b4d780f](https://github.com/ghiscoding/aurelia-slickgrid/commit/b4d780f))
* **tests:** add and fix Jest unit test ([f6e20f6](https://github.com/ghiscoding/aurelia-slickgrid/commit/f6e20f6))

### Features

* **backend:** add OData & GraphQL Service API interfaces ([6995f64](https://github.com/ghiscoding/aurelia-slickgrid/commit/6995f64))
* **backend:** add option to use local filtering/sorting strategy ([df96b3e](https://github.com/ghiscoding/aurelia-slickgrid/commit/df96b3e))
* **columnGroup:** add columnGroupKey property in order to use translate ([#292](https://github.com/ghiscoding/aurelia-slickgrid/issues/292)) ([9d225ae](https://github.com/ghiscoding/aurelia-slickgrid/commit/9d225ae))
* **examples:** add new GraphQL without Pagination Example ([b667dbe](https://github.com/ghiscoding/aurelia-slickgrid/commit/b667dbe))
* **footer:** add custom footer to show metrics ([92b4c8d](https://github.com/ghiscoding/aurelia-slickgrid/commit/92b4c8d))
* **menus:** add "onAfterMenuShow" event to all possible menu plugins ([#297](https://github.com/ghiscoding/aurelia-slickgrid/issues/297)) ([c7f2e7a](https://github.com/ghiscoding/aurelia-slickgrid/commit/c7f2e7a))
* **pagination:** add Pagination to local grid ([#286](https://github.com/ghiscoding/aurelia-slickgrid/issues/286)) ([d655040](https://github.com/ghiscoding/aurelia-slickgrid/commit/d655040))
* **rowDetail:** add few object instances that can be used in child comp ([#285](https://github.com/ghiscoding/aurelia-slickgrid/issues/285)) ([e1a389a](https://github.com/ghiscoding/aurelia-slickgrid/commit/e1a389a)), closes [1#comment105578997_59661868](https://github.com/1/issues/comment105578997_59661868)
* **selection:** add flag to disable syncGridSelection w/BackendService ([#298](https://github.com/ghiscoding/aurelia-slickgrid/issues/298)) ([6a8cc4f](https://github.com/ghiscoding/aurelia-slickgrid/commit/6a8cc4f))
* **selection:** preserve row selection & add it to Grid State & Presets ([#296](https://github.com/ghiscoding/aurelia-slickgrid/issues/296)) ([af9deea](https://github.com/ghiscoding/aurelia-slickgrid/commit/af9deea))

<a name="2.16.5"></a>
## [2.16.5](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.16.4...v2.16.5) (2020-01-11)

### Bug Fixes

* **build:** warning on a missing DOMpurify TS Type ([4436b2b](https://github.com/ghiscoding/aurelia-slickgrid/commit/4436b2b))
* **styling:** use latest SlickGrid version and fix some styling issues ([52308eb](https://github.com/ghiscoding/aurelia-slickgrid/commit/52308eb))

<a name="2.16.4"></a>
## [2.16.4](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.16.3...v2.16.4) (2020-01-07)

### Features

* **styling:** add more SASS variables to header menu ([70afcd8](https://github.com/ghiscoding/aurelia-slickgrid/commit/70afcd8))

<a name="2.16.3"></a>
## [2.16.3](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.16.2...v2.16.3) (2020-01-04)

### Bug Fixes

* **graphql:** add missing updated GraphqlResult interface ([5db9538](https://github.com/ghiscoding/aurelia-slickgrid/commit/5db9538))

<a name="2.16.2"></a>
## [2.16.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.16.1...v2.16.2) (2020-01-04)

### Bug Fixes

* **graphql:** disable pagination should remove any page info from query ([d91f74c](https://github.com/ghiscoding/aurelia-slickgrid/commit/d91f74c))

<a name="2.16.1"></a>
## [2.16.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.16.0...v2.16.1) (2019-12-21)

### Bug Fixes

* **translations:** align all Export translations and add missing locales ([fc480b6](https://github.com/ghiscoding/aurelia-slickgrid/commit/fc480b6))

<a name="2.16.0"></a>
# [2.16.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.15.2...v2.16.0) (2019-12-21)

### Bug Fixes

* **example:** show sort icon correctly after grouping ([116bc78](https://github.com/ghiscoding/aurelia-slickgrid/commit/116bc78))

### Features

* **cellMenu:** starting adding new CellMenu Extension ([d7ed48a](https://github.com/ghiscoding/aurelia-slickgrid/commit/d7ed48a))
* **menu:** add action & override callbacks to all Menu plugins ([d59b341](https://github.com/ghiscoding/aurelia-slickgrid/commit/d59b341))
* **menu:** add Context Menu feature POC ([866969d](https://github.com/ghiscoding/aurelia-slickgrid/commit/866969d))
* **menu:** starting adding new ContextMenu Extension ([a60d5ae](https://github.com/ghiscoding/aurelia-slickgrid/commit/a60d5ae))
* **styling:** change Column Picker & Grid Menu styling ([8465191](https://github.com/ghiscoding/aurelia-slickgrid/commit/8465191))

<a name="2.15.2"></a>
## [2.15.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.15.1...v2.15.2) (2019-12-19)

### Bug Fixes

* **backend:** make sure pagination object exist before using it ([3123597](https://github.com/ghiscoding/aurelia-slickgrid/commit/3123597))
* **sort:** add sort icons to grouping examples ([8bb6dec](https://github.com/ghiscoding/aurelia-slickgrid/commit/8bb6dec))
* **typing:** gulp dependency and typings fix ([80db485](https://github.com/ghiscoding/aurelia-slickgrid/commit/80db485))

### Features

* **tests:** add missing tests for full coverage ([b8cd451](https://github.com/ghiscoding/aurelia-slickgrid/commit/b8cd451))

<a name="2.15.1"></a>
## [2.15.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.15.0...v2.15.1) (2019-11-30)

### Bug Fixes

* **editor:** Select Editor with option "0" were incorrectly filtered out ([3a4258b](https://github.com/ghiscoding/aurelia-slickgrid/commit/3a4258b))
* **editor:** Select Editor with option "0" were incorrectly filtered out ([a22e300](https://github.com/ghiscoding/aurelia-slickgrid/commit/a22e300))
* **filter:** Date Filters using Flatpickr throw error w/invalid locale ([2e6a7cc](https://github.com/ghiscoding/aurelia-slickgrid/commit/2e6a7cc))
* **filter:** default operator of input filter should be empty ([37f031a](https://github.com/ghiscoding/aurelia-slickgrid/commit/37f031a))
* **filter:** number filter condition, parse number before comparing ([1c4ed2d](https://github.com/ghiscoding/aurelia-slickgrid/commit/1c4ed2d))
* **filter:** updateFilters w/BackendService should call query only once ([bd6749e](https://github.com/ghiscoding/aurelia-slickgrid/commit/bd6749e))
* **filter:** updateFilters w/BackendService should call query only once ([#265](https://github.com/ghiscoding/aurelia-slickgrid/issues/265)) ([0a5e43a](https://github.com/ghiscoding/aurelia-slickgrid/commit/0a5e43a))

### Features

* **tests:** add Cypress E2E test to cover i18n grid and text filter ([97be0ad](https://github.com/ghiscoding/aurelia-slickgrid/commit/97be0ad))
* **tests:** add more unit tests & cleanup some code ([74cd00d](https://github.com/ghiscoding/aurelia-slickgrid/commit/74cd00d))

<a name="2.15.0"></a>
# [2.15.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.14.3...v2.15.0) (2019-11-24)

### Bug Fixes

* **odata:** no quote escape required for IN operator w/non-string column ([#262](https://github.com/ghiscoding/aurelia-slickgrid/issues/262)) ([8027922](https://github.com/ghiscoding/aurelia-slickgrid/commit/8027922))
* **picker:** make sure picker addon is available before translating ([78a7a56](https://github.com/ghiscoding/aurelia-slickgrid/commit/78a7a56))

### Features

* **events:** allow to bypass changed events when calling updateFilters/Sorting ([#263](https://github.com/ghiscoding/aurelia-slickgrid/issues/263)) ([055fb95](https://github.com/ghiscoding/aurelia-slickgrid/commit/055fb95))
* **examples:** add Dynamic Filters demo set by select dropdown ([706bb4e](https://github.com/ghiscoding/aurelia-slickgrid/commit/706bb4e))
* **filters:** provide method to apply grid filters dynamically ([#258](https://github.com/ghiscoding/aurelia-slickgrid/issues/258)) ([3433686](https://github.com/ghiscoding/aurelia-slickgrid/commit/3433686))
* **sorting:** provide method to apply grid sorting dynamically ([#261](https://github.com/ghiscoding/aurelia-slickgrid/issues/261)) ([7782767](https://github.com/ghiscoding/aurelia-slickgrid/commit/7782767))

<a name="2.14.3"></a>
## [2.14.3](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.14.2...v2.14.3) (2019-11-14)

### Bug Fixes

* **firefox:** fix thousand separator throws regex console error ([688bacb](https://github.com/ghiscoding/aurelia-slickgrid/commit/688bacb))

<a name="2.14.2"></a>
## [2.14.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.14.1...v2.14.2) (2019-11-09)

### Bug Fixes

* **pagination:** never display page 0, minimum should be page 1 ([#256](https://github.com/ghiscoding/aurelia-slickgrid/issues/256)) ([8ce753c](https://github.com/ghiscoding/aurelia-slickgrid/commit/8ce753c))

### Features

* **build:** reorganized lib into its own "custom-elements" folder ([#257](https://github.com/ghiscoding/aurelia-slickgrid/issues/257)) ([dc99f51](https://github.com/ghiscoding/aurelia-slickgrid/commit/dc99f51))
* **formatterOptions:** add decimal,thousand separator to all Formatters ([#255](https://github.com/ghiscoding/aurelia-slickgrid/issues/255)) ([fd67f26](https://github.com/ghiscoding/aurelia-slickgrid/commit/fd67f26))
* **tests:** add missing unit tests for Excel Export Service ([#254](https://github.com/ghiscoding/aurelia-slickgrid/issues/254)) ([9ede722](https://github.com/ghiscoding/aurelia-slickgrid/commit/9ede722))

<a name="2.14.1"></a>
## [2.14.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.14.0...v2.14.1) (2019-11-02)

### Bug Fixes

* **bundler:** add Excel Builder support for RequireJS/SystemJS ([b992187](https://github.com/ghiscoding/aurelia-slickgrid/commit/b992187))
* **editor:** use editorOptions only  ([#246](https://github.com/ghiscoding/aurelia-slickgrid/issues/246)) ([a0604b5](https://github.com/ghiscoding/aurelia-slickgrid/commit/a0604b5))
* **graphql:** pagination offset should never be below zero ([#250](https://github.com/ghiscoding/aurelia-slickgrid/issues/250)) ([199ae83](https://github.com/ghiscoding/aurelia-slickgrid/commit/199ae83))
* **odata:** filter with single quote should be escaped ([#251](https://github.com/ghiscoding/aurelia-slickgrid/issues/251)) ([46bb0c7](https://github.com/ghiscoding/aurelia-slickgrid/commit/46bb0c7)), closes [#328](https://github.com/ghiscoding/aurelia-slickgrid/issues/328)
* **styling:** hidden menu visible in BS4 for Picker/Grid Menu ([9e06f2c](https://github.com/ghiscoding/aurelia-slickgrid/commit/9e06f2c)), closes [#321](https://github.com/ghiscoding/aurelia-slickgrid/issues/321)
* **tests:** fix a Jest async unit test not resolving ([#252](https://github.com/ghiscoding/aurelia-slickgrid/issues/252)) ([c1c64f3](https://github.com/ghiscoding/aurelia-slickgrid/commit/c1c64f3))

### Features

* **cypress:** add Pagination Service Cypress E2E tests ([#245](https://github.com/ghiscoding/aurelia-slickgrid/issues/245)) ([9ad8bf6](https://github.com/ghiscoding/aurelia-slickgrid/commit/9ad8bf6))
* **frozen:** fix header grouping grid with frozen columns ([#239](https://github.com/ghiscoding/aurelia-slickgrid/issues/239)) ([30cb09d](https://github.com/ghiscoding/aurelia-slickgrid/commit/30cb09d))
* **rowDetail:** expose public all render/redraw methods of Row Detail ([25acddf](https://github.com/ghiscoding/aurelia-slickgrid/commit/25acddf))
* **styling:** improve header menu styling ([511ce3b](https://github.com/ghiscoding/aurelia-slickgrid/commit/511ce3b))
* **tests:** add Aurelia-Slickgrid custom element tests ([#247](https://github.com/ghiscoding/aurelia-slickgrid/issues/247)) ([2400dd1](https://github.com/ghiscoding/aurelia-slickgrid/commit/2400dd1))
* **tests:** add more Aurelia-Slickgrid unit tests ([#253](https://github.com/ghiscoding/aurelia-slickgrid/issues/253)) ([9b6d25f](https://github.com/ghiscoding/aurelia-slickgrid/commit/9b6d25f))
* **tests:** add Slick-Pagination Component unit tests ([#242](https://github.com/ghiscoding/aurelia-slickgrid/issues/242)) ([fdf440c](https://github.com/ghiscoding/aurelia-slickgrid/commit/fdf440c))

<a name="2.14.0"></a>
# [2.14.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.13.5...v2.14.0) (2019-10-19)

### Bug Fixes

* **backend:** query should not include pagination option when disabled ([#220](https://github.com/ghiscoding/aurelia-slickgrid/issues/220)) ([e9731d9](https://github.com/ghiscoding/aurelia-slickgrid/commit/e9731d9))
* **editor:** autocommit should not save if value is the same as before ([#238](https://github.com/ghiscoding/aurelia-slickgrid/issues/238)) ([78d1d81](https://github.com/ghiscoding/aurelia-slickgrid/commit/78d1d81))
* **editor:** provide complex object override path for select editor ([#237](https://github.com/ghiscoding/aurelia-slickgrid/issues/237)) ([bb467cd](https://github.com/ghiscoding/aurelia-slickgrid/commit/bb467cd))
* **editors:** complex objects should work with all editors ([#226](https://github.com/ghiscoding/aurelia-slickgrid/issues/226)) ([b792863](https://github.com/ghiscoding/aurelia-slickgrid/commit/b792863))
* **filter:** should be able to filter even on hidden columns ([#236](https://github.com/ghiscoding/aurelia-slickgrid/issues/236)) ([390fe8a](https://github.com/ghiscoding/aurelia-slickgrid/commit/390fe8a))
* **gridService:** addItem/updatedItemById pass array to setSelectedRows ([#234](https://github.com/ghiscoding/aurelia-slickgrid/issues/234)) ([96d04cc](https://github.com/ghiscoding/aurelia-slickgrid/commit/96d04cc))
* **gridService:** refactor the code and add more unit tests ([8a4d438](https://github.com/ghiscoding/aurelia-slickgrid/commit/8a4d438))
* **gridService:** upsertItem(s) should trigger onItemAdded/Updated event ([#231](https://github.com/ghiscoding/aurelia-slickgrid/issues/231)) ([11c3c52](https://github.com/ghiscoding/aurelia-slickgrid/commit/11c3c52))
* **styling:** styling issue in Firefox after col reordering ([#228](https://github.com/ghiscoding/aurelia-slickgrid/issues/228)) ([a737cdf](https://github.com/ghiscoding/aurelia-slickgrid/commit/a737cdf))

### Features

* **backend:** extract Pagination into its own Service to expose methods ([#230](https://github.com/ghiscoding/aurelia-slickgrid/issues/230)) ([9af863d](https://github.com/ghiscoding/aurelia-slickgrid/commit/9af863d))
* **conditions:** add field type float/integer to sorters/filters util ([#233](https://github.com/ghiscoding/aurelia-slickgrid/issues/233)) ([017f93d](https://github.com/ghiscoding/aurelia-slickgrid/commit/017f93d))
* **export:** add delimiter/listSeparator override to use with GraphQL ([#232](https://github.com/ghiscoding/aurelia-slickgrid/issues/232)) ([c4ae19d](https://github.com/ghiscoding/aurelia-slickgrid/commit/c4ae19d))
* **export:** add Export to Excel feature ([#235](https://github.com/ghiscoding/aurelia-slickgrid/issues/235)) ([feeb6ad](https://github.com/ghiscoding/aurelia-slickgrid/commit/feeb6ad))
* **filter:** add unit test suite for multiple Filters ([#221](https://github.com/ghiscoding/aurelia-slickgrid/issues/221)) ([f0a526d](https://github.com/ghiscoding/aurelia-slickgrid/commit/f0a526d))
* **insert:** add option to insert item at bottom of grid ([#229](https://github.com/ghiscoding/aurelia-slickgrid/issues/229)) ([ed759e8](https://github.com/ghiscoding/aurelia-slickgrid/commit/ed759e8))
* **metrics:** deprecated Statistic and renamed to Metrics ([#225](https://github.com/ghiscoding/aurelia-slickgrid/issues/225)) ([147c894](https://github.com/ghiscoding/aurelia-slickgrid/commit/147c894))
* **odata:** add "enableCount" flag to add to OData query ([#224](https://github.com/ghiscoding/aurelia-slickgrid/issues/224)) ([5018ca8](https://github.com/ghiscoding/aurelia-slickgrid/commit/5018ca8))
* **sorters:** consolidate & provide all date sorters ([#218](https://github.com/ghiscoding/aurelia-slickgrid/issues/218)) ([f8e2127](https://github.com/ghiscoding/aurelia-slickgrid/commit/f8e2127))
* **tests:** add AutoComplete Filter & Editor Unit Tests ([#222](https://github.com/ghiscoding/aurelia-slickgrid/issues/222)) ([77bb18b](https://github.com/ghiscoding/aurelia-slickgrid/commit/77bb18b))
* **tests:** add missing AutoComplete unit tests ([dd04d4e](https://github.com/ghiscoding/aurelia-slickgrid/commit/dd04d4e))
* **tests:** add unit tests for SingleSelect & MultipleSelect Filters ([#219](https://github.com/ghiscoding/aurelia-slickgrid/issues/219)) ([42e38a6](https://github.com/ghiscoding/aurelia-slickgrid/commit/42e38a6))

<a name="2.13.5"></a>
## [2.13.5](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.13.4...v2.13.5) (2019-08-17)

<a name="2.13.4"></a>
## [2.13.4](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.13.3...v2.13.4) (2019-08-17)

### Bug Fixes

* **i18n:** aurelia-i18n needs to stay a dependency even if optional ([6920fbf](https://github.com/ghiscoding/aurelia-slickgrid/commit/6920fbf))

<a name="2.13.3"></a>
## 2.13.3 (2019-08-17)

### Bug Fixes

* **bs4:** fix another Bootstrap 4 styling ([8a949a6](https://github.com/ghiscoding/aurelia-slickgrid/commit/8a949a6))

<a name="2.13.3"></a>
## [2.13.3](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.13.2...v2.13.3) (2019-08-17)

### Bug Fixes

* **bs4:** fix some Bootstrap 4 styling ([432bad0](https://github.com/ghiscoding/aurelia-slickgrid/commit/432bad0))

<a name="2.13.2"></a>
## [2.13.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.13.1...v2.13.2) (2019-08-17)

<a name="2.13.1"></a>
## [2.13.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.13.0...v2.13.1) (2019-08-17)

<a name="2.13.0"></a>
# 2.13.0 (2019-08-17)

<a name="2.13.0"></a>
# [2.13.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.12.3...v2.13.0) (2019-08-17)

### Bug Fixes

* **dom:** ColumnPicker & GridMenu were creating multiple DOM elements ([#205](https://github.com/ghiscoding/aurelia-slickgrid/issues/205)) ([901da5e](https://github.com/ghiscoding/aurelia-slickgrid/commit/901da5e))
* **editor:** fix negative number in floatEditor ([c02379b](https://github.com/ghiscoding/aurelia-slickgrid/commit/c02379b))
* **odata:** use contains with OData version 4 ([#215](https://github.com/ghiscoding/aurelia-slickgrid/issues/215)) ([2ff9a91](https://github.com/ghiscoding/aurelia-slickgrid/commit/2ff9a91)), closes [#263](https://github.com/ghiscoding/aurelia-slickgrid/issues/263)
* **presets:** Grid State & Presets stopped working for columns ([#213](https://github.com/ghiscoding/aurelia-slickgrid/issues/213)) ([d1949aa](https://github.com/ghiscoding/aurelia-slickgrid/commit/d1949aa))
* **selection:** selected row should be none after filtering ([#210](https://github.com/ghiscoding/aurelia-slickgrid/issues/210)) ([315a8b8](https://github.com/ghiscoding/aurelia-slickgrid/commit/315a8b8))

### Features

* **cypress:** add Cypress E2E testing to CircleCI build ([#207](https://github.com/ghiscoding/aurelia-slickgrid/issues/207)) ([1d3e341](https://github.com/ghiscoding/aurelia-slickgrid/commit/1d3e341))
* **filter:** add filter search range functionality ([#214](https://github.com/ghiscoding/aurelia-slickgrid/issues/214)) ([e9298ed](https://github.com/ghiscoding/aurelia-slickgrid/commit/e9298ed))
* **filter:** add optional placeholder to multiple select ([dc6a2f6](https://github.com/ghiscoding/aurelia-slickgrid/commit/dc6a2f6))
* **registry:** add npm package info for github package registry ([7727c3c](https://github.com/ghiscoding/aurelia-slickgrid/commit/7727c3c))
* **tests:** add Cypress E2E tests to cover hidden columns ([#211](https://github.com/ghiscoding/aurelia-slickgrid/issues/211)) ([c76ca3e](https://github.com/ghiscoding/aurelia-slickgrid/commit/c76ca3e))
* **translate:** make I18N an optional dependency ([#208](https://github.com/ghiscoding/aurelia-slickgrid/issues/208)) ([6bb9056](https://github.com/ghiscoding/aurelia-slickgrid/commit/6bb9056))

<a name="2.12.3"></a>
## [2.12.3](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.12.2...v2.12.3) (2019-07-25)

### Bug Fixes

* **backend:** clear empty filter by header menu not stopping spinner ([#206](https://github.com/ghiscoding/aurelia-slickgrid/issues/206)) ([1537315](https://github.com/ghiscoding/aurelia-slickgrid/commit/1537315))
* **gridMenu:** adding user customItems in GridMenu was no longer showing ([#209](https://github.com/ghiscoding/aurelia-slickgrid/issues/209)) ([38c1c4c](https://github.com/ghiscoding/aurelia-slickgrid/commit/38c1c4c))
* **gridMenu:** external grid menu was not triggering ([#204](https://github.com/ghiscoding/aurelia-slickgrid/issues/204)) ([2f83774](https://github.com/ghiscoding/aurelia-slickgrid/commit/2f83774))

### Features

* **cypress:** add Cypress E2E testing to CircleCI build ([5d9d5fb](https://github.com/ghiscoding/aurelia-slickgrid/commit/5d9d5fb))

<a name="2.12.2"></a>
## [2.12.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.12.1...v2.12.2) (2019-07-13)

### Bug Fixes

* **export:** exporting null or undefined should replace by empty string ([06f9e00](https://github.com/ghiscoding/aurelia-slickgrid/commit/06f9e00))
* **menu:** Column Picker & Grid Menu not updated dynamically ([#200](https://github.com/ghiscoding/aurelia-slickgrid/issues/200)) ([5b88df0](https://github.com/ghiscoding/aurelia-slickgrid/commit/5b88df0))
* **slickgrid:** use previous version of Slickgrid to fix column autosize ([9d90cb6](https://github.com/ghiscoding/aurelia-slickgrid/commit/9d90cb6))

### Features

* **tests:** add ExportService full test suite ([#201](https://github.com/ghiscoding/aurelia-slickgrid/issues/201)) ([01fbb6b](https://github.com/ghiscoding/aurelia-slickgrid/commit/01fbb6b))
* **tests:** add more ResizerService tests ([#203](https://github.com/ghiscoding/aurelia-slickgrid/issues/203)) ([ad6f698](https://github.com/ghiscoding/aurelia-slickgrid/commit/ad6f698))

<a name="2.12.1"></a>
## [2.12.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.12.0...v2.12.1) (2019-07-03)

### Bug Fixes

* **filterService:** regression introduced in "clearFilters" last commit ([0a0cd8e](https://github.com/ghiscoding/aurelia-slickgrid/commit/0a0cd8e))

<a name="2.12.0"></a>
# [2.12.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.11.3...v2.12.0) (2019-07-02)

### Bug Fixes

* **backend:** regression in both backend service with gridstate ([b77c15e](https://github.com/ghiscoding/aurelia-slickgrid/commit/b77c15e))
* **filter:** regression, small issue detected when using compound filter ([d32e0a0](https://github.com/ghiscoding/aurelia-slickgrid/commit/d32e0a0))

### Features

* **build:** replace moment with moment-mini for smaller build ([3a0b2a9](https://github.com/ghiscoding/aurelia-slickgrid/commit/3a0b2a9))
* **tests:** add AureliaUtilService full test suite ([#195](https://github.com/ghiscoding/aurelia-slickgrid/issues/195)) ([a7fca15](https://github.com/ghiscoding/aurelia-slickgrid/commit/a7fca15))
* **tests:** add more unit tests to FilterService ([#199](https://github.com/ghiscoding/aurelia-slickgrid/issues/199)) ([7bf603f](https://github.com/ghiscoding/aurelia-slickgrid/commit/7bf603f))
* **tests:** add some unit tests for FilterService ([#198](https://github.com/ghiscoding/aurelia-slickgrid/issues/198)) ([6097a8d](https://github.com/ghiscoding/aurelia-slickgrid/commit/6097a8d))

<a name="2.11.3"></a>
## [2.11.3](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.11.2...v2.11.3) (2019-06-18)

### Bug Fixes

* **core:** update to latest SlickGrid version to fix column resize ([4590844](https://github.com/ghiscoding/aurelia-slickgrid/commit/4590844))
* **queryField:** queryFieldFilter and queryFieldSorter have precedence ([#191](https://github.com/ghiscoding/aurelia-slickgrid/issues/191)) ([73c8f37](https://github.com/ghiscoding/aurelia-slickgrid/commit/73c8f37))
* **singleton:** all Services should be singleton, fixes [#190](https://github.com/ghiscoding/aurelia-slickgrid/issues/190) ([#192](https://github.com/ghiscoding/aurelia-slickgrid/issues/192)) ([0bbb0ae](https://github.com/ghiscoding/aurelia-slickgrid/commit/0bbb0ae))

### Features

* **example:** add Bootstrap Tabs example ([8255772](https://github.com/ghiscoding/aurelia-slickgrid/commit/8255772))
* **odata:** add presets to GridOdata Service (and unit tests) ([#193](https://github.com/ghiscoding/aurelia-slickgrid/issues/193)) ([64b07fe](https://github.com/ghiscoding/aurelia-slickgrid/commit/64b07fe))
* **tests:** add GraphqlQueryBuilder unit tests ([#189](https://github.com/ghiscoding/aurelia-slickgrid/issues/189)) ([3f9edba](https://github.com/ghiscoding/aurelia-slickgrid/commit/3f9edba))
* **tests:** add missing sorterUtilities test ([#188](https://github.com/ghiscoding/aurelia-slickgrid/issues/188)) ([a2f5a67](https://github.com/ghiscoding/aurelia-slickgrid/commit/a2f5a67))
* **tests:** add more RowDetailViewExtension unit tests ([#187](https://github.com/ghiscoding/aurelia-slickgrid/issues/187)) ([ffd9f0f](https://github.com/ghiscoding/aurelia-slickgrid/commit/ffd9f0f))

<a name="2.11.2"></a>
## [2.11.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.11.1...v2.11.2) (2019-06-08)

<a name="2.11.1"></a>
## [2.11.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.11.0...v2.11.1) (2019-06-08)

<a name="2.11.0"></a>
# [2.11.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.10.1...v2.11.0) (2019-06-08)

### Bug Fixes

* **copy:** copy+paste cells was not working ([#160](https://github.com/ghiscoding/aurelia-slickgrid/issues/160)) ([7d5090a](https://github.com/ghiscoding/aurelia-slickgrid/commit/7d5090a))
* **dateEditor:** allow backspace for deleting a date ([7ddb0cc](https://github.com/ghiscoding/aurelia-slickgrid/commit/7ddb0cc))
* **editor:** dynamically adding editor column throws error ([#181](https://github.com/ghiscoding/aurelia-slickgrid/issues/181)) ([41517d4](https://github.com/ghiscoding/aurelia-slickgrid/commit/41517d4))
* **editor:** force user input in autocomplete ([15cfa2d](https://github.com/ghiscoding/aurelia-slickgrid/commit/15cfa2d))
* **editor:** integer editor was always showing invalid when null value ([#180](https://github.com/ghiscoding/aurelia-slickgrid/issues/180)) ([ca7c591](https://github.com/ghiscoding/aurelia-slickgrid/commit/ca7c591))
* **gridState:** columnPicker & gridMenu not triggering gridState change ([#170](https://github.com/ghiscoding/aurelia-slickgrid/issues/170)) ([01e5a56](https://github.com/ghiscoding/aurelia-slickgrid/commit/01e5a56))
* **height:** should throw error when no height or enableAutoResize ([70f069c](https://github.com/ghiscoding/aurelia-slickgrid/commit/70f069c))
* **rowDetail:** update to latest SlickGrid version to fix scrolling ([c159be0](https://github.com/ghiscoding/aurelia-slickgrid/commit/c159be0))
* **selection:** styling of row selection is incorrect when adding rows ([325ff0b](https://github.com/ghiscoding/aurelia-slickgrid/commit/325ff0b))
* **selection:** syncGridSelection and preserveHidden ([#173](https://github.com/ghiscoding/aurelia-slickgrid/issues/173)) ([bc33773](https://github.com/ghiscoding/aurelia-slickgrid/commit/bc33773))

### Features

* **build:** add Codecov badge to show coverage ([601078a](https://github.com/ghiscoding/aurelia-slickgrid/commit/601078a))
* **build:** add Cypress CI to build plan ([4e7b1fa](https://github.com/ghiscoding/aurelia-slickgrid/commit/4e7b1fa))
* **copy:** add ExcelCopyBufferOptions to grid option ([#178](https://github.com/ghiscoding/aurelia-slickgrid/issues/178)) ([b309e82](https://github.com/ghiscoding/aurelia-slickgrid/commit/b309e82))
* **demo:** add custom formatter with onCellClick ([dd4d109](https://github.com/ghiscoding/aurelia-slickgrid/commit/dd4d109))
* **euro:** add Euro Formatters and Sorters (day/month/year) ([#168](https://github.com/ghiscoding/aurelia-slickgrid/issues/168)) ([ab408a1](https://github.com/ghiscoding/aurelia-slickgrid/commit/ab408a1))
* **formatter:** add formatterOptions to Formatters, Grouping Formatters ([#166](https://github.com/ghiscoding/aurelia-slickgrid/issues/166)) ([015476d](https://github.com/ghiscoding/aurelia-slickgrid/commit/015476d))
* **formatters:** consolidate all Date Formatters into 1 method call DRY ([#169](https://github.com/ghiscoding/aurelia-slickgrid/issues/169)) ([4bcb74b](https://github.com/ghiscoding/aurelia-slickgrid/commit/4bcb74b))
* **gridService:** add "upsertItem" method to Grid Service ([#179](https://github.com/ghiscoding/aurelia-slickgrid/issues/179)) ([e65609b](https://github.com/ghiscoding/aurelia-slickgrid/commit/e65609b))
* **jest:** add few more Formatter unit tests & fixed some Formatters ([0d8ca4a](https://github.com/ghiscoding/aurelia-slickgrid/commit/0d8ca4a))
* **menu:** add options to exclude column titles from Menus ([#176](https://github.com/ghiscoding/aurelia-slickgrid/issues/176)) ([71d290d](https://github.com/ghiscoding/aurelia-slickgrid/commit/71d290d))
* **resizer:** add calculateAvailableSizeBy container option ([#161](https://github.com/ghiscoding/aurelia-slickgrid/issues/161)) ([2085a62](https://github.com/ghiscoding/aurelia-slickgrid/commit/2085a62))
* **resizer:** add new method "pauseResizer" ([#183](https://github.com/ghiscoding/aurelia-slickgrid/issues/183)) ([72fa5db](https://github.com/ghiscoding/aurelia-slickgrid/commit/72fa5db))
* **rowDetail:** add option to limit expanded row to only 1 at a time ([#177](https://github.com/ghiscoding/aurelia-slickgrid/issues/177)) ([e835b34](https://github.com/ghiscoding/aurelia-slickgrid/commit/e835b34))
* **test:** add lib index entry point unit tests ([#163](https://github.com/ghiscoding/aurelia-slickgrid/issues/163)) ([5c6d028](https://github.com/ghiscoding/aurelia-slickgrid/commit/5c6d028))
* **tests:** add Aggregators full test suite ([802521a](https://github.com/ghiscoding/aurelia-slickgrid/commit/802521a))
* **tests:** add Extension Service full test suite ([#174](https://github.com/ghiscoding/aurelia-slickgrid/issues/174)) ([55c3502](https://github.com/ghiscoding/aurelia-slickgrid/commit/55c3502))
* **tests:** add few Grid Service unit tests ([#182](https://github.com/ghiscoding/aurelia-slickgrid/issues/182)) ([b34b585](https://github.com/ghiscoding/aurelia-slickgrid/commit/b34b585))
* **tests:** add Grouping Formatters full test suite ([#165](https://github.com/ghiscoding/aurelia-slickgrid/issues/165)) ([f9a7872](https://github.com/ghiscoding/aurelia-slickgrid/commit/f9a7872))
* **tests:** add missing Formatter unit tests ([#162](https://github.com/ghiscoding/aurelia-slickgrid/issues/162)) ([51c0bbd](https://github.com/ghiscoding/aurelia-slickgrid/commit/51c0bbd))
* **tests:** add more Extensions unit tests ([#184](https://github.com/ghiscoding/aurelia-slickgrid/issues/184)) ([5f6f3b0](https://github.com/ghiscoding/aurelia-slickgrid/commit/5f6f3b0))
* **tests:** add more RowDetailExtension tests ([#185](https://github.com/ghiscoding/aurelia-slickgrid/issues/185)) ([e4d99e9](https://github.com/ghiscoding/aurelia-slickgrid/commit/e4d99e9))
* **tests:** add Service Utilities full test suite ([#167](https://github.com/ghiscoding/aurelia-slickgrid/issues/167)) ([e6e4ed8](https://github.com/ghiscoding/aurelia-slickgrid/commit/e6e4ed8))
* **tests:** add Sorters full test suite ([#164](https://github.com/ghiscoding/aurelia-slickgrid/issues/164)) ([d375939](https://github.com/ghiscoding/aurelia-slickgrid/commit/d375939))

<a name="2.10.1"></a>
## [2.10.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.10.0...v2.10.1) (2019-04-21)

<a name="2.10.0"></a>
# [2.10.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.9.2...v2.10.0) (2019-04-21)

### Bug Fixes

* **backend:** Filter presets is getting removed when calling sort ([98e8199](https://github.com/ghiscoding/aurelia-slickgrid/commit/98e8199))
* **formatter:** rewrite formatter do what it was supposed to do ([9100e2c](https://github.com/ghiscoding/aurelia-slickgrid/commit/9100e2c))
* **headerMenu:** calling "Clear Filter" was calling incorrect grid state ([a699c45](https://github.com/ghiscoding/aurelia-slickgrid/commit/a699c45))
* **input:** remove autocomplete from all Editors & Filters ([6db160e](https://github.com/ghiscoding/aurelia-slickgrid/commit/6db160e))
* **input:** remove autocomplete from all Editors & Filters again ([437e913](https://github.com/ghiscoding/aurelia-slickgrid/commit/437e913))
* **pageSizes:** setting different sizes extend global sizes, fixes [#150](https://github.com/ghiscoding/aurelia-slickgrid/issues/150) ([d64cf9a](https://github.com/ghiscoding/aurelia-slickgrid/commit/d64cf9a))
* **rowDetail:** use latest Github SlickGrid code, temporary fix ([c4a319b](https://github.com/ghiscoding/aurelia-slickgrid/commit/c4a319b))
* **select:** sync multiple-select.js with core lib & fix some js event ([a9b6093](https://github.com/ghiscoding/aurelia-slickgrid/commit/a9b6093))

### Features

* **e2e:** add Jest & Cypress to the lib ([#148](https://github.com/ghiscoding/aurelia-slickgrid/issues/148)) ([9905245](https://github.com/ghiscoding/aurelia-slickgrid/commit/9905245))
* **editor:** add title attribute to all Editors ([#156](https://github.com/ghiscoding/aurelia-slickgrid/issues/156)) ([6e0d125](https://github.com/ghiscoding/aurelia-slickgrid/commit/6e0d125))
* **filter:** add demo of single search filter, closes [#152](https://github.com/ghiscoding/aurelia-slickgrid/issues/152) ([#157](https://github.com/ghiscoding/aurelia-slickgrid/issues/157)) ([919872e](https://github.com/ghiscoding/aurelia-slickgrid/commit/919872e))
* **filters:** add flag to optionally trim filter white spaces ([f0496fb](https://github.com/ghiscoding/aurelia-slickgrid/commit/f0496fb))
* **jest:** write a couple more Jest unit tests ([35537ba](https://github.com/ghiscoding/aurelia-slickgrid/commit/35537ba))
* **rowDetail:** user can override expand icon logic ([#154](https://github.com/ghiscoding/aurelia-slickgrid/issues/154)) ([4c887c6](https://github.com/ghiscoding/aurelia-slickgrid/commit/4c887c6))
* **rowSelection:** user can override row selection checkbox logic ([#155](https://github.com/ghiscoding/aurelia-slickgrid/issues/155)) ([b5d7546](https://github.com/ghiscoding/aurelia-slickgrid/commit/b5d7546))

<a name="2.9.2"></a>
## [2.9.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.9.1...v2.9.2) (2019-03-18)

<a name="2.9.1"></a>
## [2.9.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.9.0...v2.9.1) (2019-03-18)

<a name="2.9.0"></a>
# [2.9.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.8.2...v2.9.0) (2019-03-16)

### Bug Fixes

* **cellCopy:** fix a small issue with cell copy ([b31edc4](https://github.com/ghiscoding/aurelia-slickgrid/commit/b31edc4))
* **client-cli:** replace gulp package link, ref issue [#139](https://github.com/ghiscoding/aurelia-slickgrid/issues/139) ([eb662e2](https://github.com/ghiscoding/aurelia-slickgrid/commit/eb662e2))
* **editor:** allow all Editors to work with complex objects ([#145](https://github.com/ghiscoding/aurelia-slickgrid/issues/145)) ([ffa62f3](https://github.com/ghiscoding/aurelia-slickgrid/commit/ffa62f3))
* **example:** multiSelect should be false when using single row select ([a3afa3d](https://github.com/ghiscoding/aurelia-slickgrid/commit/a3afa3d))
* **formatters:** some formatters were not considering empty string ([74bfcaa](https://github.com/ghiscoding/aurelia-slickgrid/commit/74bfcaa))
* **mapDateFormat:** add missing date format in map utility ([fd00013](https://github.com/ghiscoding/aurelia-slickgrid/commit/fd00013))
* **rowDetail:** clear Row Detail content before recreating it ([#146](https://github.com/ghiscoding/aurelia-slickgrid/issues/146)) ([83bb1dd](https://github.com/ghiscoding/aurelia-slickgrid/commit/83bb1dd))
* **RowDetail:** fix missing html tag closing for <template> ([7ddbd6c](https://github.com/ghiscoding/aurelia-slickgrid/commit/7ddbd6c))
* **select:** when destroying Select Filter/Editor, escape dot in name ([1ae74d0](https://github.com/ghiscoding/aurelia-slickgrid/commit/1ae74d0))
* **updateItem:** call grid.updateRow instead of grid.invalidateRow ([8c503a4](https://github.com/ghiscoding/aurelia-slickgrid/commit/8c503a4))

### Features

* **autoHeight:** add autoHeight Grid Option with Example ([#142](https://github.com/ghiscoding/aurelia-slickgrid/issues/142)) ([688173e](https://github.com/ghiscoding/aurelia-slickgrid/commit/688173e))
* **editors:** add "required" and "alwaysSaveOnEnterKey" options ([#141](https://github.com/ghiscoding/aurelia-slickgrid/issues/141)) ([9900f74](https://github.com/ghiscoding/aurelia-slickgrid/commit/9900f74))
* **flatpickr:** add filterOptions & editorOptions ([#147](https://github.com/ghiscoding/aurelia-slickgrid/issues/147)) ([2f829f6](https://github.com/ghiscoding/aurelia-slickgrid/commit/2f829f6))
* **gridMenu:** demo Grid Menu button can be added anywhere ([#144](https://github.com/ghiscoding/aurelia-slickgrid/issues/144)) ([ec4c78a](https://github.com/ghiscoding/aurelia-slickgrid/commit/ec4c78a))
* **rowDetail:** dynamically change row detail view row count ([acb881c](https://github.com/ghiscoding/aurelia-slickgrid/commit/acb881c))

<a name="2.8.2"></a>
## [2.8.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.8.1...v2.8.2) (2019-02-09)

### Bug Fixes

* **filter:** all jquery .on bound event should also be unbound ([#137](https://github.com/ghiscoding/aurelia-slickgrid/issues/137)) ([0570a95](https://github.com/ghiscoding/aurelia-slickgrid/commit/0570a95))
* **filter:** select filter drop doesn't get removed on destroy ([#138](https://github.com/ghiscoding/aurelia-slickgrid/issues/138)) ([d967348](https://github.com/ghiscoding/aurelia-slickgrid/commit/d967348))

<a name="2.8.1"></a>
## [2.8.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.8.0...v2.8.1) (2019-02-02)

### Bug Fixes

* **backend:** debounceTypingDelay on input Filter was no longer working ([#134](https://github.com/ghiscoding/aurelia-slickgrid/issues/134)) ([ab2be81](https://github.com/ghiscoding/aurelia-slickgrid/commit/ab2be81))
* **pagination:** incorrect pagination behavior on adding/removing items ([#135](https://github.com/ghiscoding/aurelia-slickgrid/issues/135)) ([1092282](https://github.com/ghiscoding/aurelia-slickgrid/commit/1092282))

### Features

* **gridService:** add new methods to GridService ([#133](https://github.com/ghiscoding/aurelia-slickgrid/issues/133)) ([e881bd3](https://github.com/ghiscoding/aurelia-slickgrid/commit/e881bd3)), closes [#110](https://github.com/ghiscoding/aurelia-slickgrid/issues/110) [#111](https://github.com/ghiscoding/aurelia-slickgrid/issues/111)

<a name="2.8.0"></a>
# [2.8.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.7.0...v2.8.0) (2019-01-19)

### Bug Fixes

* **filter:** Header Menu Clear Filter not calling Grid State change ([85e34d3](https://github.com/ghiscoding/aurelia-slickgrid/commit/85e34d3))
* **styling:** fix a small styling issue when Filters are filled ([58bb1e1](https://github.com/ghiscoding/aurelia-slickgrid/commit/58bb1e1))

<a name="2.7.0"></a>
# [2.7.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.6.2...v2.7.0) (2019-01-16)

### Bug Fixes

* **autocomplete:** add "ui-front" to parent container of autocomplete ([a2b07ff](https://github.com/ghiscoding/aurelia-slickgrid/commit/a2b07ff))
* **filter:** Select Filter "addBlankEntry" sometimes add 2x entries ([#126](https://github.com/ghiscoding/aurelia-slickgrid/issues/126)) ([e07e726](https://github.com/ghiscoding/aurelia-slickgrid/commit/e07e726))
* **pagination:** refresh paging after adding/deleting item with DataView ([#124](https://github.com/ghiscoding/aurelia-slickgrid/issues/124)) ([3e31b24](https://github.com/ghiscoding/aurelia-slickgrid/commit/3e31b24))
* **translateFormatter:** shouldn't convert null values to string ([#127](https://github.com/ghiscoding/aurelia-slickgrid/issues/127)) ([79a159c](https://github.com/ghiscoding/aurelia-slickgrid/commit/79a159c))

### Features

* **autocomplete:** Editor & Filter autocomplete feature  ([#122](https://github.com/ghiscoding/aurelia-slickgrid/issues/122)) ([d89b3ab](https://github.com/ghiscoding/aurelia-slickgrid/commit/d89b3ab))
* **build:** distribution folder shouldn't be part of the Git ([#128](https://github.com/ghiscoding/aurelia-slickgrid/issues/128)) ([f84662c](https://github.com/ghiscoding/aurelia-slickgrid/commit/f84662c))
* **divider:** add divider option to Grid Menu & Column Header Menu ([#131](https://github.com/ghiscoding/aurelia-slickgrid/issues/131)) ([4788904](https://github.com/ghiscoding/aurelia-slickgrid/commit/4788904))
* **filter:** input mask filter ([#132](https://github.com/ghiscoding/aurelia-slickgrid/issues/132)) ([d591a8b](https://github.com/ghiscoding/aurelia-slickgrid/commit/d591a8b))
* **frozen:** add frozen column/row example ([#121](https://github.com/ghiscoding/aurelia-slickgrid/issues/121)) ([12dde76](https://github.com/ghiscoding/aurelia-slickgrid/commit/12dde76))
* **frozen:** add option to freeze bottom instead of just top ([#123](https://github.com/ghiscoding/aurelia-slickgrid/issues/123)) ([deb1e19](https://github.com/ghiscoding/aurelia-slickgrid/commit/deb1e19))
* **headermenu:** add Clear Filter to each Column Header Menu ([#130](https://github.com/ghiscoding/aurelia-slickgrid/issues/130)) ([b7fa750](https://github.com/ghiscoding/aurelia-slickgrid/commit/b7fa750))
* **sorter:** add object with dataKey as a Sort and add custom Sorter ([#129](https://github.com/ghiscoding/aurelia-slickgrid/issues/129)) ([189fb20](https://github.com/ghiscoding/aurelia-slickgrid/commit/189fb20))
* **sorting:** add "Clear Sort" in each Column Header Menu ([#125](https://github.com/ghiscoding/aurelia-slickgrid/issues/125)) ([cd6a6e5](https://github.com/ghiscoding/aurelia-slickgrid/commit/cd6a6e5))

<a name="2.6.2"></a>
## [2.6.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.6.1...v2.6.2) (2018-12-20)

### Bug Fixes

* **converter:** add prefix to value converter to avoid conflicts ([87ad6cc](https://github.com/ghiscoding/aurelia-slickgrid/commit/87ad6cc))
* **converter:** rename converter camel case with prefix ([5b83be8](https://github.com/ghiscoding/aurelia-slickgrid/commit/5b83be8))

<a name="2.6.1"></a>
## [2.6.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.6.0...v2.6.1) (2018-12-20)

### Bug Fixes

* **grouping:** toggle group not working in example 18, fixes [#119](https://github.com/ghiscoding/aurelia-slickgrid/issues/119) ([#120](https://github.com/ghiscoding/aurelia-slickgrid/issues/120)) ([10c6190](https://github.com/ghiscoding/aurelia-slickgrid/commit/10c6190))

<a name="2.6.0"></a>
# [2.6.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.5.0...v2.6.0) (2018-12-18)

### Bug Fixes

* **editor:** Float Editor not working with .5 but works with 0.5 ([1082fdf](https://github.com/ghiscoding/aurelia-slickgrid/commit/1082fdf))
* **filter:** Date in UTC format with milliseconds not filtering well ([718b7c4](https://github.com/ghiscoding/aurelia-slickgrid/commit/718b7c4))
* **pagination:** fixed a few pagination problem used by backend service ([4f2362b](https://github.com/ghiscoding/aurelia-slickgrid/commit/4f2362b))
* **resize:** global delay timer was affecting multiple grid resize ([a661115](https://github.com/ghiscoding/aurelia-slickgrid/commit/a661115))

### Features

* **backend:** add onError callback which catch error from process ([#116](https://github.com/ghiscoding/aurelia-slickgrid/issues/116)) ([17092b8](https://github.com/ghiscoding/aurelia-slickgrid/commit/17092b8))
* **badge:** add download count badge ([1676d7c](https://github.com/ghiscoding/aurelia-slickgrid/commit/1676d7c))
* **grouping:** draggable grouping plugin ([#114](https://github.com/ghiscoding/aurelia-slickgrid/issues/114)) ([0972471](https://github.com/ghiscoding/aurelia-slickgrid/commit/0972471))
* **inputType:** Add multiple Filter input types (number/password) ([#117](https://github.com/ghiscoding/aurelia-slickgrid/issues/117)) ([387cd21](https://github.com/ghiscoding/aurelia-slickgrid/commit/387cd21))
* **plugin:** add Row Detail Plugin extension ([#113](https://github.com/ghiscoding/aurelia-slickgrid/issues/113)) ([755e026](https://github.com/ghiscoding/aurelia-slickgrid/commit/755e026))
* **remote:** add Remote Model example with custom dataview ([#115](https://github.com/ghiscoding/aurelia-slickgrid/issues/115)) ([7cc2faa](https://github.com/ghiscoding/aurelia-slickgrid/commit/7cc2faa))
* **selector:** add new property to display Select All chkbox elsewhere ([#118](https://github.com/ghiscoding/aurelia-slickgrid/issues/118)) ([db68f7e](https://github.com/ghiscoding/aurelia-slickgrid/commit/db68f7e))
* **update:** add updateDataGridItems for multiple changes ([824af29](https://github.com/ghiscoding/aurelia-slickgrid/commit/824af29))

<a name="2.5.0"></a>
# [2.5.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.4.2...v2.5.0) (2018-11-17)

### Bug Fixes

* **resize:** auto-resize shouldn't resize when fixing gridHeight/Width ([4586d29](https://github.com/ghiscoding/aurelia-slickgrid/commit/4586d29))
* **select:** multiple-select autoAdjustDropWidth sometime incorrect ([2e86cec](https://github.com/ghiscoding/aurelia-slickgrid/commit/2e86cec))
* **select:** Single Select should use EQ operator instead of IN ([550a974](https://github.com/ghiscoding/aurelia-slickgrid/commit/550a974))
* **select:** Single Select should use EQ operator instead of IN ([3f3f9ed](https://github.com/ghiscoding/aurelia-slickgrid/commit/3f3f9ed))

### Features

* **editor:** add "editor-{id}" to all Editors. easier styling & target ([#112](https://github.com/ghiscoding/aurelia-slickgrid/issues/112)) ([6d52536](https://github.com/ghiscoding/aurelia-slickgrid/commit/6d52536))
* **filter:** add "filter-{id}" to all Filters. easier styling & target ([#111](https://github.com/ghiscoding/aurelia-slickgrid/issues/111)) ([d836e7c](https://github.com/ghiscoding/aurelia-slickgrid/commit/d836e7c))
* **plugin:** split out all controls/plugins into their own class ([#110](https://github.com/ghiscoding/aurelia-slickgrid/issues/110)) ([6027d0c](https://github.com/ghiscoding/aurelia-slickgrid/commit/6027d0c))
* **select:** collection can also be of type String ([#109](https://github.com/ghiscoding/aurelia-slickgrid/issues/109)) ([9733d08](https://github.com/ghiscoding/aurelia-slickgrid/commit/9733d08))

<a name="2.4.2"></a>
## [2.4.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.4.0...v2.4.2) (2018-10-20)

### Bug Fixes

* **resize:** autoAdjustDropWidthByTextSize should handle 100% width ([c567f73](https://github.com/ghiscoding/aurelia-slickgrid/commit/c567f73))
* **resize:** when having 2 grids resize only works on 1 grid ([5cf81e1](https://github.com/ghiscoding/aurelia-slickgrid/commit/5cf81e1))

### Features

* **select:** Filter/Editor able to translate prefix/suffix/optionLabel ([0732e53](https://github.com/ghiscoding/aurelia-slickgrid/commit/0732e53))

<a name="2.4.0"></a>
# [2.4.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.3.0...v2.4.0) (2018-10-05)

### Bug Fixes

* **autocommit:** auto-commit should not save if field is invalid ([#108](https://github.com/ghiscoding/aurelia-slickgrid/issues/108)) ([dac989b](https://github.com/ghiscoding/aurelia-slickgrid/commit/dac989b))
* **chrome:** Compensate incorrect SlickGrid measureScrollbar ([24a1bfa](https://github.com/ghiscoding/aurelia-slickgrid/commit/24a1bfa))
* **chrome:** patch horizontal scroll appearing only in Chrome ([877f5a3](https://github.com/ghiscoding/aurelia-slickgrid/commit/877f5a3))
* **chrome:** patch horizontal scroll appearing only in Chrome ([e1ef209](https://github.com/ghiscoding/aurelia-slickgrid/commit/e1ef209))
* **editor:** Select Editor should close when tabbing away, fixes [#92](https://github.com/ghiscoding/aurelia-slickgrid/issues/92) ([#94](https://github.com/ghiscoding/aurelia-slickgrid/issues/94)) ([f8f808c](https://github.com/ghiscoding/aurelia-slickgrid/commit/f8f808c))
* **example:** prerequisite prop should only use integer values, closes [#95](https://github.com/ghiscoding/aurelia-slickgrid/issues/95) ([#97](https://github.com/ghiscoding/aurelia-slickgrid/issues/97)) ([fddda24](https://github.com/ghiscoding/aurelia-slickgrid/commit/fddda24))
* **export:** Export should work with datasetIdPropertyName defined ([#99](https://github.com/ghiscoding/aurelia-slickgrid/issues/99)) ([fad2117](https://github.com/ghiscoding/aurelia-slickgrid/commit/fad2117))
* **export:** remove extra comma at the end of each line ([501b779](https://github.com/ghiscoding/aurelia-slickgrid/commit/501b779))
* **header:** hidding column from header menu after reordering column ([88097ad](https://github.com/ghiscoding/aurelia-slickgrid/commit/88097ad))
* **header:** use showHeaderRow flag when defined by user ([#105](https://github.com/ghiscoding/aurelia-slickgrid/issues/105)) ([d9ccdf2](https://github.com/ghiscoding/aurelia-slickgrid/commit/d9ccdf2))
* **http:** remove aurelia-http-client dependency, closes [#101](https://github.com/ghiscoding/aurelia-slickgrid/issues/101) ([#103](https://github.com/ghiscoding/aurelia-slickgrid/issues/103)) ([f203b0f](https://github.com/ghiscoding/aurelia-slickgrid/commit/f203b0f))
* **styling:** remove black border bottom from column headers ([3e42538](https://github.com/ghiscoding/aurelia-slickgrid/commit/3e42538))

### Features

* **collection:** support multiple filterBy/sortBy in CollectionService ([#106](https://github.com/ghiscoding/aurelia-slickgrid/issues/106)) ([86e8561](https://github.com/ghiscoding/aurelia-slickgrid/commit/86e8561))
* **demo:** Add Dynamic Row CSS Styling example ([bb7f757](https://github.com/ghiscoding/aurelia-slickgrid/commit/bb7f757))
* **demo:** Add Dynamic Row CSS Styling example ([ab16a4e](https://github.com/ghiscoding/aurelia-slickgrid/commit/ab16a4e))
* **editor:** Add auto commit edit flag to grid options ([#96](https://github.com/ghiscoding/aurelia-slickgrid/issues/96)) ([6c9c197](https://github.com/ghiscoding/aurelia-slickgrid/commit/6c9c197)), closes [#82](https://github.com/ghiscoding/aurelia-slickgrid/issues/82)
* **editor:** pass Editor Args to Editor Custom Validators  ([#98](https://github.com/ghiscoding/aurelia-slickgrid/issues/98)) ([27c7132](https://github.com/ghiscoding/aurelia-slickgrid/commit/27c7132))
* **filter:** add posibility to filter complex objects ([#100](https://github.com/ghiscoding/aurelia-slickgrid/issues/100)) ([cfc5565](https://github.com/ghiscoding/aurelia-slickgrid/commit/cfc5565))
* **resize:** add maxHeight & maxWidth options to resizer ([#104](https://github.com/ghiscoding/aurelia-slickgrid/issues/104)) ([547faa5](https://github.com/ghiscoding/aurelia-slickgrid/commit/547faa5))
* **select:** add option to use label as selected text ([#107](https://github.com/ghiscoding/aurelia-slickgrid/issues/107)) ([8df592b](https://github.com/ghiscoding/aurelia-slickgrid/commit/8df592b))
* **sort:** add posibility to sort complex objects ([#102](https://github.com/ghiscoding/aurelia-slickgrid/issues/102)) ([ed6e729](https://github.com/ghiscoding/aurelia-slickgrid/commit/ed6e729))

<a name="2.3.0"></a>
# [2.3.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.2.3...v2.3.0) (2018-08-30)

### Bug Fixes

* **editor:** auto adjust drop position (up/down) broken multiple editors ([a477e53](https://github.com/ghiscoding/aurelia-slickgrid/commit/a477e53))
* **filter:** MultipleSelect Filter had z-index too low in modal window ([c78c9fd](https://github.com/ghiscoding/aurelia-slickgrid/commit/c78c9fd))
* **formatter:** null values not handled properly with number formatters ([9dd649a](https://github.com/ghiscoding/aurelia-slickgrid/commit/9dd649a))
* **grouping:** Filter & Grouping should work together, closes [#90](https://github.com/ghiscoding/aurelia-slickgrid/issues/90) ([#91](https://github.com/ghiscoding/aurelia-slickgrid/issues/91)) ([153e6cc](https://github.com/ghiscoding/aurelia-slickgrid/commit/153e6cc))
* **import:** add missing typings to fix import lodash.isequal ([a32773b](https://github.com/ghiscoding/aurelia-slickgrid/commit/a32773b))
* **options:** be able to disable filtering even when set globally ([1d50635](https://github.com/ghiscoding/aurelia-slickgrid/commit/1d50635))
* **selector:** Row Selection should be reset on Sort changes ([f7162fb](https://github.com/ghiscoding/aurelia-slickgrid/commit/f7162fb))
* **style:** use the correct radio icon for singleSelect ([18478d9](https://github.com/ghiscoding/aurelia-slickgrid/commit/18478d9))

### Features

* **async:** Filter & Editor load Collection Async & Watch, closes [#83](https://github.com/ghiscoding/aurelia-slickgrid/issues/83) ([#89](https://github.com/ghiscoding/aurelia-slickgrid/issues/89)) ([e12019b](https://github.com/ghiscoding/aurelia-slickgrid/commit/e12019b))
* **columnSize:** add flag enableAutoSizeColumns ([5641871](https://github.com/ghiscoding/aurelia-slickgrid/commit/5641871))
* **filter:** auto adjust drop position (up/down) of select filter ([c362e3c](https://github.com/ghiscoding/aurelia-slickgrid/commit/c362e3c))
* **formatter:** add 2 new DateTime Short Formatter without seconds ([ac14e4e](https://github.com/ghiscoding/aurelia-slickgrid/commit/ac14e4e))
* **formatter:** add new arrayObjectToCsv Formatter ([cdf801e](https://github.com/ghiscoding/aurelia-slickgrid/commit/cdf801e))
* **multiselect:** auto-adjust height & position of multiple-select.js ([#93](https://github.com/ghiscoding/aurelia-slickgrid/issues/93)) ([b8f3e72](https://github.com/ghiscoding/aurelia-slickgrid/commit/b8f3e72))
* **resize:** add possibility to override default delay before resizing ([583e63a](https://github.com/ghiscoding/aurelia-slickgrid/commit/583e63a))

<a name="2.2.3"></a>
## [2.2.3](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.2.2...v2.2.3) (2018-08-05)

### Bug Fixes

* **requirejs:** fix import of DOMPurify to also work with RequireJS ([3b0d2b2](https://github.com/ghiscoding/aurelia-slickgrid/commit/3b0d2b2))

<a name="2.2.2"></a>
## [2.2.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.2.1...v2.2.2) (2018-08-04)

<a name="2.2.1"></a>
## [2.2.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.2.0...v2.2.1) (2018-08-04)

### Bug Fixes

* **sanitize:** replace sanitize-html with DOMPurify ([c3cdc22](https://github.com/ghiscoding/aurelia-slickgrid/commit/c3cdc22))

<a name="2.2.0"></a>
# [2.2.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.1.1...v2.2.0) (2018-08-04)

### Bug Fixes

* **error:** add item to datagrid should not require selection model ([7b7fffe](https://github.com/ghiscoding/aurelia-slickgrid/commit/7b7fffe))
* **event:** dispatchEvent should be cancelable, closes [#84](https://github.com/ghiscoding/aurelia-slickgrid/issues/84) ([#86](https://github.com/ghiscoding/aurelia-slickgrid/issues/86)) ([44cfd38](https://github.com/ghiscoding/aurelia-slickgrid/commit/44cfd38))
* **filter:** Filters should trigger only when different ([2464558](https://github.com/ghiscoding/aurelia-slickgrid/commit/2464558))
* **filter:** MultipleSelect & SingleSelect Filters only trigger changes ([17d8ee3](https://github.com/ghiscoding/aurelia-slickgrid/commit/17d8ee3))
* **filter:** searchTerms sometime comes back even after clear filter ([735c03b](https://github.com/ghiscoding/aurelia-slickgrid/commit/735c03b))
* **odata:** missing column in query using Grid Presets and hidden col ([23b8981](https://github.com/ghiscoding/aurelia-slickgrid/commit/23b8981))
* **pagination:** Only display Pagination with backendServiceApi ([3b5133e](https://github.com/ghiscoding/aurelia-slickgrid/commit/3b5133e))
* **selection:** On filter or Page changed, remove any rows selection ([6578a97](https://github.com/ghiscoding/aurelia-slickgrid/commit/6578a97))
* **selection:** single row selector should hide "Select All", closes [#85](https://github.com/ghiscoding/aurelia-slickgrid/issues/85) ([6b6753a](https://github.com/ghiscoding/aurelia-slickgrid/commit/6b6753a))

### Features

* **filter:** add Prefix/Suffix/RenderHtml to Filters & Editors ([#87](https://github.com/ghiscoding/aurelia-slickgrid/issues/87)) ([701f51e](https://github.com/ghiscoding/aurelia-slickgrid/commit/701f51e))
* **graphql:** export dispose function to aureliaGridInstance ([64d5dd0](https://github.com/ghiscoding/aurelia-slickgrid/commit/64d5dd0))
* **service:** add commonly functions to get item data ([982de13](https://github.com/ghiscoding/aurelia-slickgrid/commit/982de13))
* **service:** add more commonly used functions ([88a0c07](https://github.com/ghiscoding/aurelia-slickgrid/commit/88a0c07))

<a name="2.1.1"></a>
## [2.1.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.1.0...v2.1.1) (2018-07-14)

### Bug Fixes

* **css:** plugin styling was affecting pages outside of slickgrid ([2c103c0](https://github.com/ghiscoding/aurelia-slickgrid/commit/2c103c0))
* **formatter:** don't use strict date check on Date Formatters ([8746f11](https://github.com/ghiscoding/aurelia-slickgrid/commit/8746f11))
* **graphql:** resort was causing issues when used with Presets ([5715bce](https://github.com/ghiscoding/aurelia-slickgrid/commit/5715bce))
* **graphql:** typing empty filter in GraphQL shouldn't include empty str ([3d17d7e](https://github.com/ghiscoding/aurelia-slickgrid/commit/3d17d7e))
* **gridState:** Grid Stage changed was not being called on empty filter ([842d6e7](https://github.com/ghiscoding/aurelia-slickgrid/commit/842d6e7))
* **regression:** dynamically add a new column definition ([b8b4d01](https://github.com/ghiscoding/aurelia-slickgrid/commit/b8b4d01))

<a name="2.1.0"></a>
# [2.1.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.0.1...v2.1.0) (2018-07-07)

### Bug Fixes

* **filter:** input filter was using EQ operator instead of Contains ([9a86a74](https://github.com/ghiscoding/aurelia-slickgrid/commit/9a86a74))
* **formatter:** Date Formatters should only transform on valid dates ([2e08e47](https://github.com/ghiscoding/aurelia-slickgrid/commit/2e08e47))
* **formatter:** Date Formatters should only transform on valid dates ([d1ab5e5](https://github.com/ghiscoding/aurelia-slickgrid/commit/d1ab5e5))
* **formatter:** Date Formatters should only transform on valid dates ([8f67cd9](https://github.com/ghiscoding/aurelia-slickgrid/commit/8f67cd9))
* **slider:** slider issues with IE and Edge ([4c2a193](https://github.com/ghiscoding/aurelia-slickgrid/commit/4c2a193))
* **slider:** slider issues with IE and Edge ([015ecfc](https://github.com/ghiscoding/aurelia-slickgrid/commit/015ecfc))
* **slider:** slider number shown on right was sometime offset ([f21dba3](https://github.com/ghiscoding/aurelia-slickgrid/commit/f21dba3))

### Features

* **bs4:** support Bootstrap 4 ([6865bed](https://github.com/ghiscoding/aurelia-slickgrid/commit/6865bed))
* **formatter:** add new Decimal Formatter ([f33d075](https://github.com/ghiscoding/aurelia-slickgrid/commit/f33d075))

<a name="2.0.1"></a>
## [2.0.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.0.0...v2.0.1) (2018-06-23)

<a name="2.0.0"></a>
# [2.0.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v2.0.0-beta...v2.0.0) (2018-06-23)

### Bug Fixes

* **filter:** clear filter should trigger only 1 Grid State change ([43fc269](https://github.com/ghiscoding/aurelia-slickgrid/commit/43fc269))
* **filter:** Grid State incorrect after clear filters w/backend service ([289deec](https://github.com/ghiscoding/aurelia-slickgrid/commit/289deec))
* **filter:** multipleSelect filter doesn't handle cell value arrays ([e695660](https://github.com/ghiscoding/aurelia-slickgrid/commit/e695660))
* **filter:** regression, input filter using with typed operator ([65aa4eb](https://github.com/ghiscoding/aurelia-slickgrid/commit/65aa4eb))
* **filter:** SingleSelect Filter (& others) should return all when empty ([#77](https://github.com/ghiscoding/aurelia-slickgrid/issues/77)) ([266507e](https://github.com/ghiscoding/aurelia-slickgrid/commit/266507e))
* **gridMenu:** custom user commands not recreated after locale switch ([d585de5](https://github.com/ghiscoding/aurelia-slickgrid/commit/d585de5))
* **gridState:** multiple fixes with Grid State & Presets with locale ([8182351](https://github.com/ghiscoding/aurelia-slickgrid/commit/8182351))
* **menu:** Column Picker menu list was not being translated ([3f41262](https://github.com/ghiscoding/aurelia-slickgrid/commit/3f41262))
* **menu:** Grid Menu & Header Menu custom items were not translated ([729242e](https://github.com/ghiscoding/aurelia-slickgrid/commit/729242e))
* **merge:** fix merge conflict ([a4456ae](https://github.com/ghiscoding/aurelia-slickgrid/commit/a4456ae))
* **presets:** Presets w/MultipleFilter only taking 1st filtered value ([eacd633](https://github.com/ghiscoding/aurelia-slickgrid/commit/eacd633))
* **selector:** Checkbox selector was not working correctly with Presets ([8055050](https://github.com/ghiscoding/aurelia-slickgrid/commit/8055050))
* **slider:** slider should always be starting at 0 ([b771182](https://github.com/ghiscoding/aurelia-slickgrid/commit/b771182))
* **sort:** Presets & Sort caused unintended behavior w/dataview changed ([#76](https://github.com/ghiscoding/aurelia-slickgrid/issues/76)) ([d199488](https://github.com/ghiscoding/aurelia-slickgrid/commit/d199488))
* **update:** updateDataGridItemById was throwing error on 1st row (0) ([94e0820](https://github.com/ghiscoding/aurelia-slickgrid/commit/94e0820))

### Features

* **editor:** add new Slider Editor & refactor Editor Validation ([#80](https://github.com/ghiscoding/aurelia-slickgrid/issues/80)) ([46f140c](https://github.com/ghiscoding/aurelia-slickgrid/commit/46f140c))
* **filter:** add new Slider Filter (input range) ([#79](https://github.com/ghiscoding/aurelia-slickgrid/issues/79)) ([6b45b0c](https://github.com/ghiscoding/aurelia-slickgrid/commit/6b45b0c))
* **formatter:** add new Mask Formatter ([1c3c09c](https://github.com/ghiscoding/aurelia-slickgrid/commit/1c3c09c))

<a name="1.13.1"></a>
## [1.13.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v1.13.0...v1.13.1) (2018-05-26)

### Bug Fixes

* **filters:** return false when invalid date ([#69](https://github.com/ghiscoding/aurelia-slickgrid/issues/69)) ([93f0db1](https://github.com/ghiscoding/aurelia-slickgrid/commit/93f0db1)), closes [#68](https://github.com/ghiscoding/aurelia-slickgrid/issues/68)
* **sorters:** return -1 or 1 for invalid dates ([#70](https://github.com/ghiscoding/aurelia-slickgrid/issues/70)) ([04ce67e](https://github.com/ghiscoding/aurelia-slickgrid/commit/04ce67e)), closes [#68](https://github.com/ghiscoding/aurelia-slickgrid/issues/68) [#69](https://github.com/ghiscoding/aurelia-slickgrid/issues/69)

### Features

* **rowSelect:** add preselectedRows and expose all Plugin ([#71](https://github.com/ghiscoding/aurelia-slickgrid/issues/71)) ([02fa681](https://github.com/ghiscoding/aurelia-slickgrid/commit/02fa681))

<a name="1.13.0"></a>
# [1.13.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v1.12.2...v1.13.0) (2018-05-21)

### Bug Fixes

* **control:** Grid Menu z-index is too low when inside a modal window ([b722f6d](https://github.com/ghiscoding/aurelia-slickgrid/commit/b722f6d))
* **dataview:** preserve any previous sort when resetting items ([#62](https://github.com/ghiscoding/aurelia-slickgrid/issues/62)) ([2112768](https://github.com/ghiscoding/aurelia-slickgrid/commit/2112768))
* **editor:** Int/Float Editors multiple small enhancements ([#54](https://github.com/ghiscoding/aurelia-slickgrid/issues/54)) ([b208fcf](https://github.com/ghiscoding/aurelia-slickgrid/commit/b208fcf))
* **editors:** fix serialization/deserilization in editors ([2ee03b0](https://github.com/ghiscoding/aurelia-slickgrid/commit/2ee03b0)), closes [#56](https://github.com/ghiscoding/aurelia-slickgrid/issues/56)
* **editors:** fix serialization/deserilization in editors ([f3610d7](https://github.com/ghiscoding/aurelia-slickgrid/commit/f3610d7)), closes [#58](https://github.com/ghiscoding/aurelia-slickgrid/issues/58)
* **editors:** use indexOf in multiple select editor to load value ([21215c4](https://github.com/ghiscoding/aurelia-slickgrid/commit/21215c4)), closes [#50](https://github.com/ghiscoding/aurelia-slickgrid/issues/50)
* **editors:** use indexOf in multiple select editor to load value ([599a803](https://github.com/ghiscoding/aurelia-slickgrid/commit/599a803))
* **eventService:** use grid.getOptions for gridDefinition ([e67e93a](https://github.com/ghiscoding/aurelia-slickgrid/commit/e67e93a)), closes [#49](https://github.com/ghiscoding/aurelia-slickgrid/issues/49)
* **eventService:** use grid.getOptions for gridDefinition in event service ([0be30fd](https://github.com/ghiscoding/aurelia-slickgrid/commit/0be30fd)), closes [#51](https://github.com/ghiscoding/aurelia-slickgrid/issues/51)
* **grid:** issue [#44](https://github.com/ghiscoding/aurelia-slickgrid/issues/44), sort icon hidden behind grid menu w/small dataset ([#53](https://github.com/ghiscoding/aurelia-slickgrid/issues/53)) ([737da5f](https://github.com/ghiscoding/aurelia-slickgrid/commit/737da5f))
* **grid:** Resizer on 1st grid stop working after 2nd grid is created ([ed462ca](https://github.com/ghiscoding/aurelia-slickgrid/commit/ed462ca))
* **grid:** Support Row Selection & Inline Editors in 1 view ([1da7b7a](https://github.com/ghiscoding/aurelia-slickgrid/commit/1da7b7a))
* **grid:** use this.gridOptions in bind & remove aurelia args ([3bd2d90](https://github.com/ghiscoding/aurelia-slickgrid/commit/3bd2d90))
* **gridOptions:** use this.gridOptions in bind fn ([48de363](https://github.com/ghiscoding/aurelia-slickgrid/commit/48de363))
* **headerMenu:** we should not display header menu on row select column ([#64](https://github.com/ghiscoding/aurelia-slickgrid/issues/64)) ([efe1c21](https://github.com/ghiscoding/aurelia-slickgrid/commit/efe1c21))

### Features

* **filters:** add more operator types to collection svc filter ([#66](https://github.com/ghiscoding/aurelia-slickgrid/issues/66)) ([4359e67](https://github.com/ghiscoding/aurelia-slickgrid/commit/4359e67)), closes [#63](https://github.com/ghiscoding/aurelia-slickgrid/issues/63)
* **grid:** ability to dynamically add or change Column Headers ([#65](https://github.com/ghiscoding/aurelia-slickgrid/pull/65)), closes [#57](https://github.com/ghiscoding/aurelia-slickgrid/issues/57)
* **resize:** use gridHeight or gridWidth when provided on autoResize ([#59](https://github.com/ghiscoding/aurelia-slickgrid/pull/59)

### BREAKING CHANGES

* **filters:** Reversing the 'EQ' filter logic. This was done now because the filter feature was new and it follows the javascript `filter` logic (since equal will filter values equal to the value provided)

* refactor(example): add example code to Doc and Client-CLI samples

<a name="1.12.2"></a>
## [1.12.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v1.12.1...v1.12.2) (2018-04-14)

### Bug Fixes

* **delete:** deleteDataGridItemById should also work on row index 0 ([af283f3](https://github.com/ghiscoding/aurelia-slickgrid/commit/af283f3))

<a name="1.12.1"></a>
## [1.12.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v1.12.0...v1.12.1) (2018-04-13)

### Bug Fixes

* **grid:** after expanding a column,  scrolling should not resize grid ([bf83c90](https://github.com/ghiscoding/aurelia-slickgrid/commit/bf83c90))

### Features

* **grid:** add deleteDataGridItem & deleteDataGridItemById into Service ([2e927f2](https://github.com/ghiscoding/aurelia-slickgrid/commit/2e927f2))

<a name="1.12.0"></a>
# [1.12.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v1.11.1...v1.12.0) (2018-04-12)

### Bug Fixes

* **editor:** Single/MultiSelect Editors misbehave w/Desc Sort, fixes [#46](https://github.com/ghiscoding/aurelia-slickgrid/issues/46) ([71916dc](https://github.com/ghiscoding/aurelia-slickgrid/commit/71916dc))
* **excelCopy:** Excel Copy Buffer should have sanitize option as export ([8c57298](https://github.com/ghiscoding/aurelia-slickgrid/commit/8c57298))
* **formatter:** make sure object exist before getting property ([4961cab](https://github.com/ghiscoding/aurelia-slickgrid/commit/4961cab))
* **grid:** calling refreshBackendDataset was not refreshing UI ([24a061e](https://github.com/ghiscoding/aurelia-slickgrid/commit/24a061e))

### Features

* **colspan:** add colspanCallback into gridOptions for easier usage ([6996862](https://github.com/ghiscoding/aurelia-slickgrid/commit/6996862))
* **graphql:** add option to pass extra query arguments ([f278c73](https://github.com/ghiscoding/aurelia-slickgrid/commit/f278c73))
* **grid:** add a default Header Menu with Sort Asc/Desc & HideColumn ([#47](https://github.com/ghiscoding/aurelia-slickgrid/issues/47)) ([db5fc16](https://github.com/ghiscoding/aurelia-slickgrid/commit/db5fc16))
* **grid:** add all missing grid options available in SlickGrid ([7d194ed](https://github.com/ghiscoding/aurelia-slickgrid/commit/7d194ed))
* **grid:** add Column Span (colspan) demo ([e20a3f6](https://github.com/ghiscoding/aurelia-slickgrid/commit/e20a3f6))
* **grid:** add sample for Header Grouping spanning accros multiple cols ([#43](https://github.com/ghiscoding/aurelia-slickgrid/issues/43)) ([67ff867](https://github.com/ghiscoding/aurelia-slickgrid/commit/67ff867))
* **grid:** Excel like Copy with Copy Manager Plugin ([#45](https://github.com/ghiscoding/aurelia-slickgrid/issues/45)) ([dbbbe56](https://github.com/ghiscoding/aurelia-slickgrid/commit/dbbbe56))
* **sorting:** add support for multi-columns number indicator & tristate ([ada47cd](https://github.com/ghiscoding/aurelia-slickgrid/commit/ada47cd))

<a name="1.11.1"></a>
## [1.11.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v1.11.0...v1.11.1) (2018-04-05)

### Bug Fixes

* **grid:** grid fixed sizes wasn't working in Edge/Firefox, closes [#35](https://github.com/ghiscoding/aurelia-slickgrid/issues/35) ([a7669df](https://github.com/ghiscoding/aurelia-slickgrid/commit/a7669df))

<a name="1.11.0"></a>
# [1.11.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v1.10.0...v1.11.0) (2018-04-04)

### Bug Fixes

* **graphql:** make sure column exist before trying to get properties ([7122d6a](https://github.com/ghiscoding/aurelia-slickgrid/commit/7122d6a))
* **graphql:** remove throw error when dataset is empty or bad structure ([36ea506](https://github.com/ghiscoding/aurelia-slickgrid/commit/36ea506))
* **grid:** gridHeight & gridWidth not set, closes [#35](https://github.com/ghiscoding/aurelia-slickgrid/issues/35) ([#40](https://github.com/ghiscoding/aurelia-slickgrid/issues/40)) ([0bd2c53](https://github.com/ghiscoding/aurelia-slickgrid/commit/0bd2c53))
* **merge:** fix last merge had conflicts ([15e80e8](https://github.com/ghiscoding/aurelia-slickgrid/commit/15e80e8))
* **merge:** fix some merge conflicts ([d2172df](https://github.com/ghiscoding/aurelia-slickgrid/commit/d2172df))
* **preset:** Preset with backend were not working when using queryField ([7ce538a](https://github.com/ghiscoding/aurelia-slickgrid/commit/7ce538a))
* **tasks:** VSCode Taks command were broken in new VSCode insiders ([653ecb8](https://github.com/ghiscoding/aurelia-slickgrid/commit/653ecb8))

### Features

* **editor:** add dependency injection support in editors ([#33](https://github.com/ghiscoding/aurelia-slickgrid/issues/33)) ([61a1a31](https://github.com/ghiscoding/aurelia-slickgrid/commit/61a1a31)), closes [#18](https://github.com/ghiscoding/aurelia-slickgrid/issues/18)
* **editor:** auto-adjust ms-select drop up/down by space, closes [#34](https://github.com/ghiscoding/aurelia-slickgrid/issues/34) ([c86911c](https://github.com/ghiscoding/aurelia-slickgrid/commit/c86911c))
* **filter/editor:** add functionality to filter/sort collection ([#38](https://github.com/ghiscoding/aurelia-slickgrid/issues/38)) ([2a276a6](https://github.com/ghiscoding/aurelia-slickgrid/commit/2a276a6))
* **grouping:** Grouping & Aggregators  ([#41](https://github.com/ghiscoding/aurelia-slickgrid/issues/41)) ([333182f](https://github.com/ghiscoding/aurelia-slickgrid/commit/333182f))
* **resizer:** add last resized Grid Dimension getter ([cd6013e](https://github.com/ghiscoding/aurelia-slickgrid/commit/cd6013e))
* **sort:** add a Clear Sorting function and grid menu command ([#39](https://github.com/ghiscoding/aurelia-slickgrid/issues/39)) ([f709dc7](https://github.com/ghiscoding/aurelia-slickgrid/commit/f709dc7))
* **styling:** make the multiple-select.js "Select All" text 100% wide ([0b2909c](https://github.com/ghiscoding/aurelia-slickgrid/commit/0b2909c))

<a name="1.10.0"></a>
# [1.10.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v1.9.2...v1.10.0) (2018-03-20)
### Features

* **filter:** Compound Filters (input & date) (PR #32) ([763e766](https://github.com/ghiscoding/aurelia-slickgrid/commit/763e766))

### Bug Fixes

* **backend:** Grid Presets sort order not correct with backend services ([22f687b](https://github.com/ghiscoding/aurelia-slickgrid/commit/22f687b))
* **editor:** i18n service can also be passed as params in gridOptions ([c11eff4](https://github.com/ghiscoding/aurelia-slickgrid/commit/c11eff4))
* **filter:** single select filter incorrect onFilterChanged on Presets ([c7e186a](https://github.com/ghiscoding/aurelia-slickgrid/commit/c7e186a))
* **formatter:** dateTimeIso Formatter was using dateIso ([6756de8](https://github.com/ghiscoding/aurelia-slickgrid/commit/6756de8))
* **gridState:** Filter were not always returning searchTerm in GridState ([67f167a](https://github.com/ghiscoding/aurelia-slickgrid/commit/67f167a))
* **jquery-ui:** use latest version of jQuery-UI to avoid jQuery 3 errors ([c546865](https://github.com/ghiscoding/aurelia-slickgrid/commit/c546865))

<a name="1.9.2"></a>
## [1.9.2](https://github.com/ghiscoding/aurelia-slickgrid/compare/v1.9.1...v1.9.2) (2018-03-13)

<a name="1.9.1"></a>
## [1.9.1](https://github.com/ghiscoding/aurelia-slickgrid/compare/v1.9.0...v1.9.1) (2018-03-13)

### Bug Fixes

* **formatter:** translate formatter was causing issues in some occasion ([8acdc28](https://github.com/ghiscoding/aurelia-slickgrid/commit/8acdc28))

<a name="1.9.0"></a>
# [1.9.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v1.7.1...v1.9.0) (2018-03-13)

### Bug Fixes

* **build:** incorrect type any ([5ffc0a1](https://github.com/ghiscoding/aurelia-slickgrid/commit/5ffc0a1))
* **formatter:** add throw error with instruction if missing params ([cbb01d9](https://github.com/ghiscoding/aurelia-slickgrid/commit/cbb01d9))
* **formatter:** multipleFormatter should pass value to next formatter ([bf6b006](https://github.com/ghiscoding/aurelia-slickgrid/commit/bf6b006))
* **pagination:** Pagination with BackendServiceApi was incorrect ([fba8750](https://github.com/ghiscoding/aurelia-slickgrid/commit/fba8750))
* **requireJS:** import for RequireJS should have /index ([b796c26](https://github.com/ghiscoding/aurelia-slickgrid/commit/b796c26))
* **sample:** fix the client-CLI sample ([407ba66](https://github.com/ghiscoding/aurelia-slickgrid/commit/407ba66))
* **sass:** all sass properties should have an override capability ([6d03cd7](https://github.com/ghiscoding/aurelia-slickgrid/commit/6d03cd7))
* **utilities:** move findOrDefault to a function ([#29](https://github.com/ghiscoding/aurelia-slickgrid/issues/29)) ([3d21548](https://github.com/ghiscoding/aurelia-slickgrid/commit/3d21548)), closes [#27](https://github.com/ghiscoding/aurelia-slickgrid/issues/27)

### Features

* **demo:** update demo pages with latest features ([5d4587d](https://github.com/ghiscoding/aurelia-slickgrid/commit/5d4587d))
* **event:** [#24](https://github.com/ghiscoding/aurelia-slickgrid/issues/24) add onGridStateChanged and onPaginationChanged events ([#28](https://github.com/ghiscoding/aurelia-slickgrid/issues/28)) ([b657e75](https://github.com/ghiscoding/aurelia-slickgrid/commit/b657e75))
* **service:** expose refreshBackendDataset for backend ([68c8266](https://github.com/ghiscoding/aurelia-slickgrid/commit/68c8266))

<a name="1.7.0"></a>
# [1.7.0](https://github.com/ghiscoding/aurelia-slickgrid/compare/v1.6.0...v1.7.0) (2018-03-07)

### Bug Fixes

* **backend:** backend filter on delay was broken since GridState feature ([a25147d](https://github.com/ghiscoding/aurelia-slickgrid/commit/a25147d))
* **build:** fox all build errors ([3d24212](https://github.com/ghiscoding/aurelia-slickgrid/commit/3d24212))
* **doc:** updated contributing as per comment in [#10](https://github.com/ghiscoding/aurelia-slickgrid/issues/10) ([f437e39](https://github.com/ghiscoding/aurelia-slickgrid/commit/f437e39))
* **events:** every subscribed event should have an unsubscribe ([5abc223](https://github.com/ghiscoding/aurelia-slickgrid/commit/5abc223))
* **events:** every subscribed event should have an unsubscribe ([31b4e24](https://github.com/ghiscoding/aurelia-slickgrid/commit/31b4e24))
* **filter:** remove unused function ([00b3654](https://github.com/ghiscoding/aurelia-slickgrid/commit/00b3654))
* **graphql:** a column type of number should use EQ in GraphQL query ([a7da882](https://github.com/ghiscoding/aurelia-slickgrid/commit/a7da882))
* **grid:** delete duplicate gridOptions it was causing issues ([fb131aa](https://github.com/ghiscoding/aurelia-slickgrid/commit/fb131aa))
* **grid:** update SlickGrid version and configure Header Menu autoAlign ([211ea96](https://github.com/ghiscoding/aurelia-slickgrid/commit/211ea96))
* **odata:** OData string filter should also support operators ([0bf8928](https://github.com/ghiscoding/aurelia-slickgrid/commit/0bf8928))

### Features

* **doc:** install and setup "prepare-release" for changelog and commit ([3925050](https://github.com/ghiscoding/aurelia-slickgrid/commit/3925050))
* **filter:** add new InputNoPlaceholderFilter and global default filter ([739ff3f](https://github.com/ghiscoding/aurelia-slickgrid/commit/739ff3f))
* **formatter:** add a new HyperlinkURI formatter, you need to uriPrefix ([52de978](https://github.com/ghiscoding/aurelia-slickgrid/commit/52de978))
* **grid:** add inline editor undo command ([72ef747](https://github.com/ghiscoding/aurelia-slickgrid/commit/72ef747))
* **grid:** add Pagination page number input ([8a89c58](https://github.com/ghiscoding/aurelia-slickgrid/commit/8a89c58))
* **query:** add `excludeFromQuery` prop and use it for Row Selection ([cda0e39](https://github.com/ghiscoding/aurelia-slickgrid/commit/cda0e39))
* **queryFilter:** add new "queryFieldFilter" and "queryFieldSorter" ([9d2aae1](https://github.com/ghiscoding/aurelia-slickgrid/commit/9d2aae1))
* **selectEditors:** add select grid editors ([#22](https://github.com/ghiscoding/aurelia-slickgrid/issues/22)) ([5bd7215](https://github.com/ghiscoding/aurelia-slickgrid/commit/5bd7215))
