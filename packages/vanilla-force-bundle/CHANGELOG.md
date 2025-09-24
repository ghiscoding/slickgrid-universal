# Change Log
## All-in-One SlickGrid agnostic library, visit [Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal) 📦🚀

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [9.9.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.8.0...v9.9.0) (2025-09-20)

### Bug Fixes

* add missing grid option to `skipFreezeColumnValidation` ([#2147](https://github.com/ghiscoding/slickgrid-universal/issues/2147)) ([890a76c](https://github.com/ghiscoding/slickgrid-universal/commit/890a76cd2117ea8f8ad74de83e6d80f1421b1509)) - by @ghiscoding
* **deps:** update all non-major dependencies ([#2151](https://github.com/ghiscoding/slickgrid-universal/issues/2151)) ([36e1b83](https://github.com/ghiscoding/slickgrid-universal/commit/36e1b834aa1c44682f314cea93205dc5b388f1a2)) - by @renovate-bot
* never hide `Editors.longText` in Composite Editor modal ([#2144](https://github.com/ghiscoding/slickgrid-universal/issues/2144)) ([43f0318](https://github.com/ghiscoding/slickgrid-universal/commit/43f0318da45de9d96e8ef3bc43749c1b12d0d460)) - by @ghiscoding
* never hide Editors.longText in Composite Editor modal ([9a31cf3](https://github.com/ghiscoding/slickgrid-universal/commit/9a31cf39acfa57239cbfeeb70edd042a1d3c63e0)) - by @ghiscoding
* rollback to previous column freeze when new freeze index is invalid ([#2130](https://github.com/ghiscoding/slickgrid-universal/issues/2130)) ([1af82fc](https://github.com/ghiscoding/slickgrid-universal/commit/1af82fcac662852b4acf5f13195ad07bb08cb579)) - by @ghiscoding
* Salesforce resize should only recalc when tab or window changed ([#2157](https://github.com/ghiscoding/slickgrid-universal/issues/2157)) ([e584b44](https://github.com/ghiscoding/slickgrid-universal/commit/e584b449204a4c5c50da63d00b286d2a28e8a30b)) - by @ghiscoding
* show an alert to user when trying to freeze wider than viewport ([#2129](https://github.com/ghiscoding/slickgrid-universal/issues/2129)) ([077168a](https://github.com/ghiscoding/slickgrid-universal/commit/077168a6ee4ac1cc673dcaa5db662305a1520ed5)) - by @ghiscoding
* validate allowed frozen column only when setting grid options ([#2139](https://github.com/ghiscoding/slickgrid-universal/issues/2139)) ([9d74f01](https://github.com/ghiscoding/slickgrid-universal/commit/9d74f0146cc0dbbea549d11a25325edb38fc40fb)) - by @ghiscoding
* validate allowed frozen column or alert when setting option ([#2145](https://github.com/ghiscoding/slickgrid-universal/issues/2145)) ([f550a99](https://github.com/ghiscoding/slickgrid-universal/commit/f550a99a40a5453c3c9a18e159720a1f6db6fb60)) - by @ghiscoding

## [9.8.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.7.0...v9.8.0) (2025-08-23)

### Bug Fixes

* changing preset views with hidden cols should render properly ([#2119](https://github.com/ghiscoding/slickgrid-universal/issues/2119)) ([a2a7653](https://github.com/ghiscoding/slickgrid-universal/commit/a2a7653ea3d9ad03459f9a469149d0de045dffc8)) - by @ghiscoding
* column freeze + reorder same order could cause columns misalignment ([#2118](https://github.com/ghiscoding/slickgrid-universal/issues/2118)) ([4c101e3](https://github.com/ghiscoding/slickgrid-universal/commit/4c101e3d9f83b230abaf2d335a515e2c32ab283b)) - by @ghiscoding
* delayed data with Pagination not showing, regressed in [#1363](https://github.com/ghiscoding/slickgrid-universal/issues/1363) ([#2104](https://github.com/ghiscoding/slickgrid-universal/issues/2104)) ([307a078](https://github.com/ghiscoding/slickgrid-universal/commit/307a0784995b3a3bcaa5869e687d311a7fae5fd9)) - by @ghiscoding
* hiding a column, freezing another column should keep freeze index ([#2114](https://github.com/ghiscoding/slickgrid-universal/issues/2114)) ([424a86b](https://github.com/ghiscoding/slickgrid-universal/commit/424a86b4677d6b66e622161693c5b151acb67f80)) - by @ghiscoding

## [9.7.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.6.1...v9.7.0) (2025-08-12)

### Bug Fixes

* deprecate `mdi-...px` (icon size) and `text-color-...` ([#2089](https://github.com/ghiscoding/slickgrid-universal/issues/2089)) ([3b24a18](https://github.com/ghiscoding/slickgrid-universal/commit/3b24a187503dfb0b71b3adf3faa9a4622bf2b962)) - by @ghiscoding
* htmlDecode should be able to decode everything (entities/tags) ([#2100](https://github.com/ghiscoding/slickgrid-universal/issues/2100)) ([f6763e3](https://github.com/ghiscoding/slickgrid-universal/commit/f6763e3e64a2a3593c8a048bb1bd3f7d46e8c081)) - by @ghiscoding
* regression with copy to clipboard with native API ([#2088](https://github.com/ghiscoding/slickgrid-universal/issues/2088)) ([0871e97](https://github.com/ghiscoding/slickgrid-universal/commit/0871e9796274e7c388faa7b378e8cccbb3baf0a4)) - by @ghiscoding

### Performance Improvements

* remove any IE specific code ([#2082](https://github.com/ghiscoding/slickgrid-universal/issues/2082)) ([df942aa](https://github.com/ghiscoding/slickgrid-universal/commit/df942aad51c4ea8dacbe805242cd90d11aade3fe)) - by @ghiscoding

## [9.6.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.5.0...v9.6.0) (2025-07-27)

### Bug Fixes

* add min/max width on RowMove icon for a constant width ([#2067](https://github.com/ghiscoding/slickgrid-universal/issues/2067)) ([401ebed](https://github.com/ghiscoding/slickgrid-universal/commit/401ebedcda5c9cc38740863985b0c72dfab49f64)) - by @ghiscoding

## [9.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.4.0...v9.5.0) (2025-07-19)

### Features

* add unfreeze command to HeaderMenu, toggle command after calling ([#2058](https://github.com/ghiscoding/slickgrid-universal/issues/2058)) ([eb7cdd4](https://github.com/ghiscoding/slickgrid-universal/commit/eb7cdd40717a3e09d5d3961c54ab360c48c2d65b)) - by @ghiscoding

### Bug Fixes

* update Vanilla-Calendar version & drop local pnpm patch ([#2055](https://github.com/ghiscoding/slickgrid-universal/issues/2055)) ([e23f52d](https://github.com/ghiscoding/slickgrid-universal/commit/e23f52db3f4f60b4d44f141db8de89cfe5493104)) - by @ghiscoding

## [9.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.3.0...v9.4.0) (2025-07-12)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [9.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.2.0...v9.3.0) (2025-07-05)

### Bug Fixes

* use custom clipboard override when native API unsupported in SF ([#2032](https://github.com/ghiscoding/slickgrid-universal/issues/2032)) ([db513d0](https://github.com/ghiscoding/slickgrid-universal/commit/db513d0c33ea266b2751f90647ebaae5196efb6b)) - by @ghiscoding

## [9.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.1.0...v9.2.0) (2025-06-14)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [9.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v9.0.3...v9.1.0) (2025-05-31)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [9.0.3](https://github.com/ghiscoding/slickgrid-universal/compare/v9.0.2...v9.0.3) (2025-05-16)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [9.0.2](https://github.com/ghiscoding/slickgrid-universal/compare/v9.0.0...v9.0.2) (2025-05-16)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [9.0.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.14.0...v9.0.0) (2025-05-10)

### ⚠ BREAKING CHANGES

* prepare next major release v9.0 (#1947)

### Features

* prepare next major release v9.0 ([#1947](https://github.com/ghiscoding/slickgrid-universal/issues/1947)) ([0bbc398](https://github.com/ghiscoding/slickgrid-universal/commit/0bbc39803c6956f74f6a6b46dc39eb3a97ec84a5)) - by @ghiscoding

## [5.14.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.13.4...v5.14.0) (2025-04-26)

### Bug Fixes

* **deps:** update all non-major dependencies ([#1930](https://github.com/ghiscoding/slickgrid-universal/issues/1930)) ([a2ef902](https://github.com/ghiscoding/slickgrid-universal/commit/a2ef9024d9fa59f926bf5eaae3f7d12f44ff0ad2)) - by @renovate-bot

### Reverts

* Revert "chore: enable pnpm `shellEmulator` & remove `cross-env` (#1924)" (#1926) ([1352f2e](https://github.com/ghiscoding/slickgrid-universal/commit/1352f2ea8e66aeebbb94e11c415bf6314c34fc00)), closes [#1924](https://github.com/ghiscoding/slickgrid-universal/issues/1924) [#1926](https://github.com/ghiscoding/slickgrid-universal/issues/1926) - by @ghiscoding

## [5.13.4](https://github.com/ghiscoding/slickgrid-universal/compare/v5.13.3...v5.13.4) (2025-04-09)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.13.3](https://github.com/ghiscoding/slickgrid-universal/compare/v5.13.2...v5.13.3) (2025-04-02)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.13.2](https://github.com/ghiscoding/slickgrid-universal/compare/v5.13.1...v5.13.2) (2025-03-29)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.13.1](https://github.com/ghiscoding/slickgrid-universal/compare/v5.13.0...v5.13.1) (2025-03-19)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.13.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.12.2...v5.13.0) (2025-03-01)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.12.2](https://github.com/ghiscoding/slickgrid-universal/compare/v5.12.1...v5.12.2) (2025-02-08)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.12.1](https://github.com/ghiscoding/slickgrid-universal/compare/v5.12.0...v5.12.1) (2025-01-25)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.12.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.11.0...v5.12.0) (2025-01-21)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.11.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.10.2...v5.11.0) (2024-12-14)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.10.2](https://github.com/ghiscoding/slickgrid-universal/compare/v5.10.1...v5.10.2) (2024-11-30)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.10.1](https://github.com/ghiscoding/slickgrid-universal/compare/v5.10.0...v5.10.1) (2024-11-09)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.10.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.9.0...v5.10.0) (2024-11-02)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.9.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.8.0...v5.9.0) (2024-10-19)

### Bug Fixes

* **deps:** update all non-major dependencies ([fcc779b](https://github.com/ghiscoding/slickgrid-universal/commit/fcc779b25091dc2e9f49a5ce5c1362e7f138e8b1)) - by @renovate-bot

## [5.8.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.7.0...v5.8.0) (2024-09-29)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.7.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.6.1...v5.7.0) (2024-09-14)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.6.1](https://github.com/ghiscoding/slickgrid-universal/compare/v5.6.0...v5.6.1) (2024-08-31)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.6.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.5.2...v5.6.0) (2024-08-24)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.5.2](https://github.com/ghiscoding/slickgrid-universal/compare/v5.5.1...v5.5.2) (2024-08-17)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.5.1](https://github.com/ghiscoding/slickgrid-universal/compare/v5.5.0...v5.5.1) (2024-08-17)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.4.0...v5.5.0) (2024-08-07)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.3.4...v5.4.0) (2024-07-20)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.3.4](https://github.com/ghiscoding/slickgrid-universal/compare/v5.3.3...v5.3.4) (2024-07-13)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.3.3](https://github.com/ghiscoding/slickgrid-universal/compare/v5.3.2...v5.3.3) (2024-07-06)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.3.2](https://github.com/ghiscoding/slickgrid-universal/compare/v5.3.1...v5.3.2) (2024-06-29)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.3.1](https://github.com/ghiscoding/slickgrid-universal/compare/v5.3.0...v5.3.1) (2024-06-28)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.2.0...v5.3.0) (2024-06-28)

### Bug Fixes

* **deps:** update all non-major dependencies ([#1581](https://github.com/ghiscoding/slickgrid-universal/issues/1581)) ([e89d1ad](https://github.com/ghiscoding/slickgrid-universal/commit/e89d1ad8d8573b3faef9bc9d312ecac199461c81)) - by @renovate-bot

## [5.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.1.0...v5.2.0) (2024-06-18)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [5.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.0.1...v5.1.0) (2024-06-07)

### Features

* **core:** add optional Top-Header for Drag Grouping & Header Grouping ([#1556](https://github.com/ghiscoding/slickgrid-universal/issues/1556)) ([7d4a769](https://github.com/ghiscoding/slickgrid-universal/commit/7d4a769943d1f96321686e91634efe443b1eb8b2)) - by @ghiscoding

## [5.0.1](https://github.com/ghiscoding/slickgrid-universal/compare/v5.0.0...v5.0.1) (2024-05-11)

### Bug Fixes

* **deps:** update all non-major dependencies ([#1519](https://github.com/ghiscoding/slickgrid-universal/issues/1519)) ([90a5e26](https://github.com/ghiscoding/slickgrid-universal/commit/90a5e26f8fa6f51f04eea0e92dff86e7853d88b4)) - by @renovate-bot

## [5.0.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.7.0...v5.0.0) (2024-05-10)

### ⚠ BREAKING CHANGES

* pure SVG icons, Moment to Tempo, Flatpickr to Vanilla-Calendar (#1518)

### Features

* pure SVG icons, Moment to Tempo, Flatpickr to Vanilla-Calendar ([#1518](https://github.com/ghiscoding/slickgrid-universal/issues/1518)) ([21e50db](https://github.com/ghiscoding/slickgrid-universal/commit/21e50db5ecdc6a0b2f8250f115562ab4fd6e3f4d)) - by @ghiscoding

## [5.0.0-beta.3](https://github.com/ghiscoding/slickgrid-universal/compare/v5.0.0-beta.2...v5.0.0-beta.3) (2024-05-09)

### Bug Fixes

* **common:** consider target size when auto-position picker/modal ([#1517](https://github.com/ghiscoding/slickgrid-universal/issues/1517)) ([e3a70b8](https://github.com/ghiscoding/slickgrid-universal/commit/e3a70b810d04c963f48454b78053c1bd45f96ebf)) - by @ghiscoding

## [5.0.0-beta.2](https://github.com/ghiscoding/slickgrid-universal/compare/v4.7.0...v5.0.0-beta.2) (2024-05-07)

### ⚠ BREAKING CHANGES

* **common:** migrate from `moment` to `moment-tiny` (#1456)
* **styling:** convert SVG icons to pure CSS (#1474)

### Features

* **common:** migrate from `moment` to `moment-tiny` ([#1456](https://github.com/ghiscoding/slickgrid-universal/issues/1456)) ([90690f4](https://github.com/ghiscoding/slickgrid-universal/commit/90690f4b6a4c8f8a7a221ddc1df69077384f48a9)) - by @ghiscoding
* **styling:** convert SVG icons to pure CSS ([#1474](https://github.com/ghiscoding/slickgrid-universal/issues/1474)) ([70cda8a](https://github.com/ghiscoding/slickgrid-universal/commit/70cda8aa9304ac8ea4bab06390dc1b4c4423df2e)) - by @ghiscoding

### Bug Fixes

* **styling:** empty warning should separate icon & text ([#1491](https://github.com/ghiscoding/slickgrid-universal/issues/1491)) ([240cbd3](https://github.com/ghiscoding/slickgrid-universal/commit/240cbd3b5a8cfb6a6cab563bc43d705332d59beb)) - by @ghiscoding

# [4.7.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.6.3...v4.7.0) (2024-04-20)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [4.6.3](https://github.com/ghiscoding/slickgrid-universal/compare/v4.6.1...v4.6.3) (2024-03-31)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [4.6.1](https://github.com/ghiscoding/slickgrid-universal/compare/v4.6.0...v4.6.1) (2024-03-31)

### Bug Fixes

* revisit package `exports` to pass "are the types wrong" ([#1440](https://github.com/ghiscoding/slickgrid-universal/issues/1440)) ([20229f7](https://github.com/ghiscoding/slickgrid-universal/commit/20229f78adef51078f99fce3f5a46ac88280a048)) - by @ghiscoding

# [4.6.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.5.0...v4.6.0) (2024-03-23)

### Bug Fixes

* **build:** add ESLint-TS rules to enforce `type` imports and exports ([#1432](https://github.com/ghiscoding/slickgrid-universal/issues/1432)) ([cce4693](https://github.com/ghiscoding/slickgrid-universal/commit/cce4693556e01d7f664fbe832ae4e7fd5776dc6b)) - by @ghiscoding

* **common:** bump ms-select to fix compatibility problem in Salesforce ([#1425](https://github.com/ghiscoding/slickgrid-universal/issues/1425)) ([d3d2d39](https://github.com/ghiscoding/slickgrid-universal/commit/d3d2d390a8a1b17d0cd3699ddebfea855fdc5f77)) - by @ghiscoding

### Features

* **common:** add optional "Toggle Dark Mode" in Grid Menu ([#1418](https://github.com/ghiscoding/slickgrid-universal/issues/1418)) ([990c1df](https://github.com/ghiscoding/slickgrid-universal/commit/990c1df2a39a6b5098c991b16f43c5679daf4bb5)) - by @ghiscoding

# [4.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.4.1...v4.5.0) (2024-03-05)

### Bug Fixes

* auto-resize not just grid but also headers for Salesforce tabs ([#1395](https://github.com/ghiscoding/slickgrid-universal/issues/1395)) ([6180461](https://github.com/ghiscoding/slickgrid-universal/commit/6180461b543cb7d4cc14d1504cb0db7d35990164)) - by @ghiscoding

### Features

* **deps:** simplify package TS Types exports ([#1402](https://github.com/ghiscoding/slickgrid-universal/issues/1402)) ([19bac52](https://github.com/ghiscoding/slickgrid-universal/commit/19bac52e5fcb8e523a26ab1f6564f0b6a2b93ef4)) - by @ghiscoding

* **styling:** add Dark Mode grid option ([#1407](https://github.com/ghiscoding/slickgrid-universal/issues/1407)) ([855151b](https://github.com/ghiscoding/slickgrid-universal/commit/855151b9f47a5238e3069f8c85ba4ed8a5bf9bb6)) - by @ghiscoding

## [4.4.1](https://github.com/ghiscoding/slickgrid-universal/compare/v4.3.1...v4.4.1) (2024-02-13)

### Bug Fixes

* **deps:** update all non-major dependencies ([#1381](https://github.com/ghiscoding/slickgrid-universal/issues/1381)) ([2562352](https://github.com/ghiscoding/slickgrid-universal/commit/25623527d05dd713123e1031b682f0a80cca37de)) - by @renovate-bot

* **publish:** do not npm publish `tsconfig.tsbuildinfo` ([#1373](https://github.com/ghiscoding/slickgrid-universal/issues/1373)) ([9223338](https://github.com/ghiscoding/slickgrid-universal/commit/922333843852ae861015e4bbec053d4937222aa2)) - by @ghiscoding

# [4.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.3.1...v4.4.0) (2024-02-12)

### Bug Fixes

* **deps:** update all non-major dependencies ([#1381](https://github.com/ghiscoding/slickgrid-universal/issues/1381)) ([2562352](https://github.com/ghiscoding/slickgrid-universal/commit/25623527d05dd713123e1031b682f0a80cca37de)) - by @renovate-bot

* **publish:** do not npm publish `tsconfig.tsbuildinfo` ([#1373](https://github.com/ghiscoding/slickgrid-universal/issues/1373)) ([9223338](https://github.com/ghiscoding/slickgrid-universal/commit/922333843852ae861015e4bbec053d4937222aa2)) - by @ghiscoding

## [4.3.1](https://github.com/ghiscoding/slickgrid-universal/compare/v4.3.0...v4.3.1) (2024-01-27)

### Bug Fixes

* Salesforce doesn't support Document Fragment ([#1365](https://github.com/ghiscoding/slickgrid-universal/issues/1365)) ([9e3fb5f](https://github.com/ghiscoding/slickgrid-universal/commit/9e3fb5f2f3220d6e57d2efc20fd85105a8a39454)) - by @ghiscoding

### Performance Improvements

* decrease calls to setItems & grid invalidate ([#1363](https://github.com/ghiscoding/slickgrid-universal/issues/1363)) ([cab6898](https://github.com/ghiscoding/slickgrid-universal/commit/cab68989ebd53178dfcee5ed293379dc8932a72f)) - by @ghiscoding

# [4.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.2.0...v4.3.0) (2024-01-20)

### Bug Fixes

* SlickEmptyWarningComponent should accept native HTML for CSP safe ([#1333](https://github.com/ghiscoding/slickgrid-universal/issues/1333)) ([4740f96](https://github.com/ghiscoding/slickgrid-universal/commit/4740f961813666cbae918cb4940e7c2ec57bec2d)) - by @ghiscoding

# [4.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.1.0...v4.2.0) (2023-12-30)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

# [4.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.3...v4.1.0) (2023-12-21)

### Bug Fixes

* **npm:** publish src folder for source maps, fixes downstream builds ([#1269](https://github.com/ghiscoding/slickgrid-universal/issues/1269)) ([701da75](https://github.com/ghiscoding/slickgrid-universal/commit/701da752565384408e22857a201828379bfc26ff)) - by @ghiscoding

### Features

* **utils:** replace slick-core extend utils with `node-extend` ([#1277](https://github.com/ghiscoding/slickgrid-universal/issues/1277)) ([3439118](https://github.com/ghiscoding/slickgrid-universal/commit/3439118da344cd852a1b1af5bd83c4b894213464)) - by @ghiscoding

## [4.0.3](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.2...v4.0.3) (2023-12-16)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [4.0.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.2...v4.0.2) (2023-12-15)

* BREAKING CHANGE: merge SlickGrid into Slickgrid-Universal & drop external dep (#1264) ([18b96ce](https://github.com/ghiscoding/slickgrid-universal/commit/18b96ce2a5779b36c8bc2a977d4e03b0a7003006)), closes [#1264](https://github.com/ghiscoding/slickgrid-universal/issues/1264) - by @ghiscoding

### BREAKING CHANGES

* merge SlickGrid into Slickgrid-Universal & drop external dep

## [4.0.1-alpha.1](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.1-alpha.0...v4.0.1-alpha.1) (2023-12-12)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [4.0.1-alpha.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.0-alpha.0...v4.0.1-alpha.0) (2023-12-10)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

# [4.0.0-alpha.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.1...v4.0.0-alpha.0) (2023-12-09)

## [3.7.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.1...v3.7.2) (2023-12-12)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [3.7.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.0...v3.7.1) (2023-12-08)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

# [3.7.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.6.0...v3.7.0) (2023-12-08)

### Bug Fixes

* registered external resouces should keep singleton ref ([#1242](https://github.com/ghiscoding/slickgrid-universal/issues/1242)) ([adf2054](https://github.com/ghiscoding/slickgrid-universal/commit/adf2054bdc8ef7701e6fab78e685d49b8424da29)) - by @ghiscoding

# 3.6.0 (2023-11-26)

### Features

* Column.excludeFieldFromQuery, exclude field but keep fields array ([#1217](https://github.com/ghiscoding/slickgrid-universal/issues/1217)) ([85cc514](https://github.com/ghiscoding/slickgrid-universal/commit/85cc514c945c1ad6eadd1a93a2839775a95da261)) - by @Harsgalt86

## [3.5.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.5.0...v3.5.1) (2023-11-13)

### Bug Fixes

* improve build & types exports for all targets, Node, CJS/ESM ([#1188](https://github.com/ghiscoding/slickgrid-universal/issues/1188)) ([980fd68](https://github.com/ghiscoding/slickgrid-universal/commit/980fd68f6ce9564bb1fcac5f6ee68fd35f839e8f)) - by @ghiscoding

# [3.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.4.2...v3.5.0) (2023-11-10)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [3.4.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.4.1...v3.4.2) (2023-11-02)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [3.4.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.4.0...v3.4.1) (2023-11-02)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

# [3.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.3.2...v3.4.0) (2023-11-02)

### Bug Fixes

* **deps:** update all non-major dependencies ([#1138](https://github.com/ghiscoding/slickgrid-universal/issues/1138)) ([82a602e](https://github.com/ghiscoding/slickgrid-universal/commit/82a602e8c3c25a45979d3e3bbf4766d1bae33f80)) - by @renovate-bot

## [3.3.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.3.1...v3.3.2) (2023-10-06)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

# [3.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.2.2...v3.3.0) (2023-10-05)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [3.2.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.2.1...v3.2.2) (2023-09-24)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [3.2.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.2.0...v3.2.1) (2023-09-05)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [3.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.1.0...v3.2.0) (2023-08-21)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [3.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.0.1...v3.1.0) (2023-07-20)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [3.0.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.0.0...v3.0.1) (2023-07-01)

### Bug Fixes

* **GridState:** calling getAssociatedGridColumns should extend column (part2) ([#1015](https://github.com/ghiscoding/slickgrid-universal/issues/1015)) ([3ea1d02](https://github.com/ghiscoding/slickgrid-universal/commit/3ea1d0289ba260325a2592fda42fecce10499525)) - by @ghiscoding

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

### Features

* drop jQuery requirement ([#962](https://github.com/ghiscoding/slickgrid-universal/issues/962)) ([3da21da](https://github.com/ghiscoding/slickgrid-universal/commit/3da21daacc391a0fb309fcddd78442642c5269f6)) - by @ghiscoding

## [2.6.4](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.3...v2.6.4) (2023-05-20)

### Bug Fixes

* **binding:** remove unnecessary sanitizer in BindingService ([#947](https://github.com/ghiscoding/slickgrid-universal/issues/947)) ([32a9a35](https://github.com/ghiscoding/slickgrid-universal/commit/32a9a35861647510ccb0d3dd14340cd3a1689fc1)) - by @ghiscoding

* **deps:** update all non-major dependencies ([#975](https://github.com/ghiscoding/slickgrid-universal/issues/975)) ([c4313b0](https://github.com/ghiscoding/slickgrid-universal/commit/c4313b014da67826b46324c2933f923ea90e7088)) - by @renovate-bot

## [2.6.3](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.2...v2.6.3) (2023-03-23)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [2.6.2](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.1...v2.6.2) (2023-03-03)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [2.6.1](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.0...v2.6.1) (2023-02-24)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

# [2.6.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.5.0...v2.6.0) (2023-02-23)

### Features

* **build:** move TypeScript types into a single dist/types folder ([#905](https://github.com/ghiscoding/slickgrid-universal/issues/905)) ([b139c1e](https://github.com/ghiscoding/slickgrid-universal/commit/b139c1e7910f2029ceca58a9d744320ed3ba5372)) - by @ghiscoding

# [2.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.4.1...v2.5.0) (2023-02-17)

### Bug Fixes

* **build:** package exports prop had invalid ESM import link ([#892](https://github.com/ghiscoding/slickgrid-universal/issues/892)) ([7f95f69](https://github.com/ghiscoding/slickgrid-universal/commit/7f95f698447f8178cb7ceec416c35f4957fddbe9)) - by @ghiscoding

* **common:** Excel copy cell ranges shouldn't lose its cell focus ([#901](https://github.com/ghiscoding/slickgrid-universal/issues/901)) ([1dc8b76](https://github.com/ghiscoding/slickgrid-universal/commit/1dc8b762b4fc8070eec003161fdc9c4ebf60afd2)) - by @ghiscoding

* **editor:** comparing select editor value against `['']` isn't valid ([#909](https://github.com/ghiscoding/slickgrid-universal/issues/909)) ([d93fd5f](https://github.com/ghiscoding/slickgrid-universal/commit/d93fd5f163e393c47fad8c8d285a5788b3834adf)) - by @ghiscoding

* **export:** Excel export auto-detect number with Formatters.multiple ([#902](https://github.com/ghiscoding/slickgrid-universal/issues/902)) ([be33a68](https://github.com/ghiscoding/slickgrid-universal/commit/be33a68cadbdaed0c60b00bdcd123f3a4797fb8a)) - by @ghiscoding

## [2.4.1](https://github.com/ghiscoding/slickgrid-universal/compare/v2.4.0...v2.4.1) (2023-02-04)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

# [2.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.3.0...v2.4.0) (2023-02-04)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

# [2.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.2.2...v2.3.0) (2023-01-21)

### Features

* **salesforce:** add Excel Export to Salesforce & upgrade zip to 2.x ([#862](https://github.com/ghiscoding/slickgrid-universal/issues/862)) ([80ff4b7](https://github.com/ghiscoding/slickgrid-universal/commit/80ff4b79d101956334ee99b28e06e71dadf1de70)) - by @ghiscoding

## [2.2.2](https://github.com/ghiscoding/slickgrid-universal/compare/v2.2.1...v2.2.2) (2022-12-24)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [2.2.1](https://github.com/ghiscoding/slickgrid-universal/compare/v2.2.0...v2.2.1) (2022-12-22)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

# [2.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.1.3...v2.2.0) (2022-12-21)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [2.1.3](https://github.com/ghiscoding/slickgrid-universal/compare/v2.1.2...v2.1.3) (2022-12-08)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [2.1.2](https://github.com/ghiscoding/slickgrid-universal/compare/v2.1.1...v2.1.2) (2022-12-02)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [2.1.1](https://github.com/ghiscoding/slickgrid-universal/compare/v2.1.0...v2.1.1) (2022-11-19)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

# [2.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.0.0...v2.1.0) (2022-11-17)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

# [2.0.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.4.0...v2.0.0) (2022-10-17)

### Features

* **common:** BREAKING CHANGE replace jQueryUI with SortableJS in common & DraggableGrouping ([#772](https://github.com/ghiscoding/slickgrid-universal/issues/772)) ([a9db2cc](https://github.com/ghiscoding/slickgrid-universal/commit/a9db2cca965adc7871d7e4d050ae8f3653c84bb4)), closes [#752](https://github.com/ghiscoding/slickgrid-universal/issues/752) [#756](https://github.com/ghiscoding/slickgrid-universal/issues/756) - by @ghiscoding

# [2.0.0-alpha.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.4.0...v2.0.0-alpha.0) (2022-10-15)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

# [1.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.7...v1.4.0) (2022-08-15)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [1.3.7](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.6...v1.3.7) (2022-08-02)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [1.3.5](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.4...v1.3.5) (2022-07-28)

### Bug Fixes

* **build:** use `workspace:~` to avoid multiple versions d/l on ext libs ([3ca1943](https://github.com/ghiscoding/slickgrid-universal/commit/3ca1943f1247e66d3213fb5edeed7e7246032767)) - by @ghiscoding

## [1.3.4](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.3...v1.3.4) (2022-07-28)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [1.3.3](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.2...v1.3.3) (2022-07-07)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [1.3.2](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.0...v1.3.2) (2022-07-06)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

# [1.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.6...v1.3.0) (2022-06-18)

### Bug Fixes

* **deps:** add missing depency in vanilla bundle package ([fa08fe6](https://github.com/ghiscoding/slickgrid-universal/commit/fa08fe6f097461c2bf8029307e59631738b1654b))

* **deps:** update all non-major dependencies ([5097cea](https://github.com/ghiscoding/slickgrid-universal/commit/5097ceae88c0ea212e0aa6ea2a5b1020368f3216))

## [1.2.6](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.5...v1.2.6) (2022-03-19)

### Bug Fixes

* **core:** use latest Flatpickr version to fix leak in it ([0f68f51](https://github.com/ghiscoding/slickgrid-universal/commit/0f68f5131e227abfaf2dcaa790dda53a235d95fe))

## [1.2.5](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.4...v1.2.5) (2022-03-06)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

## [1.2.4](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.3...v1.2.4) (2022-02-15)

### Bug Fixes

* **core:** rollback node/npm minimum engine versions ([7fcaecd](https://github.com/ghiscoding/slickgrid-universal/commit/7fcaecdf5087e1414037832962ec9ea5365aca41))

## [1.2.3](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.1...v1.2.3) (2022-02-14)

### Bug Fixes

* **core:** deleting Slicker object caused issue with cache ([3f3e261](https://github.com/ghiscoding/slickgrid-universal/commit/3f3e261c1855e7eb695e00a105b7c797462ed298)), closes [#606](https://github.com/ghiscoding/slickgrid-universal/issues/606)

* **editors:** select editor should call save only once ([d111c2f](https://github.com/ghiscoding/slickgrid-universal/commit/d111c2f7799151236c6053d7a5288d1fdd530550))

* **resizer:** use default resize when resizeByContent has no data ([8499b61](https://github.com/ghiscoding/slickgrid-universal/commit/8499b61b5cc6365af0035d254a9487c79b74bd7f))

## [1.2.1](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.0...v1.2.1) (2022-01-18)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle

# [1.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.1.1...v1.2.0) (2022-01-06)

### Bug Fixes

* **dev:** optimize webpack dev watch ([1340c51](https://github.com/ghiscoding/slickgrid-universal/commit/1340c51b7e2554e9c29ebb9b8ab9b27a3f20cfe9))

* **filter:** update multiple-select to fix select filtering ([63dcd08](https://github.com/ghiscoding/slickgrid-universal/commit/63dcd0873026fb8ba036ca52ba31f583d6ad136f)), closes [#865](https://github.com/ghiscoding/slickgrid-universal/issues/865)

### Features

* **composite:** add new `validateMassUpdateChange` callback & bug fixes ([#603](https://github.com/ghiscoding/slickgrid-universal/issues/603)) ([2c1559b](https://github.com/ghiscoding/slickgrid-universal/commit/2c1559b7a3b0b1a642a664e59a025ce78a747946))

## [1.1.1](https://github.com/ghiscoding/slickgrid-universal/compare/v1.1.0...v1.1.1) (2021-12-11)

### Bug Fixes

* **build:** bump version manually bcoz of previous force push ([5e9a610](https://github.com/ghiscoding/slickgrid-universal/commit/5e9a610ad01d752673856591f9b5de73b0ece0e9))

# [1.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.19.2...v1.1.0) (2021-12-11)

**Note:** Version bump only for package @slickgrid-universal/vanilla-force-bundle
