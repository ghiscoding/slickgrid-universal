# Change Log
All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.14.0...v1.2.0) (2025-04-26)

## [1.1.4](https://github.com/ghiscoding/slickgrid-universal/compare/v5.13.4...v1.1.4) (2025-04-09)

### Bug Fixes

* error in CSS ([#1890](https://github.com/ghiscoding/slickgrid-universal/issues/1890)) ([6b23d5a](https://github.com/ghiscoding/slickgrid-universal/commit/6b23d5a079b367be9be57d778c543f9f0e86c324)) - by @wboevink

## [1.1.2](https://github.com/ghiscoding/slickgrid-universal/compare/v5.13.2...v1.1.2) (2025-03-29)

### Bug Fixes

* shift + a should not select all cells upwards ([#1880](https://github.com/ghiscoding/slickgrid-universal/issues/1880)) ([9e77821](https://github.com/ghiscoding/slickgrid-universal/commit/9e77821befb6fed4a05d9d3db1202b3cf3edcf73)) - by @zewa666

## <small>1.1.1 (2025-03-19)</small>

## 1.1.1 (2025-03-18)

### Bug Fixes

* **deps:** update vuejs dependencies ([#1874](https://github.com/ghiscoding/slickgrid-universal/issues/1874)) ([66e4814](https://github.com/ghiscoding/slickgrid-universal/commit/66e4814c274189b7914a5c98deb544ec0b220583)) - by @renovate-bot
* **deps:** update vuejs dependencies ([#1875](https://github.com/ghiscoding/slickgrid-universal/issues/1875)) ([81f4803](https://github.com/ghiscoding/slickgrid-universal/commit/81f480354993fee8e882f85dbb2c1823a406139c)) - by @renovate-bot
* **deps:** update vuejs dependencies ([#1876](https://github.com/ghiscoding/slickgrid-universal/issues/1876)) ([927a708](https://github.com/ghiscoding/slickgrid-universal/commit/927a7087e20af5d7d1e1335147382ca98d3c2389)) - by @renovate-bot
* Row Detail and filtering should work with vanilla grid ([#1867](https://github.com/ghiscoding/slickgrid-universal/issues/1867)) ([7f37965](https://github.com/ghiscoding/slickgrid-universal/commit/7f379657719db8b5800b016614a2f5544643510e)) - by @ghiscoding
* Row Detail should also work with fixed grid height or w/o autoHeight ([#1868](https://github.com/ghiscoding/slickgrid-universal/issues/1868)) ([1ccb36f](https://github.com/ghiscoding/slickgrid-universal/commit/1ccb36ff6bd12b75ef351bf5ec234fc66e004ac6)) - by @ghiscoding
* **vue:** don't rely on `i18next` interface since dep is optional ([#1872](https://github.com/ghiscoding/slickgrid-universal/issues/1872)) ([1527de0](https://github.com/ghiscoding/slickgrid-universal/commit/1527de03c6bccecac2a63f6b1244175c815b3206)) - by @ghiscoding
* **vue:** Row Detail redraw all should work as expected ([#1865](https://github.com/ghiscoding/slickgrid-universal/issues/1865)) ([b4254ca](https://github.com/ghiscoding/slickgrid-universal/commit/b4254caceca430f3ec48ec9339a4b8390b5acbd1)) - by @ghiscoding

## 1.1.0 (2025-03-01)

### Features

* Row Detail with inner grids ([#1853](https://github.com/ghiscoding/slickgrid-universal/issues/1853)) ([3c9d544](https://github.com/ghiscoding/slickgrid-universal/commit/3c9d54493ce670611a25a6cf4944fed9c2bfe280)) - by @ghiscoding

### Bug Fixes

* chore(deps): update all non-major dependencies (#1851) ([832a66c](https://github.com/ghiscoding/slickgrid-universal/commit/832a66c)), closes [#1851](https://github.com/ghiscoding/slickgrid-universal/issues/1851)

## [1.0.2](https://github.com/ghiscoding/slickgrid-universal/slickgrid-vue/compare/v1.0.1...v1.0.2) (2025-02-08)

* **vue:** Row Detail were not unmounted correctly before recreating them ([#1840](https://github.com/ghiscoding/slickgrid-universal/issues/1840)) ([080e815](https://github.com/ghiscoding/slickgrid-universal/commit/080e815b3b83f99d07bbd8e1c8e70ff75e90057f)) - by @ghiscoding

## [1.0.1](https://github.com/ghiscoding/slickgrid-universal/slickgrid-vue/compare/v1.0.0...v1.0.1) (2025-01-25)

# [1.0.0](https://github.com/ghiscoding/slickgrid-universal/slickgrid-vue/compare/v0.2.0...v1.0.0) (2025-01-21)

- **vue:** add `rowspan` to Slickgrid-Vue ([#1804](https://github.com/ghiscoding/slickgrid-universal/issues/1804)) ([a7e394d](https://github.com/ghiscoding/slickgrid-universal/commit/a7e394db31b98dbefd6dc7567cf14c031ef92215)) - by @ghiscoding

## [0.2.1](https://github.com/ghiscoding/slickgrid-universal/slickgrid-vue/compare/v0.2.0...v0.2.1) (2024-12-14)

### Bug Fixes

- **vue:** publish with pnpm to correctly replace `workspace:` protocol with real version - by @ghiscoding

# [0.2.0](https://github.com/ghiscoding/slickgrid-universal/slickgrid-vue/compare/v0.1.0...v0.2.0) (2024-12-14)

### ⚠ BREAKING CHANGES

- `i18next` is now totally optional and must be `provide`d separately.

### Features

- **vue:** allow using SlickgridVue component w/o grid options ([#1771](https://github.com/ghiscoding/slickgrid-universal/issues/1771)) ([2a24968](https://github.com/ghiscoding/slickgrid-universal/commit/2a249683fca9dda7785ffb4f99f2ff2e6270de2c)) - by @ghiscoding
- **vue:** dynamically create grid from imported CSV data ([#1773](https://github.com/ghiscoding/slickgrid-universal/issues/1773)) ([d67d339](https://github.com/ghiscoding/slickgrid-universal/commit/d67d339519299db070d0f693a0b51710c8e3896a)) - by @ghiscoding
- **vue:** make I18Next totally optional in Slickgrid-Vue ([#1765](https://github.com/ghiscoding/slickgrid-universal/issues/1765)) ([9a225c9](https://github.com/ghiscoding/slickgrid-universal/commit/9a225c99f09b62e1703909b4f90e581a42c7921e)) - by @ghiscoding

### Bug Fixes

- add missing collection observer in Vue grid implementation ([#1762](https://github.com/ghiscoding/slickgrid-universal/issues/1762)) ([a99d143](https://github.com/ghiscoding/slickgrid-universal/commit/a99d143a1bd0f13143ea8a40451e1c33569465c5)) - by @ghiscoding
- **deps:** update vue.js dependencies ([#1776](https://github.com/ghiscoding/slickgrid-universal/issues/1776)) ([6060d94](https://github.com/ghiscoding/slickgrid-universal/commit/6060d94d427dd34672921357f3c34f841b39b9c7)) - by @renovate-bot
- **vue:** use dts w/Rollup to fix types & pass "are the types wrong" ([#1766](https://github.com/ghiscoding/slickgrid-universal/issues/1766)) ([30fa904](https://github.com/ghiscoding/slickgrid-universal/commit/30fa9045175198324fc20bfa18219c9a1809fe55)) - by @ghiscoding

# [0.1.0](https://github.com/ghiscoding/slickgrid-universal/slickgrid-vue/compare/v0.1.0...v0.2.0) (2024-11-30)

### Features

- create new Slickgrid-Vue package to support VueJS framework ([#1753](https://github.com/ghiscoding/slickgrid-universal/issues/1753)) ([ec4323b](https://github.com/ghiscoding/slickgrid-universal/commit/ec4323bfd201012c767e2614f3c390c6479ce00e)) - by @ghiscoding