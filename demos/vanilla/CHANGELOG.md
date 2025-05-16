# Change Log
## All-in-One SlickGrid framework agnostic wrapper, visit [Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal) 📦🚀

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [9.0.2](https://github.com/ghiscoding/slickgrid-universal/compare/v9.0.0...v9.0.2) (2025-05-16)

**Note:** Version bump only for package vanilla-demo

## [9.0.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.14.0...v9.0.0) (2025-05-10)

### ⚠ BREAKING CHANGES

* remove Arrow pointer from Custom Tooltip (#1964)
* prepare next major release v9.0 (#1947)

### Features

* prepare next major release v9.0 ([#1947](https://github.com/ghiscoding/slickgrid-universal/issues/1947)) ([0bbc398](https://github.com/ghiscoding/slickgrid-universal/commit/0bbc39803c6956f74f6a6b46dc39eb3a97ec84a5)) - by @ghiscoding

### Bug Fixes

* remove Arrow pointer from Custom Tooltip ([#1964](https://github.com/ghiscoding/slickgrid-universal/issues/1964)) ([018169d](https://github.com/ghiscoding/slickgrid-universal/commit/018169df816441d0a8d780299ecabbc81163caba)) - by @ghiscoding

## [5.12.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.11.0...v5.12.0) (2025-01-21)

### Features

* add `initialGroupBy` to Draggable Grouping ([#1800](https://github.com/ghiscoding/slickgrid-universal/issues/1800)) ([27ec3d1](https://github.com/ghiscoding/slickgrid-universal/commit/27ec3d139961a016d7d809073d7b829cf9534e74)) - by @ghiscoding
* add final rowspan implementation ([#1798](https://github.com/ghiscoding/slickgrid-universal/issues/1798)) ([5d0f58e](https://github.com/ghiscoding/slickgrid-universal/commit/5d0f58e0b914cc1eee2925c37b347822d9d24ff0)) - by @ghiscoding
* **vue:** add rowspan to Slickgrid-Vue ([#1804](https://github.com/ghiscoding/slickgrid-universal/issues/1804)) ([e58c0cb](https://github.com/ghiscoding/slickgrid-universal/commit/e58c0cb9904f8c630b0de4116ebcbeecc40658bb)) - by @ghiscoding

### Bug Fixes

* add missing slick-filter class & flex align header filters ([78478ab](https://github.com/ghiscoding/slickgrid-universal/commit/78478ab2a4e05443cd7d5de260e639092a41162f)) - by @ghiscoding

## [5.11.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.10.2...v5.11.0) (2024-12-14)

### Features

* create new Slickgrid-Vue package to support VueJS framework ([#1753](https://github.com/ghiscoding/slickgrid-universal/issues/1753)) ([ec4323b](https://github.com/ghiscoding/slickgrid-universal/commit/ec4323bfd201012c767e2614f3c390c6479ce00e)) - by @ghiscoding
* dynamically create grid from imported CSV data ([#1772](https://github.com/ghiscoding/slickgrid-universal/issues/1772)) ([2c32450](https://github.com/ghiscoding/slickgrid-universal/commit/2c32450ace636e77cbccf2f7cec972f357edbceb)) - by @ghiscoding
* **vue:** dynamically create grid from imported CSV data ([#1773](https://github.com/ghiscoding/slickgrid-universal/issues/1773)) ([d67d339](https://github.com/ghiscoding/slickgrid-universal/commit/d67d339519299db070d0f693a0b51710c8e3896a)) - by @ghiscoding

### Bug Fixes

* add missing Collection Observer disconnect method ([#1761](https://github.com/ghiscoding/slickgrid-universal/issues/1761)) ([68a2110](https://github.com/ghiscoding/slickgrid-universal/commit/68a21109376358f2f0241445f02c46b297d66c80)) - by @ghiscoding

## [5.10.2](https://github.com/ghiscoding/slickgrid-universal/compare/v5.10.1...v5.10.2) (2024-11-30)

### Bug Fixes

* setting filter dynamically shouldn't make body taller ([#1748](https://github.com/ghiscoding/slickgrid-universal/issues/1748)) ([41e4317](https://github.com/ghiscoding/slickgrid-universal/commit/41e4317fe15498ed26cca40ad52f80e560a392d3)) - by @ghiscoding

## [5.10.1](https://github.com/ghiscoding/slickgrid-universal/compare/v5.10.0...v5.10.1) (2024-11-09)

### Bug Fixes

* **editor:** add missing `changeEditorOption()` for Composite Editor ([#1733](https://github.com/ghiscoding/slickgrid-universal/issues/1733)) ([b43b53b](https://github.com/ghiscoding/slickgrid-universal/commit/b43b53b04ead731816cdc40f8df53a6c9c0b0f6b)) - by @ghiscoding
* hideColumnByIds() should call setColumn() only once ([#1736](https://github.com/ghiscoding/slickgrid-universal/issues/1736)) ([0ba1a93](https://github.com/ghiscoding/slickgrid-universal/commit/0ba1a93c833b3fb36e9b8926d13de58471b37c23)) - by @ghiscoding
* hiding column(s) returned incorrect Grid State changes data ([#1737](https://github.com/ghiscoding/slickgrid-universal/issues/1737)) ([59a47b8](https://github.com/ghiscoding/slickgrid-universal/commit/59a47b8067c6015a221de459d3e0fb99a5113f04)) - by @ghiscoding
* more ms-select Dark Mode styling fixes ([810ce40](https://github.com/ghiscoding/slickgrid-universal/commit/810ce40eaa0b40c2576aecb61dd20fab1a377b78)) - by @ghiscoding
* remove `$primary-color` & fix more styling issues for ms-select ([2841dbc](https://github.com/ghiscoding/slickgrid-universal/commit/2841dbca855a029a0ff301a2e33e8acc292893cc)) - by @ghiscoding

## [5.10.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.9.0...v5.10.0) (2024-11-02)

### Features

* switch to SASS `[@use](https://github.com/use)` and remove any `[@import](https://github.com/import)` to fix deprecations ([ba58eab](https://github.com/ghiscoding/slickgrid-universal/commit/ba58eabe97e2b2e09f91a42c0ae49561ed36e124)) - by @ghiscoding

### Bug Fixes

* add more SASS styling fixes & fix box-shadow w/filled filters ([2fc5dad](https://github.com/ghiscoding/slickgrid-universal/commit/2fc5dad0b99eb1539002eccc118f7157980b4938)) - by @ghiscoding

## [5.9.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.8.0...v5.9.0) (2024-10-19)

### Features

* allow providing a Custom Pagination ([4a2bfc8](https://github.com/ghiscoding/slickgrid-universal/commit/4a2bfc8cbd6ef446a884bae9ead9c10c083c6ecc)) - by @ghiscoding

### Bug Fixes

* move DI to init() to make Pagination Comp working with all ports ([cd30686](https://github.com/ghiscoding/slickgrid-universal/commit/cd306864d588f1d8f9590afbf0d03722ea54a9fc)) - by @ghiscoding

## [5.8.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.7.0...v5.8.0) (2024-09-29)

### Features

* allow overriding readOnly behavior of dateEditor ([d4da489](https://github.com/ghiscoding/slickgrid-universal/commit/d4da48923a9a60f9ecde787be31b2da14922866e)) - by @zewa666
* update according to review; add unit tests ([eb176de](https://github.com/ghiscoding/slickgrid-universal/commit/eb176debd69b55ffd95cba8ec7198c821ecaddb2)) - by @zewa666

### Bug Fixes

* **styling:** SASS deprecated `lighten` and `darken` methods ([a66506f](https://github.com/ghiscoding/slickgrid-universal/commit/a66506f93c2a51682bba7a5945022087726c1292)) - by @ghiscoding

### Performance Improvements

* improve Date Sorting by optionally pre-parsing date items ([6678139](https://github.com/ghiscoding/slickgrid-universal/commit/66781393b2aa139b8612bc9e92280165f39dc00f)) - by @ghiscoding

## [5.7.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.6.1...v5.7.0) (2024-09-14)

### Bug Fixes

* **deps:** update dependency @faker-js/faker to v9 ([5e9ffb2](https://github.com/ghiscoding/slickgrid-universal/commit/5e9ffb26cca80e267c1f25f0b93839a8b7aea6b1)) - by @renovate-bot

### Performance Improvements

* use Set to improve perf when read current values ([56dfe92](https://github.com/ghiscoding/slickgrid-universal/commit/56dfe927cae76d7a109659a506b213109d3c11ff)), closes [#1670](https://github.com/ghiscoding/slickgrid-universal/issues/1670) - by @ghiscoding

## [5.6.1](https://github.com/ghiscoding/slickgrid-universal/compare/v5.6.0...v5.6.1) (2024-08-31)

**Note:** Version bump only for package slickgrid-universal-vite-demo

## [5.6.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.5.2...v5.6.0) (2024-08-24)

### Performance Improvements

* add new `rowTopOffsetRenderType` grid option to use "transform" ([cf0a22c](https://github.com/ghiscoding/slickgrid-universal/commit/cf0a22c059191e1bc14b5a6ae1d56a4543389335)) - by @ghiscoding

## [5.5.2](https://github.com/ghiscoding/slickgrid-universal/compare/v5.5.1...v5.5.2) (2024-08-17)

### Bug Fixes

* use setTimeout/setInterval from window object with correct TS type ([63953ec](https://github.com/ghiscoding/slickgrid-universal/commit/63953ec14422582367122427e49282fa1afc388c)) - by @ghiscoding

## [5.5.1](https://github.com/ghiscoding/slickgrid-universal/compare/v5.5.0...v5.5.1) (2024-08-17)

### Bug Fixes

* **common:** Tree Data should work without initial sort ([ee26a76](https://github.com/ghiscoding/slickgrid-universal/commit/ee26a76bbfdba1fff3fc697f44302b8071c0647e)) - by @ghiscoding

## [5.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.4.0...v5.5.0) (2024-08-07)

### Features

* add `preRegisterExternalExtensions` to help external RowDetail ([016af41](https://github.com/ghiscoding/slickgrid-universal/commit/016af41affddd776230e445d05322aacfa2e9202)) - by @ghiscoding
* add Infinite Scroll with local JSON data ([ef52d3f](https://github.com/ghiscoding/slickgrid-universal/commit/ef52d3f0fd581aa2b46b4e957ceb99f52e2640f4)) - by @ghiscoding
* Infinite Scroll for Backend Services (POC) ([1add6a3](https://github.com/ghiscoding/slickgrid-universal/commit/1add6a3b0e400cf1f67f4d4bfa35f9d8e52e869e)) - by @ghiscoding
* Infinite Scroll for GraphQL Backend Service ([a057864](https://github.com/ghiscoding/slickgrid-universal/commit/a057864568984afea1a607a6f919214bfd549e70)) - by @ghiscoding

## [5.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.3.4...v5.4.0) (2024-07-20)

### Features

* add `columnPickerLabel` for custom label, also fix [#1605](https://github.com/ghiscoding/slickgrid-universal/issues/1605) ([f4360b9](https://github.com/ghiscoding/slickgrid-universal/commit/f4360b9badd2743e78658ea0be4e6acaa2a5b303)), closes [#1476](https://github.com/ghiscoding/slickgrid-universal/issues/1476) [#1475](https://github.com/ghiscoding/slickgrid-universal/issues/1475) - by @ghiscoding-SE

### Bug Fixes

* example10 ([4ae38b9](https://github.com/ghiscoding/slickgrid-universal/commit/4ae38b905e236094b0ab86813aac25398d1cd894)) - by @zewa666
* provide all search values ([0e97a1a](https://github.com/ghiscoding/slickgrid-universal/commit/0e97a1addb289c50e5c7687b1b24e13159b05473)) - by @vsoftic

## [5.3.4](https://github.com/ghiscoding/slickgrid-universal/compare/v5.3.3...v5.3.4) (2024-07-13)

**Note:** Version bump only for package slickgrid-universal-vite-demo

## [5.3.3](https://github.com/ghiscoding/slickgrid-universal/compare/v5.3.2...v5.3.3) (2024-07-06)

### Bug Fixes

* **editor:** Composite Editor should work with Cell Menu ([#1591](https://github.com/ghiscoding/slickgrid-universal/issues/1591)) ([a57bb13](https://github.com/ghiscoding/slickgrid-universal/commit/a57bb13b4f261829435d5b9b68fcef9d60832fd0)) - by @ghiscoding
* **filters:** Slider Filter left value should never be above left value ([#1590](https://github.com/ghiscoding/slickgrid-universal/issues/1590)) ([3e165cf](https://github.com/ghiscoding/slickgrid-universal/commit/3e165cf33da53337ac9e157ab919e2056e537c72)) - by @ghiscoding
* **styling:** add Dark Mode CSS class to Header Menu ([#1589](https://github.com/ghiscoding/slickgrid-universal/issues/1589)) ([3399ae8](https://github.com/ghiscoding/slickgrid-universal/commit/3399ae8fd146e94064f38672f38044d9c91156c7)) - by @ghiscoding
* **styling:** Total Footer Row small styling fixes ([dc017f3](https://github.com/ghiscoding/slickgrid-universal/commit/dc017f3a0cbfe2cd63028b93ce509446ead5277e)) - by @ghiscoding

## [5.3.2](https://github.com/ghiscoding/slickgrid-universal/compare/v5.3.1...v5.3.2) (2024-06-29)

### Bug Fixes

* **editor:** selecting date editor then reopen should have same date ([#1588](https://github.com/ghiscoding/slickgrid-universal/issues/1588)) ([80d40ff](https://github.com/ghiscoding/slickgrid-universal/commit/80d40ffbbe765816f12d9630ef70e589019c902c)) - by @ghiscoding

## [5.3.1](https://github.com/ghiscoding/slickgrid-universal/compare/v5.3.0...v5.3.1) (2024-06-28)

### Bug Fixes

* **filters:** set date filter dynamically not always setting input value ([#1586](https://github.com/ghiscoding/slickgrid-universal/issues/1586)) ([5233be9](https://github.com/ghiscoding/slickgrid-universal/commit/5233be9d973bcd8b587f49ed12d472a9c93be896)) - by @ghiscoding

## [5.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.2.0...v5.3.0) (2024-06-28)

### Bug Fixes

* **deps:** update all non-major dependencies ([#1581](https://github.com/ghiscoding/slickgrid-universal/issues/1581)) ([e89d1ad](https://github.com/ghiscoding/slickgrid-universal/commit/e89d1ad8d8573b3faef9bc9d312ecac199461c81)) - by @renovate-bot
* **filters:** setting date picker should always work, fixes [#1582](https://github.com/ghiscoding/slickgrid-universal/issues/1582) ([#1583](https://github.com/ghiscoding/slickgrid-universal/issues/1583)) ([92f6164](https://github.com/ghiscoding/slickgrid-universal/commit/92f6164ec275c204739b8e56426934a5ad82c1be)) - by @ghiscoding

## [5.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.1.0...v5.2.0) (2024-06-18)

### Features

* Date editor/filter improvements ([#1551](https://github.com/ghiscoding/slickgrid-universal/issues/1551)) ([7c61846](https://github.com/ghiscoding/slickgrid-universal/commit/7c61846f3cdf577e22a5129c249551bb88d47a63)) - by @zewa666
* **filters:** add new optional `filterShortcuts` to Column Filter ([#1575](https://github.com/ghiscoding/slickgrid-universal/issues/1575)) ([cbd6ae4](https://github.com/ghiscoding/slickgrid-universal/commit/cbd6ae402e1794adc99bd1e8feedfcb45db89ccf)) - by @ghiscoding
* **footer:** add Footer Totals Row and fix footer styling ([#1576](https://github.com/ghiscoding/slickgrid-universal/issues/1576)) ([809903a](https://github.com/ghiscoding/slickgrid-universal/commit/809903a1bd4eb5d935cfd17666cbca0600c19fdb)) - by @ghiscoding
* paste multiline content as single cell ([#1563](https://github.com/ghiscoding/slickgrid-universal/issues/1563)) ([4398f1d](https://github.com/ghiscoding/slickgrid-universal/commit/4398f1d20e06d7c8e12c88889d30445f2b0e4750)) - by @zewa666

### Bug Fixes

* **filters:** filters with `!= ` (not empty) should return non-blanks ([#1570](https://github.com/ghiscoding/slickgrid-universal/issues/1570)) ([9837ef1](https://github.com/ghiscoding/slickgrid-universal/commit/9837ef16c15acd448592a7db2b184a471b057b50)), closes [#1569](https://github.com/ghiscoding/slickgrid-universal/issues/1569) - by @ghiscoding
* **filters:** skipCompoundOperatorFilterWithNullInput skip empty string ([#1566](https://github.com/ghiscoding/slickgrid-universal/issues/1566)) ([4d69bc0](https://github.com/ghiscoding/slickgrid-universal/commit/4d69bc01a349ed1665c483d84c64544124a36c9b)) - by @ghiscoding

## [5.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.0.1...v5.1.0) (2024-06-07)

### Features

* **core:** add optional Top-Header for Drag Grouping & Header Grouping ([#1556](https://github.com/ghiscoding/slickgrid-universal/issues/1556)) ([7d4a769](https://github.com/ghiscoding/slickgrid-universal/commit/7d4a769943d1f96321686e91634efe443b1eb8b2)) - by @ghiscoding
* **export:** add missing `valueParserCallback` dataContext & new demo ([#1543](https://github.com/ghiscoding/slickgrid-universal/issues/1543)) ([884b6e0](https://github.com/ghiscoding/slickgrid-universal/commit/884b6e0c8f9bbff736517b4b8ab131d7141aaff5)) - by @ghiscoding
* **filters:** add a `filterPredicate` option for user customization ([#1528](https://github.com/ghiscoding/slickgrid-universal/issues/1528)) ([cbf64d8](https://github.com/ghiscoding/slickgrid-universal/commit/cbf64d88c2077bcca5bcf7973678d6aa90376a65)) - by @ghiscoding
* **filters:** add StartsWith/EndsWith (`a*z`) filter combo ([#1530](https://github.com/ghiscoding/slickgrid-universal/issues/1530)) ([51560aa](https://github.com/ghiscoding/slickgrid-universal/commit/51560aa5a9761634004409cdc5cc01b91d7f8790)) - by @ghiscoding
* **filters:** add StartsWith/EndsWith (`a*z`) to OData/GraphQL ([#1532](https://github.com/ghiscoding/slickgrid-universal/issues/1532)) ([237d6a8](https://github.com/ghiscoding/slickgrid-universal/commit/237d6a8afee147b6c1ecd3227824fa94d5da6753)) - by @ghiscoding
* **GraphQL:** add `filterQueryOverride` to GraphQL Service ([#1549](https://github.com/ghiscoding/slickgrid-universal/issues/1549)) ([2c0a493](https://github.com/ghiscoding/slickgrid-universal/commit/2c0a4939bbb53fa053f234a3cb1a3332034978af)) - by @ghiscoding
* **OData:** add `filterQueryOverride` to OData Service ([#1536](https://github.com/ghiscoding/slickgrid-universal/issues/1536)) ([e8ffffe](https://github.com/ghiscoding/slickgrid-universal/commit/e8ffffe343ebe84a799ed22ef71f40df51b1a1a4)) - by @zewa666

### Bug Fixes

* **filter:** Date Filter should trigger Grid State change with Backspace ([#1545](https://github.com/ghiscoding/slickgrid-universal/issues/1545)) ([0c10410](https://github.com/ghiscoding/slickgrid-universal/commit/0c1041077e0bac82a2c563cd6b94cb2f45ad0be4)) - by @ghiscoding
* **filters:** new `filterPredicate` shouldn't break other column filters ([#1531](https://github.com/ghiscoding/slickgrid-universal/issues/1531)) ([27777ef](https://github.com/ghiscoding/slickgrid-universal/commit/27777eff2d1172a873e0e0b98ef989288ff47554)) - by @ghiscoding
* **pagination:** out of boundaries page Grid Preset should be unset ([#1534](https://github.com/ghiscoding/slickgrid-universal/issues/1534)) ([b800da3](https://github.com/ghiscoding/slickgrid-universal/commit/b800da3fdb75441eabac4e8ce948e8bef77d9fd1)) - by @ghiscoding
* **TreeData:** addItem should keep current sorted column ([#1558](https://github.com/ghiscoding/slickgrid-universal/issues/1558)) ([dc2a002](https://github.com/ghiscoding/slickgrid-universal/commit/dc2a002afeeca89d67ad6b4aef2047702075b7b9)) - by @ghiscoding

## [5.0.1](https://github.com/ghiscoding/slickgrid-universal/compare/v5.0.0...v5.0.1) (2024-05-11)

### Bug Fixes

* **deps:** update all non-major dependencies ([#1519](https://github.com/ghiscoding/slickgrid-universal/issues/1519)) ([90a5e26](https://github.com/ghiscoding/slickgrid-universal/commit/90a5e26f8fa6f51f04eea0e92dff86e7853d88b4)) - by @renovate-bot
* **editors:** only open ms-select drop when exists ([#1525](https://github.com/ghiscoding/slickgrid-universal/issues/1525)) ([247daba](https://github.com/ghiscoding/slickgrid-universal/commit/247dabaeb81fc894b14b5fcc5eeda36ef28020bb)) - by @ghiscoding
* **plugin:** Draggable Grouping drop zone should always be 100% wide ([#1524](https://github.com/ghiscoding/slickgrid-universal/issues/1524)) ([a6dbf2c](https://github.com/ghiscoding/slickgrid-universal/commit/a6dbf2cc7cf6502e0aed253ea2d2d19306e567a3)) - by @ghiscoding
* **plugin:** Grid Menu shouldn't be displayed in preheader by default ([#1523](https://github.com/ghiscoding/slickgrid-universal/issues/1523)) ([7e0cdc9](https://github.com/ghiscoding/slickgrid-universal/commit/7e0cdc9bd253feade7219d341513332dc8d62c84)) - by @ghiscoding
* **styling:** add missing Dark Mode SASS vars to configure primary color ([dc5d402](https://github.com/ghiscoding/slickgrid-universal/commit/dc5d402db61460a25e8921efeebda37ac1c18791)) - by @ghiscoding

## [5.0.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.7.0...v5.0.0) (2024-05-10)

### ⚠ BREAKING CHANGES

* pure SVG icons, Moment to Tempo, Flatpickr to Vanilla-Calendar (#1518)

### Features

* pure SVG icons, Moment to Tempo, Flatpickr to Vanilla-Calendar ([#1518](https://github.com/ghiscoding/slickgrid-universal/issues/1518)) ([21e50db](https://github.com/ghiscoding/slickgrid-universal/commit/21e50db5ecdc6a0b2f8250f115562ab4fd6e3f4d)) - by @ghiscoding

## [5.0.0-beta.3](https://github.com/ghiscoding/slickgrid-universal/compare/v5.0.0-beta.2...v5.0.0-beta.3) (2024-05-09)

### Bug Fixes

* **common:** consider target size when auto-position picker/modal ([#1517](https://github.com/ghiscoding/slickgrid-universal/issues/1517)) ([e3a70b8](https://github.com/ghiscoding/slickgrid-universal/commit/e3a70b810d04c963f48454b78053c1bd45f96ebf)) - by @ghiscoding
* **common:** Select Editor should always close with Escape key ([#1512](https://github.com/ghiscoding/slickgrid-universal/issues/1512)) ([e37bb28](https://github.com/ghiscoding/slickgrid-universal/commit/e37bb281ee83c25e9c4e15930e06bf9a044c65e9)) - by @ghiscoding
* **editors:** body click or Escape key should cancel Select Editor ([#1513](https://github.com/ghiscoding/slickgrid-universal/issues/1513)) ([3d765a9](https://github.com/ghiscoding/slickgrid-universal/commit/3d765a9d282b684c38c550a1e5736cb1b2132f8e)) - by @ghiscoding
* **styling:** improve UI & fix small issues found after testing upstream ([#1510](https://github.com/ghiscoding/slickgrid-universal/issues/1510)) ([a4ef70f](https://github.com/ghiscoding/slickgrid-universal/commit/a4ef70f70953c13f7abb0075586439931f18af74)) - by @ghiscoding

## [5.0.0-beta.2](https://github.com/ghiscoding/slickgrid-universal/compare/v4.7.0...v5.0.0-beta.2) (2024-05-07)

### ⚠ BREAKING CHANGES

* migrate from Moment to Tempo (#1507)
* **common:** make DOMPurify as optional sanitizer grid option (#1503)
* **styling:** delete "bare" Themes but keep "lite" & add to Bootstrap (#1493)
* **common:** migrate from `moment` to `moment-tiny` (#1456)
* **styling:** delete `checkmarkFormatter` and any Font-Awesome related (#1484)
* **common:** migrate from Flatpickr to Vanilla-Calendar (#1466)
* **styling:** convert SVG icons to pure CSS (#1474)

### Features

* **common:** make DOMPurify as optional sanitizer grid option ([#1503](https://github.com/ghiscoding/slickgrid-universal/issues/1503)) ([0aa0859](https://github.com/ghiscoding/slickgrid-universal/commit/0aa085955f81303c0193fbdcd36ff220263814e3)) - by @ghiscoding
* **common:** migrate from `moment` to `moment-tiny` ([#1456](https://github.com/ghiscoding/slickgrid-universal/issues/1456)) ([90690f4](https://github.com/ghiscoding/slickgrid-universal/commit/90690f4b6a4c8f8a7a221ddc1df69077384f48a9)) - by @ghiscoding
* **common:** migrate from Flatpickr to Vanilla-Calendar ([#1466](https://github.com/ghiscoding/slickgrid-universal/issues/1466)) ([fb6e950](https://github.com/ghiscoding/slickgrid-universal/commit/fb6e950f429b4abd868fca86d9c304580a745b1c)) - by @ghiscoding
* migrate from Moment to Tempo ([#1507](https://github.com/ghiscoding/slickgrid-universal/issues/1507)) ([adef47f](https://github.com/ghiscoding/slickgrid-universal/commit/adef47f21a0e32bd32ec4efce931770dc252d3b5)) - by @ghiscoding
* **styling:** convert SVG icons to pure CSS ([#1474](https://github.com/ghiscoding/slickgrid-universal/issues/1474)) ([70cda8a](https://github.com/ghiscoding/slickgrid-universal/commit/70cda8aa9304ac8ea4bab06390dc1b4c4423df2e)) - by @ghiscoding
* **styling:** delete "bare" Themes but keep "lite" & add to Bootstrap ([#1493](https://github.com/ghiscoding/slickgrid-universal/issues/1493)) ([ca5ac06](https://github.com/ghiscoding/slickgrid-universal/commit/ca5ac0663c1670f9e9af1f88d6f6c85e9e064359)) - by @ghiscoding
* **styling:** delete `checkmarkFormatter` and any Font-Awesome related ([#1484](https://github.com/ghiscoding/slickgrid-universal/issues/1484)) ([2de3fe2](https://github.com/ghiscoding/slickgrid-universal/commit/2de3fe2d07a14225a31fbc77e72c47895de664d6)) - by @ghiscoding

### Bug Fixes

* **styling:** couple of small alignment issues when using flex ([#1496](https://github.com/ghiscoding/slickgrid-universal/issues/1496)) ([2188242](https://github.com/ghiscoding/slickgrid-universal/commit/21882420eb9c31b7922038fa45f373d42e2fb35f)) - by @ghiscoding
* **styling:** properly import Vanilla-Calendar CSS and only once ([#1492](https://github.com/ghiscoding/slickgrid-universal/issues/1492)) ([75dce74](https://github.com/ghiscoding/slickgrid-universal/commit/75dce746659796f7d1c21e5ebcfd0418588df4c0)) - by @ghiscoding

# [4.7.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.6.3...v4.7.0) (2024-04-20)

### Bug Fixes

* **OData:** sorting columns via `id` instead of field property name, fixes [#1467](https://github.com/ghiscoding/slickgrid-universal/issues/1467) ([#1469](https://github.com/ghiscoding/slickgrid-universal/issues/1469)) ([0a4d402](https://github.com/ghiscoding/slickgrid-universal/commit/0a4d40255e240bddf752a2e7bf39a99ae234cc6e)) - by @zewa666

* **styling:** improve button & text colors for Dark Mode ([9414ab4](https://github.com/ghiscoding/slickgrid-universal/commit/9414ab4e24482d080f3113d32d96fe635856a871)) - by @ghiscoding-SE

### Features

* notify onValidationError on paste if validation failed ([#1462](https://github.com/ghiscoding/slickgrid-universal/issues/1462)) ([38b465c](https://github.com/ghiscoding/slickgrid-universal/commit/38b465cb8ebcdd6012b939677a4367c2dce010e9)) - by @zewa666

## [4.6.3](https://github.com/ghiscoding/slickgrid-universal/compare/v4.6.1...v4.6.3) (2024-03-31)

**Note:** Version bump only for package slickgrid-universal-vite-demo

## [4.6.1](https://github.com/ghiscoding/slickgrid-universal/compare/v4.6.0...v4.6.1) (2024-03-31)

### Bug Fixes

* **pubsub:** externalize PubSub event to SlickEventData to stop bubbling ([#1444](https://github.com/ghiscoding/slickgrid-universal/issues/1444)) ([973d0ab](https://github.com/ghiscoding/slickgrid-universal/commit/973d0abb0a4df050ad68a6c7e6493bf7ae4abd52)) - by @ghiscoding

* **styling:** missing/too many borders compound filters w/group addon ([#1446](https://github.com/ghiscoding/slickgrid-universal/issues/1446)) ([863933f](https://github.com/ghiscoding/slickgrid-universal/commit/863933f8cd1988f5ae1b387839a99532cd58d92d)) - by @ghiscoding

* **tooltip:** allow multiple tooltips per grid cell ([#1448](https://github.com/ghiscoding/slickgrid-universal/issues/1448)) ([061c4a0](https://github.com/ghiscoding/slickgrid-universal/commit/061c4a087484238f7285eb27a1c238ac75972f19)) - by @ghiscoding

# [4.6.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.5.0...v4.6.0) (2024-03-23)

### Bug Fixes

* **build:** add ESLint-TS rules to enforce `type` imports and exports ([#1437](https://github.com/ghiscoding/slickgrid-universal/issues/1437)) ([324c4fe](https://github.com/ghiscoding/slickgrid-universal/commit/324c4fee22f83655a3b25b08ae73dbcca2e1e6e7)) - by @ghiscoding

* **common:** bump ms-select to fix compatibility problem in Salesforce ([#1425](https://github.com/ghiscoding/slickgrid-universal/issues/1425)) ([d3d2d39](https://github.com/ghiscoding/slickgrid-universal/commit/d3d2d390a8a1b17d0cd3699ddebfea855fdc5f77)) - by @ghiscoding

* **styling:** small Composite Editor fixes for Dark Mode ([#1417](https://github.com/ghiscoding/slickgrid-universal/issues/1417)) ([7e00087](https://github.com/ghiscoding/slickgrid-universal/commit/7e000877a85059e23d3aa4c00c04d0e4e1e0abc1)) - by @ghiscoding

### Features

* **common:** add optional "Toggle Dark Mode" in Grid Menu ([#1418](https://github.com/ghiscoding/slickgrid-universal/issues/1418)) ([990c1df](https://github.com/ghiscoding/slickgrid-universal/commit/990c1df2a39a6b5098c991b16f43c5679daf4bb5)) - by @ghiscoding

* **core:** rename SG `editorClass` & deprecate `internalColumnEditor` ([#1429](https://github.com/ghiscoding/slickgrid-universal/issues/1429)) ([409115c](https://github.com/ghiscoding/slickgrid-universal/commit/409115cecb132556e88abf6e281f4fcb52414d71)) - by @ghiscoding

* upgrade to ms-select-vanilla v3.x ([#1439](https://github.com/ghiscoding/slickgrid-universal/issues/1439)) ([8f2378e](https://github.com/ghiscoding/slickgrid-universal/commit/8f2378e6cfed3489ce487fe84947bdabd04e31d2)) - by @ghiscoding

# [4.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.4.1...v4.5.0) (2024-03-05)

### Bug Fixes

* **common:** switch to `isomorphic-dompurify` for SSR support ([#1413](https://github.com/ghiscoding/slickgrid-universal/issues/1413)) ([b619453](https://github.com/ghiscoding/slickgrid-universal/commit/b619453fd9825500f2d9589e31bdcf5e17ac412d)), closes [/github.com/ghiscoding/Angular-Slickgrid/discussions/838#discussioncomment-8574215](https://github.com//github.com/ghiscoding/Angular-Slickgrid/discussions/838/issues/discussioncomment-8574215) - by @ghiscoding

* **styling:** ms-select filter should use same color as other filters ([#1396](https://github.com/ghiscoding/slickgrid-universal/issues/1396)) ([a30d590](https://github.com/ghiscoding/slickgrid-universal/commit/a30d59066419d2c3324718f1d5497e8e89ebf749)) - by @ghiscoding

* **styling:** properly align flexbox ms-select icon+text vertically ([#1397](https://github.com/ghiscoding/slickgrid-universal/issues/1397)) ([e744d02](https://github.com/ghiscoding/slickgrid-universal/commit/e744d0256d25ba6ad5d538b827460828b6e0666f)) - by @ghiscoding

* **styling:** remove header menu open class for Dark Mode ([6a2e7e1](https://github.com/ghiscoding/slickgrid-universal/commit/6a2e7e13a18921c2b70caeb2690298173310aece)) - by @ghiscoding

### Features

* **common:** upgrade `multiple-select-vanilla` to v2 ([#1401](https://github.com/ghiscoding/slickgrid-universal/issues/1401)) ([d6bb1d7](https://github.com/ghiscoding/slickgrid-universal/commit/d6bb1d7ef76100268456b2ab499c496a78debdd8)) - by @ghiscoding

* **editor:** add `onRendered` lifecycle callback option ([#1410](https://github.com/ghiscoding/slickgrid-universal/issues/1410)) ([9d348d6](https://github.com/ghiscoding/slickgrid-universal/commit/9d348d6e4b693e23a2959917e02a7bcfa55a0c90)) - by @ghiscoding

* **styling:** add Dark Mode grid option ([#1407](https://github.com/ghiscoding/slickgrid-universal/issues/1407)) ([855151b](https://github.com/ghiscoding/slickgrid-universal/commit/855151b9f47a5238e3069f8c85ba4ed8a5bf9bb6)) - by @ghiscoding

## [4.4.1](https://github.com/ghiscoding/slickgrid-universal/compare/v4.3.1...v4.4.1) (2024-02-13)

### Bug Fixes

* **demo:** change trading demo full screen z-index lower than ms-select ([1f4a9ac](https://github.com/ghiscoding/slickgrid-universal/commit/1f4a9acd68bc9559420d48597f9214c16f48556e)) - by @ghiscoding

* **deps:** update all non-major dependencies ([#1381](https://github.com/ghiscoding/slickgrid-universal/issues/1381)) ([2562352](https://github.com/ghiscoding/slickgrid-universal/commit/25623527d05dd713123e1031b682f0a80cca37de)) - by @renovate-bot

### Features

* **ExcelExport:** migrate to Excel-Export-Vanilla (ESM) ([#1383](https://github.com/ghiscoding/slickgrid-universal/issues/1383)) ([f3838b3](https://github.com/ghiscoding/slickgrid-universal/commit/f3838b336659304988957ad933901645c5c243b7)) - by @ghiscoding

# [4.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.3.1...v4.4.0) (2024-02-12)

### Bug Fixes

* **demo:** change trading demo full screen z-index lower than ms-select ([1f4a9ac](https://github.com/ghiscoding/slickgrid-universal/commit/1f4a9acd68bc9559420d48597f9214c16f48556e)) - by @ghiscoding

* **deps:** update all non-major dependencies ([#1381](https://github.com/ghiscoding/slickgrid-universal/issues/1381)) ([2562352](https://github.com/ghiscoding/slickgrid-universal/commit/25623527d05dd713123e1031b682f0a80cca37de)) - by @renovate-bot

### Features

* **ExcelExport:** migrate to Excel-Export-Vanilla (ESM) ([#1383](https://github.com/ghiscoding/slickgrid-universal/issues/1383)) ([f3838b3](https://github.com/ghiscoding/slickgrid-universal/commit/f3838b336659304988957ad933901645c5c243b7)) - by @ghiscoding

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
