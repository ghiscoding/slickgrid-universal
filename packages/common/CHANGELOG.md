# Change Log
## All-in-One SlickGrid framework agnostic wrapper, visit [Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal) 📦🚀

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.6.1](https://github.com/ghiscoding/slickgrid-universal/compare/v5.6.0...v5.6.1) (2024-08-31)

### Bug Fixes

* only import `@excel-builder-vanilla/types` for optional dep ([27e983e](https://github.com/ghiscoding/slickgrid-universal/commit/27e983e084dc6854db4af90d32c86e0687c95fe1)) - by @ghiscoding
* **tree:** unflattening tree->flat array multiple times, fixes [#1657](https://github.com/ghiscoding/slickgrid-universal/issues/1657) ([67edd1e](https://github.com/ghiscoding/slickgrid-universal/commit/67edd1e9c0ec1ff28be1b9c55e1e304cd1261351)) - by @ghiscoding

## [5.6.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.5.2...v5.6.0) (2024-08-24)

### Features

* migrate back to Vanilla-Calendar-Pro ([bfcdbd5](https://github.com/ghiscoding/slickgrid-universal/commit/bfcdbd5f827d791a76bcb107b924ec83c43aeca4)) [#1644](https://github.com/ghiscoding/slickgrid-universal/pull/1644) - by @ghiscoding

### Bug Fixes

* calling `preRegisterExternalExtensions` should be added to ext list ([0af5d59](https://github.com/ghiscoding/slickgrid-universal/commit/0af5d59b4c1aca597959143ec9adaa6911f38f41)) [#1647](https://github.com/ghiscoding/slickgrid-universal/pull/1647) - by @ghiscoding
* don't render filter element on hidden column ([559d7de](https://github.com/ghiscoding/slickgrid-universal/commit/559d7de9bd37d12a3741d93866ad5bbeeafd95aa)) - by @ghiscoding
* SlickCellExternalCopyManager should use DataView ([abed483](https://github.com/ghiscoding/slickgrid-universal/commit/abed4834a5f1103a22f0a269f0757b3cfc40576f)) - by @ghiscoding
* SlickCellExternalCopyManager should work w/hidden cols fixes [#1634](https://github.com/ghiscoding/slickgrid-universal/issues/1634) ([b156bfa](https://github.com/ghiscoding/slickgrid-universal/commit/b156bfaf1b0774a5a8d24a42e46aaed77eb94344)) [#1651](https://github.com/ghiscoding/slickgrid-universal/pull/1651) - by @ghiscoding

### Performance Improvements

* add new `rowTopOffsetRenderType` grid option to use "transform" ([cf0a22c](https://github.com/ghiscoding/slickgrid-universal/commit/cf0a22c059191e1bc14b5a6ae1d56a4543389335)) [#1650](https://github.com/ghiscoding/slickgrid-universal/pull/1650) - by @ghiscoding
* decrease virtual scroll render throttling to 10ms ([4419132](https://github.com/ghiscoding/slickgrid-universal/commit/4419132e3664d8a5381a664da67d5f4ea6589ecb)) [#1648](https://github.com/ghiscoding/slickgrid-universal/pull/1648) - by @ghiscoding

## [5.5.2](https://github.com/ghiscoding/slickgrid-universal/compare/v5.5.1...v5.5.2) (2024-08-17)

### Bug Fixes

* use setTimeout/setInterval from window object with correct TS type ([63953ec](https://github.com/ghiscoding/slickgrid-universal/commit/63953ec14422582367122427e49282fa1afc388c)) - by @ghiscoding

## [5.5.1](https://github.com/ghiscoding/slickgrid-universal/compare/v5.5.0...v5.5.1) (2024-08-17)

### Bug Fixes

* add missing TrustedHTML type ([8b22914](https://github.com/ghiscoding/slickgrid-universal/commit/8b2291478b0554a97e7807140e5b02f192ea28e3)) - by @ghiscoding
* **common:** add missing dependency `@types/trusted-types` ([df6114a](https://github.com/ghiscoding/slickgrid-universal/commit/df6114af61788fd17eaf45e5220a6d6ce381fb21)) - by @ghiscoding

## [5.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.4.0...v5.5.0) (2024-08-07)

### Features

* add `preRegisterExternalExtensions` to help external RowDetail ([016af41](https://github.com/ghiscoding/slickgrid-universal/commit/016af41affddd776230e445d05322aacfa2e9202)) - by @ghiscoding
* Infinite Scroll for Backend Services (POC) ([1add6a3](https://github.com/ghiscoding/slickgrid-universal/commit/1add6a3b0e400cf1f67f4d4bfa35f9d8e52e869e)) - by @ghiscoding
* Infinite Scroll for GraphQL Backend Service ([a057864](https://github.com/ghiscoding/slickgrid-universal/commit/a057864568984afea1a607a6f919214bfd549e70)) - by @ghiscoding

### Bug Fixes

* **core:** pinning 1st column could caused the header to get misaligned ([42c94e8](https://github.com/ghiscoding/slickgrid-universal/commit/42c94e8e7bf9a451ec8a84db5835f18b2167315a)) - by @ghiscoding
* **styles:** Add missing semicolon in line 1147 of _variables.scss ([36c3187](https://github.com/ghiscoding/slickgrid-universal/commit/36c31870be1054bda8148d3f638a20622a06fa75)) - by @oilmonkey

## [5.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.3.4...v5.4.0) (2024-07-20)

### Features

* add `columnPickerLabel` for custom label, also fix [#1605](https://github.com/ghiscoding/slickgrid-universal/issues/1605) ([f4360b9](https://github.com/ghiscoding/slickgrid-universal/commit/f4360b9badd2743e78658ea0be4e6acaa2a5b303)), closes [#1476](https://github.com/ghiscoding/slickgrid-universal/issues/1476) [#1475](https://github.com/ghiscoding/slickgrid-universal/issues/1475) - by @ghiscoding-SE
* support tooltips on icon formatters ([317affd](https://github.com/ghiscoding/slickgrid-universal/commit/317affd5b5363162af2bf438badf58c9ea177153)) - by @zewa666

### Bug Fixes

* `filterQueryOverride` provide all search values ([0e97a1a](https://github.com/ghiscoding/slickgrid-universal/commit/0e97a1addb289c50e5c7687b1b24e13159b05473)) - by @vsoftic
* don't use Document Fragment in SlickCheckbox for Salesforce Usage ([5eea8a41](https://github.com/ghiscoding/slickgrid-universal/commit/5eea8a41e51a81fce8a34a4535bcd17f3c603d07)) - by @good-ghost

## [5.3.4](https://github.com/ghiscoding/slickgrid-universal/compare/v5.3.3...v5.3.4) (2024-07-13)

### Bug Fixes

* **styling:** fix SASS warnings for declarations mixed with nested rules ([de9460d](https://github.com/ghiscoding/slickgrid-universal/commit/de9460dd0ccb925e3fa9fa503c44b1aa105ff9c0)) - by @ghiscoding

## [5.3.3](https://github.com/ghiscoding/slickgrid-universal/compare/v5.3.2...v5.3.3) (2024-07-06)

### Bug Fixes

* **editor:** Composite Editor should work with Cell Menu ([#1591](https://github.com/ghiscoding/slickgrid-universal/issues/1591)) ([a57bb13](https://github.com/ghiscoding/slickgrid-universal/commit/a57bb13b4f261829435d5b9b68fcef9d60832fd0)) - by @ghiscoding
* **filters:** Slider Filter left value should never be above left value ([#1590](https://github.com/ghiscoding/slickgrid-universal/issues/1590)) ([3e165cf](https://github.com/ghiscoding/slickgrid-universal/commit/3e165cf33da53337ac9e157ab919e2056e537c72)) - by @ghiscoding
* **filters:** Slider Filter left value should never be above right value ([124cb96](https://github.com/ghiscoding/slickgrid-universal/commit/124cb96daa834cbb57fdba2108cb9d4733aa2808)) - by @ghiscoding
* **styling:** add Dark Mode CSS class to Header Menu ([#1589](https://github.com/ghiscoding/slickgrid-universal/issues/1589)) ([3399ae8](https://github.com/ghiscoding/slickgrid-universal/commit/3399ae8fd146e94064f38672f38044d9c91156c7)) - by @ghiscoding
* **styling:** Total Footer Row small styling fixes ([dc017f3](https://github.com/ghiscoding/slickgrid-universal/commit/dc017f3a0cbfe2cd63028b93ce509446ead5277e)) - by @ghiscoding
* **styling:** Total Footer Row small styling fixes for dark mode ([17fed97](https://github.com/ghiscoding/slickgrid-universal/commit/17fed97ed647cbb939a7bea838bfb3f722697d07)) - by @ghiscoding

## [5.3.2](https://github.com/ghiscoding/slickgrid-universal/compare/v5.3.1...v5.3.2) (2024-06-29)

### Bug Fixes

* **editor:** selecting date editor then reopen should have same date ([#1588](https://github.com/ghiscoding/slickgrid-universal/issues/1588)) ([80d40ff](https://github.com/ghiscoding/slickgrid-universal/commit/80d40ffbbe765816f12d9630ef70e589019c902c)) - by @ghiscoding

## [5.3.1](https://github.com/ghiscoding/slickgrid-universal/compare/v5.3.0...v5.3.1) (2024-06-28)

### Bug Fixes

* **filter:** changing Slider dynamically shouldn't display tooltip ([#1587](https://github.com/ghiscoding/slickgrid-universal/issues/1587)) ([34bdf76](https://github.com/ghiscoding/slickgrid-universal/commit/34bdf76e0207dd720819f33f5a6f2e9eaf14581c)) - by @ghiscoding
* **filters:** set date filter dynamically not always setting input value ([#1586](https://github.com/ghiscoding/slickgrid-universal/issues/1586)) ([5233be9](https://github.com/ghiscoding/slickgrid-universal/commit/5233be9d973bcd8b587f49ed12d472a9c93be896)) - by @ghiscoding

## [5.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.2.0...v5.3.0) (2024-06-28)

### Features

* **grouping:** add onPreHeaderContextMenu for Column Picker usage ([#1580](https://github.com/ghiscoding/slickgrid-universal/issues/1580)) ([c742a83](https://github.com/ghiscoding/slickgrid-universal/commit/c742a83adaf8d7af9485005bbd76a37bc52fea9b)) - by @ghiscoding

### Bug Fixes

* **deps:** update all non-major dependencies ([#1581](https://github.com/ghiscoding/slickgrid-universal/issues/1581)) ([e89d1ad](https://github.com/ghiscoding/slickgrid-universal/commit/e89d1ad8d8573b3faef9bc9d312ecac199461c81)) - by @renovate-bot
* **filters:** setting date picker should always work, fixes [#1582](https://github.com/ghiscoding/slickgrid-universal/issues/1582) ([#1583](https://github.com/ghiscoding/slickgrid-universal/issues/1583)) ([92f6164](https://github.com/ghiscoding/slickgrid-universal/commit/92f6164ec275c204739b8e56426934a5ad82c1be)) - by @ghiscoding
* **styling:** Column Header should always be on top of grid container ([#1578](https://github.com/ghiscoding/slickgrid-universal/issues/1578)) ([2f97dbb](https://github.com/ghiscoding/slickgrid-universal/commit/2f97dbb27e070eb29bbc95666dd64993d0a5818c)) - by @ghiscoding

## [5.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.1.0...v5.2.0) (2024-06-18)

### Features

* Date editor/filter improvements ([#1551](https://github.com/ghiscoding/slickgrid-universal/issues/1551)) ([7c61846](https://github.com/ghiscoding/slickgrid-universal/commit/7c61846f3cdf577e22a5129c249551bb88d47a63)) - by @zewa666
* **filters:** add `setValues()` optional flag to trigger query ([#1574](https://github.com/ghiscoding/slickgrid-universal/issues/1574)) ([025888d](https://github.com/ghiscoding/slickgrid-universal/commit/025888d0ceb0a29095b6036ab645de365bd08e8a)) - by @ghiscoding
* **filters:** add new optional `filterShortcuts` to Column Filter ([#1575](https://github.com/ghiscoding/slickgrid-universal/issues/1575)) ([cbd6ae4](https://github.com/ghiscoding/slickgrid-universal/commit/cbd6ae402e1794adc99bd1e8feedfcb45db89ccf)) - by @ghiscoding
* **footer:** add Footer Totals Row and fix footer styling ([#1576](https://github.com/ghiscoding/slickgrid-universal/issues/1576)) ([809903a](https://github.com/ghiscoding/slickgrid-universal/commit/809903a1bd4eb5d935cfd17666cbca0600c19fdb)) - by @ghiscoding
* paste multiline content as single cell ([#1563](https://github.com/ghiscoding/slickgrid-universal/issues/1563)) ([4398f1d](https://github.com/ghiscoding/slickgrid-universal/commit/4398f1d20e06d7c8e12c88889d30445f2b0e4750)) - by @zewa666

### Bug Fixes

* **common:** Header Menu missing columnDef in sub-menu action callback ([#1572](https://github.com/ghiscoding/slickgrid-universal/issues/1572)) ([55d77d0](https://github.com/ghiscoding/slickgrid-universal/commit/55d77d0806bf5b1283c96e5e1f7f01f2d2114e8e)) - by @ghiscoding
* **filters:** filters with `!= ` (not empty) should return non-blanks ([#1570](https://github.com/ghiscoding/slickgrid-universal/issues/1570)) ([9837ef1](https://github.com/ghiscoding/slickgrid-universal/commit/9837ef16c15acd448592a7db2b184a471b057b50)), closes [#1569](https://github.com/ghiscoding/slickgrid-universal/issues/1569) - by @ghiscoding
* **filters:** skipCompoundOperatorFilterWithNullInput skip empty string ([#1566](https://github.com/ghiscoding/slickgrid-universal/issues/1566)) ([4d69bc0](https://github.com/ghiscoding/slickgrid-universal/commit/4d69bc01a349ed1665c483d84c64544124a36c9b)) - by @ghiscoding
* **filters:** skipCompoundOperatorFilterWithNullInput skip undefined ([#1568](https://github.com/ghiscoding/slickgrid-universal/issues/1568)) ([711b03e](https://github.com/ghiscoding/slickgrid-universal/commit/711b03e956b34b56a49fa362e4a20ce377254ee3)), closes [#1566](https://github.com/ghiscoding/slickgrid-universal/issues/1566) - by @ghiscoding
* **GraphQL:** filter `<>` is `Not_Contains` instead of `Not_Equal` ([#1571](https://github.com/ghiscoding/slickgrid-universal/issues/1571)) ([c6f1cf3](https://github.com/ghiscoding/slickgrid-universal/commit/c6f1cf36778e04e64184417335f1584f981b85ce)), closes [#1569](https://github.com/ghiscoding/slickgrid-universal/issues/1569) - by @ghiscoding
* **styling:** add missing btn-default text color & border color ([bfdec1e](https://github.com/ghiscoding/slickgrid-universal/commit/bfdec1e69d7f82dc21d9beff2e2166bbd7d26332)) - by @ghiscoding
* **styling:** Grid Menu, Col Picker labels should take full width ([#1564](https://github.com/ghiscoding/slickgrid-universal/issues/1564)) ([e942539](https://github.com/ghiscoding/slickgrid-universal/commit/e9425392b2728c8e92fce3604e242957cc067aae)) - by @ghiscoding

## [5.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v5.0.1...v5.1.0) (2024-06-07)

### Features

* **core:** add new `preventDragFromKeys` grid option, fixes [#1537](https://github.com/ghiscoding/slickgrid-universal/issues/1537) ([#1538](https://github.com/ghiscoding/slickgrid-universal/issues/1538)) ([803fbee](https://github.com/ghiscoding/slickgrid-universal/commit/803fbee0e4245a421840b7420e9ea617238ad780)) - by @ghiscoding
* **core:** add optional Top-Header for Drag Grouping & Header Grouping ([#1556](https://github.com/ghiscoding/slickgrid-universal/issues/1556)) ([7d4a769](https://github.com/ghiscoding/slickgrid-universal/commit/7d4a769943d1f96321686e91634efe443b1eb8b2)) - by @ghiscoding
* **export:** add missing `valueParserCallback` dataContext & new demo ([#1543](https://github.com/ghiscoding/slickgrid-universal/issues/1543)) ([884b6e0](https://github.com/ghiscoding/slickgrid-universal/commit/884b6e0c8f9bbff736517b4b8ab131d7141aaff5)) - by @ghiscoding
* **filters:** add `OperatorType.custom` for custom backend service ([#1526](https://github.com/ghiscoding/slickgrid-universal/issues/1526)) ([4284d58](https://github.com/ghiscoding/slickgrid-universal/commit/4284d5834ec9955a327043565169b99ede8988f4)) - by @ghiscoding
* **filters:** add a `filterPredicate` option for user customization ([#1528](https://github.com/ghiscoding/slickgrid-universal/issues/1528)) ([cbf64d8](https://github.com/ghiscoding/slickgrid-universal/commit/cbf64d88c2077bcca5bcf7973678d6aa90376a65)) - by @ghiscoding
* **filters:** add StartsWith/EndsWith (`a*z`) filter combo ([#1530](https://github.com/ghiscoding/slickgrid-universal/issues/1530)) ([51560aa](https://github.com/ghiscoding/slickgrid-universal/commit/51560aa5a9761634004409cdc5cc01b91d7f8790)) - by @ghiscoding
* **filters:** add StartsWith/EndsWith (`a*z`) to OData/GraphQL ([#1532](https://github.com/ghiscoding/slickgrid-universal/issues/1532)) ([237d6a8](https://github.com/ghiscoding/slickgrid-universal/commit/237d6a8afee147b6c1ecd3227824fa94d5da6753)) - by @ghiscoding
* **OData:** add `filterQueryOverride` to OData Service ([#1536](https://github.com/ghiscoding/slickgrid-universal/issues/1536)) ([e8ffffe](https://github.com/ghiscoding/slickgrid-universal/commit/e8ffffe343ebe84a799ed22ef71f40df51b1a1a4)) - by @zewa666

### Bug Fixes

* **filter:** Date Filter should trigger Grid State change with Backspace ([#1545](https://github.com/ghiscoding/slickgrid-universal/issues/1545)) ([0c10410](https://github.com/ghiscoding/slickgrid-universal/commit/0c1041077e0bac82a2c563cd6b94cb2f45ad0be4)) - by @ghiscoding
* **filters:** Compound Operator alt texts should work with custom list ([#1541](https://github.com/ghiscoding/slickgrid-universal/issues/1541)) ([02d5d2b](https://github.com/ghiscoding/slickgrid-universal/commit/02d5d2b23dbe30eea26c4658ee396791efd6779f)) - by @ghiscoding
* **filters:** new `filterPredicate` shouldn't break other column filters ([#1531](https://github.com/ghiscoding/slickgrid-universal/issues/1531)) ([27777ef](https://github.com/ghiscoding/slickgrid-universal/commit/27777eff2d1172a873e0e0b98ef989288ff47554)) - by @ghiscoding
* **Grouping:** Draggable Grouping cols reorder missing `impactedColumns` ([#1557](https://github.com/ghiscoding/slickgrid-universal/issues/1557)) ([69125c2](https://github.com/ghiscoding/slickgrid-universal/commit/69125c27e43aab03a4bbe3f7f9e1d7ebb80472ca)) - by @ghiscoding
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

### Bug Fixes

* **core:** col name from HTML shouldn't disappear in picker, fixes [#1475](https://github.com/ghiscoding/slickgrid-universal/issues/1475) ([#1476](https://github.com/ghiscoding/slickgrid-universal/issues/1476)) ([15a590b](https://github.com/ghiscoding/slickgrid-universal/commit/15a590b2e52f8864aeccc38f9a708c0453b6e4a6)), closes [/github.com/ghiscoding/slickgrid-universal/blob/185b6f9e44400bec2f1d79568905ca79e4b338a5/packages/common/src/core/slickGrid.ts#L1615-L1616](https://github.com/ghiscoding//github.com/ghiscoding/slickgrid-universal/blob/185b6f9e44400bec2f1d79568905ca79e4b338a5/packages/common/src/core/slickGrid.ts/issues/L1615-L1616) - by @ghiscoding
* **styling:** small UI fixes for Salesforce Theme ([f9bfb3d](https://github.com/ghiscoding/slickgrid-universal/commit/f9bfb3dbbf6a217fdf3928abde634c8ff8243ba0)) - by @ghiscoding-SE
* tweak setupColumnSort() to fix exception when col no longer exists ([#1477](https://github.com/ghiscoding/slickgrid-universal/issues/1477)) ([094d760](https://github.com/ghiscoding/slickgrid-universal/commit/094d7602d7170b2f395985ce5635041bb2b803d2)) - by @ghiscoding

## [5.0.0-beta.3](https://github.com/ghiscoding/slickgrid-universal/compare/v5.0.0-beta.2...v5.0.0-beta.3) (2024-05-09)

### Bug Fixes

* **common:** consider target size when auto-position picker/modal ([#1517](https://github.com/ghiscoding/slickgrid-universal/issues/1517)) ([e3a70b8](https://github.com/ghiscoding/slickgrid-universal/commit/e3a70b810d04c963f48454b78053c1bd45f96ebf)) - by @ghiscoding
* **common:** Select Editor should always close with Escape key ([#1512](https://github.com/ghiscoding/slickgrid-universal/issues/1512)) ([e37bb28](https://github.com/ghiscoding/slickgrid-universal/commit/e37bb281ee83c25e9c4e15930e06bf9a044c65e9)) - by @ghiscoding
* **core:** tweak setupColumnSort() to fix exception with hidden col ([#1509](https://github.com/ghiscoding/slickgrid-universal/issues/1509)) ([94b836a](https://github.com/ghiscoding/slickgrid-universal/commit/94b836a025ecb19b72f439079382280740b51027)) - by @ghiscoding
* **editors:** body click or Escape key should cancel Select Editor ([#1513](https://github.com/ghiscoding/slickgrid-universal/issues/1513)) ([3d765a9](https://github.com/ghiscoding/slickgrid-universal/commit/3d765a9d282b684c38c550a1e5736cb1b2132f8e)) - by @ghiscoding
* make some more cleanup with now optional DOMPurify ([#1508](https://github.com/ghiscoding/slickgrid-universal/issues/1508)) ([7fafbcc](https://github.com/ghiscoding/slickgrid-universal/commit/7fafbcc21fccfcd83d3ab103f313398c9d4b82e2)) - by @ghiscoding
* **plugins:** clicking a grid cell should close any open menu ([#1515](https://github.com/ghiscoding/slickgrid-universal/issues/1515)) ([383792d](https://github.com/ghiscoding/slickgrid-universal/commit/383792d389e56239d62874842a50ec838f0bd3e9)) - by @ghiscoding
* **styling:** improve UI & fix small issues found after testing upstream ([#1510](https://github.com/ghiscoding/slickgrid-universal/issues/1510)) ([a4ef70f](https://github.com/ghiscoding/slickgrid-universal/commit/a4ef70f70953c13f7abb0075586439931f18af74)) - by @ghiscoding
* **tooltip:** only show tooltip that has value ([#1511](https://github.com/ghiscoding/slickgrid-universal/issues/1511)) ([2ff15da](https://github.com/ghiscoding/slickgrid-universal/commit/2ff15da4a21cd98b63f251b9b248454658dac698)) - by @ghiscoding

## [5.0.0-beta.2](https://github.com/ghiscoding/slickgrid-universal/compare/v4.7.0...v5.0.0-beta.2) (2024-05-07)

### ⚠ BREAKING CHANGES

* migrate from Moment to Tempo (#1507)
* **common:** make DOMPurify as optional sanitizer grid option (#1503)
* **styling:** delete "bare" Themes but keep "lite" & add to Bootstrap (#1493)
* **common:** migrate from `moment` to `moment-tiny` (#1456)
* **filters:** remove native `Filters.select` (#1485)
* **styling:** delete `checkmarkFormatter` and any Font-Awesome related (#1484)
* **common:** migrate from Flatpickr to Vanilla-Calendar (#1466)
* **styling:** remove SASS `math.div` polyfill (#1483)
* **styling:** convert SVG icons to pure CSS (#1474)

### Features

* **common:** make DOMPurify as optional sanitizer grid option ([#1503](https://github.com/ghiscoding/slickgrid-universal/issues/1503)) ([0aa0859](https://github.com/ghiscoding/slickgrid-universal/commit/0aa085955f81303c0193fbdcd36ff220263814e3)) - by @ghiscoding
* **common:** migrate from `moment` to `moment-tiny` ([#1456](https://github.com/ghiscoding/slickgrid-universal/issues/1456)) ([90690f4](https://github.com/ghiscoding/slickgrid-universal/commit/90690f4b6a4c8f8a7a221ddc1df69077384f48a9)) - by @ghiscoding
* **common:** migrate from Flatpickr to Vanilla-Calendar ([#1466](https://github.com/ghiscoding/slickgrid-universal/issues/1466)) ([fb6e950](https://github.com/ghiscoding/slickgrid-universal/commit/fb6e950f429b4abd868fca86d9c304580a745b1c)) - by @ghiscoding
* **filters:** remove native `Filters.select` ([#1485](https://github.com/ghiscoding/slickgrid-universal/issues/1485)) ([fae4c4a](https://github.com/ghiscoding/slickgrid-universal/commit/fae4c4a199409cec40ebb2703b6ae6d0d14e4af7)) - by @ghiscoding
* migrate from Moment to Tempo ([#1507](https://github.com/ghiscoding/slickgrid-universal/issues/1507)) ([adef47f](https://github.com/ghiscoding/slickgrid-universal/commit/adef47f21a0e32bd32ec4efce931770dc252d3b5)) - by @ghiscoding
* **styling:** convert SVG icons to pure CSS ([#1474](https://github.com/ghiscoding/slickgrid-universal/issues/1474)) ([70cda8a](https://github.com/ghiscoding/slickgrid-universal/commit/70cda8aa9304ac8ea4bab06390dc1b4c4423df2e)) - by @ghiscoding
* **styling:** delete "bare" Themes but keep "lite" & add to Bootstrap ([#1493](https://github.com/ghiscoding/slickgrid-universal/issues/1493)) ([ca5ac06](https://github.com/ghiscoding/slickgrid-universal/commit/ca5ac0663c1670f9e9af1f88d6f6c85e9e064359)) - by @ghiscoding
* **styling:** delete `checkmarkFormatter` and any Font-Awesome related ([#1484](https://github.com/ghiscoding/slickgrid-universal/issues/1484)) ([2de3fe2](https://github.com/ghiscoding/slickgrid-universal/commit/2de3fe2d07a14225a31fbc77e72c47895de664d6)) - by @ghiscoding
* **styling:** remove SASS `math.div` polyfill ([#1483](https://github.com/ghiscoding/slickgrid-universal/issues/1483)) ([12661a3](https://github.com/ghiscoding/slickgrid-universal/commit/12661a3ff13ea844f6e16028216e1ed8808ee4d9)) - by @ghiscoding

### Bug Fixes

* **core:** col name from HTML shouldn't disappear in picker, fixes [#1475](https://github.com/ghiscoding/slickgrid-universal/issues/1475) ([#1476](https://github.com/ghiscoding/slickgrid-universal/issues/1476)) ([15a590b](https://github.com/ghiscoding/slickgrid-universal/commit/15a590b2e52f8864aeccc38f9a708c0453b6e4a6)) - by @ghiscoding
* **editor:** autocomplete should only save empty when val is null ([#1500](https://github.com/ghiscoding/slickgrid-universal/issues/1500)) ([8de1340](https://github.com/ghiscoding/slickgrid-universal/commit/8de13402d244cb3aa2fcdb4af62e05b06f6cb27c)) - by @ghiscoding
* **editor:** input editor should call save on focusout or blur of input ([#1497](https://github.com/ghiscoding/slickgrid-universal/issues/1497)) ([ccd344e](https://github.com/ghiscoding/slickgrid-universal/commit/ccd344ecd2e6abcff1d7b9f5e7d7fe85a4c20fdd)) - by @ghiscoding
* **editor:** new Date Editor input clear button wasn't working ([#1487](https://github.com/ghiscoding/slickgrid-universal/issues/1487)) ([4ac34ee](https://github.com/ghiscoding/slickgrid-universal/commit/4ac34ee6d95398c77f10f89b0ad4c3168765b6a0)) - by @ghiscoding
* **styling:** couple of small alignment issues when using flex ([#1496](https://github.com/ghiscoding/slickgrid-universal/issues/1496)) ([2188242](https://github.com/ghiscoding/slickgrid-universal/commit/21882420eb9c31b7922038fa45f373d42e2fb35f)) - by @ghiscoding
* **styling:** empty warning should separate icon & text ([#1491](https://github.com/ghiscoding/slickgrid-universal/issues/1491)) ([240cbd3](https://github.com/ghiscoding/slickgrid-universal/commit/240cbd3b5a8cfb6a6cab563bc43d705332d59beb)) - by @ghiscoding
* **styling:** properly import Vanilla-Calendar CSS and only once ([#1492](https://github.com/ghiscoding/slickgrid-universal/issues/1492)) ([75dce74](https://github.com/ghiscoding/slickgrid-universal/commit/75dce746659796f7d1c21e5ebcfd0418588df4c0)) - by @ghiscoding
* **styling:** Row Move icon shouldn't show extra dot ([69f7bfc](https://github.com/ghiscoding/slickgrid-universal/commit/69f7bfcb7eb078815f5edb6d84d53c0905df27a1)) - by @ghiscoding-SE
* **tooltip:** don't sanitize empty text, fixes empty tooltip being shown ([#1495](https://github.com/ghiscoding/slickgrid-universal/issues/1495)) ([dcc693b](https://github.com/ghiscoding/slickgrid-universal/commit/dcc693b26677873b93ccb770ff8ef9a514085341)) - by @ghiscoding
* tweak setupColumnSort() to fix exception when col no longer exists ([#1477](https://github.com/ghiscoding/slickgrid-universal/issues/1477)) ([094d760](https://github.com/ghiscoding/slickgrid-universal/commit/094d7602d7170b2f395985ce5635041bb2b803d2)) - by @ghiscoding

# [4.7.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.6.3...v4.7.0) (2024-04-20)

### Bug Fixes

* **common:** don't try to strip tags on object input to calc cell width ([#1453](https://github.com/ghiscoding/slickgrid-universal/issues/1453)) ([5ab671b](https://github.com/ghiscoding/slickgrid-universal/commit/5ab671bee805f7b7d9b139e9bf7a14b31b5aea56)) - by @ghiscoding

* **common:** switch back to `autocompleter` with ESM build ([#1450](https://github.com/ghiscoding/slickgrid-universal/issues/1450)) ([ad66a12](https://github.com/ghiscoding/slickgrid-universal/commit/ad66a121b4a6b7718009948d873ceb8f5c66a32c)) - by @ghiscoding

* **core:** Editor.keyCaptureList is an array of numbers ([#1458](https://github.com/ghiscoding/slickgrid-universal/issues/1458)) ([62a686e](https://github.com/ghiscoding/slickgrid-universal/commit/62a686e7db4dc4ef65d0c426c8623dc8f1e3f9d9)) - by @ghiscoding

* **styling:** improve button & text colors for Dark Mode ([9414ab4](https://github.com/ghiscoding/slickgrid-universal/commit/9414ab4e24482d080f3113d32d96fe635856a871)) - by @ghiscoding-SE

### Features

* **common:** add global `defaultEditorOptions` & `defaultFilterOptions` ([#1470](https://github.com/ghiscoding/slickgrid-universal/issues/1470)) ([0462f17](https://github.com/ghiscoding/slickgrid-universal/commit/0462f17b215d5c1b88e1a9fe482877ed733486b3)) - by @ghiscoding

* **core:** add `getFilterArgs()` to `SlickDataView` ([#1457](https://github.com/ghiscoding/slickgrid-universal/issues/1457)) ([7563126](https://github.com/ghiscoding/slickgrid-universal/commit/7563126cfbf792fc86a494850e5a3bad7d8991f7)) - by @ghiscoding

* notify onValidationError on paste if validation failed ([#1462](https://github.com/ghiscoding/slickgrid-universal/issues/1462)) ([38b465c](https://github.com/ghiscoding/slickgrid-universal/commit/38b465cb8ebcdd6012b939677a4367c2dce010e9)) - by @zewa666

## [4.6.1](https://github.com/ghiscoding/slickgrid-universal/compare/v4.6.0...v4.6.1) (2024-03-31)

### Bug Fixes

* **common:** move DOMPurify/SortableJS [@types](https://github.com/types) as dependencies ([51eaec7](https://github.com/ghiscoding/slickgrid-universal/commit/51eaec756120c93f0fbb9ed58b5784025b808e59)) - by @ghiscoding

* **common:** switch to `autocompleter-es` to get ESM build ([#1449](https://github.com/ghiscoding/slickgrid-universal/issues/1449)) ([aa59334](https://github.com/ghiscoding/slickgrid-universal/commit/aa59334d280d76078bc9cf36e66daa0bd4c6fac1)) - by @ghiscoding

* improve Dark Mode styling for icons barely visible in dark ([16b1a6e](https://github.com/ghiscoding/slickgrid-universal/commit/16b1a6e52bec83ed25bca077fe2ea30b5966f3ab)) - by @ghiscoding

* **pubsub:** externalize PubSub event to SlickEventData to stop bubbling ([#1444](https://github.com/ghiscoding/slickgrid-universal/issues/1444)) ([973d0ab](https://github.com/ghiscoding/slickgrid-universal/commit/973d0abb0a4df050ad68a6c7e6493bf7ae4abd52)) - by @ghiscoding

* revisit package `exports` to pass "are the types wrong" ([#1440](https://github.com/ghiscoding/slickgrid-universal/issues/1440)) ([20229f7](https://github.com/ghiscoding/slickgrid-universal/commit/20229f78adef51078f99fce3f5a46ac88280a048)) - by @ghiscoding

* **styling:** missing/too many borders compound filters w/group addon ([#1446](https://github.com/ghiscoding/slickgrid-universal/issues/1446)) ([863933f](https://github.com/ghiscoding/slickgrid-universal/commit/863933f8cd1988f5ae1b387839a99532cd58d92d)) - by @ghiscoding

* **tooltip:** allow multiple tooltips per grid cell ([#1448](https://github.com/ghiscoding/slickgrid-universal/issues/1448)) ([061c4a0](https://github.com/ghiscoding/slickgrid-universal/commit/061c4a087484238f7285eb27a1c238ac75972f19)) - by @ghiscoding

# [4.6.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.5.0...v4.6.0) (2024-03-23)

### Bug Fixes

* `column.editor` and `gridOptions.editorFactory` type changed ([#1428](https://github.com/ghiscoding/slickgrid-universal/issues/1428)) ([bf8c5b9](https://github.com/ghiscoding/slickgrid-universal/commit/bf8c5b95aca22bced0d926d6ac118c9fa0e61411)) - by @ghiscoding

* **build:** add ESLint-TS rules to enforce `type` imports and exports ([#1432](https://github.com/ghiscoding/slickgrid-universal/issues/1432)) ([cce4693](https://github.com/ghiscoding/slickgrid-universal/commit/cce4693556e01d7f664fbe832ae4e7fd5776dc6b)) - by @ghiscoding

* **common:** add missing Filter `model` Type of `FilterConstructor` ([#1430](https://github.com/ghiscoding/slickgrid-universal/issues/1430)) ([3f3e952](https://github.com/ghiscoding/slickgrid-universal/commit/3f3e952b20b41dda5bf2cd1648c6d6f02e7c7943)) - by @ghiscoding

* **common:** bump ms-select to fix compatibility problem in Salesforce ([#1425](https://github.com/ghiscoding/slickgrid-universal/issues/1425)) ([d3d2d39](https://github.com/ghiscoding/slickgrid-universal/commit/d3d2d390a8a1b17d0cd3699ddebfea855fdc5f77)) - by @ghiscoding

* **common:** Select All checkbox shouldn't disappear w/Dark Mode toggle ([#1421](https://github.com/ghiscoding/slickgrid-universal/issues/1421)) ([5fab179](https://github.com/ghiscoding/slickgrid-universal/commit/5fab1792cfdf24172bd46556b6fe5513c93d19d1)) - by @ghiscoding

* Join type ([#1427](https://github.com/ghiscoding/slickgrid-universal/issues/1427)) ([21c76cc](https://github.com/ghiscoding/slickgrid-universal/commit/21c76cc9d921ad34516bd38070afd791ff55de56)) - by @zewa666

* **styling:** add border & box-shadow to Flatpickr in Dark Mode ([fdbb6ae](https://github.com/ghiscoding/slickgrid-universal/commit/fdbb6ae9de7069968af747240a9b2ad74b0c8184)) - by @ghiscoding

* **styling:** add missing orange border for Salesforce modified inputs ([e830dd3](https://github.com/ghiscoding/slickgrid-universal/commit/e830dd3df4c6c0176ac88304247571f5ef05d4ef)) - by @ghiscoding

* **styling:** add more visual cue for column picker uncheck row select ([b4712e9](https://github.com/ghiscoding/slickgrid-universal/commit/b4712e9a8c03b60457d9033f11affb7364231de2)) - by @ghiscoding

* **styling:** don't add filled border all side for group-addon btn ([30be835](https://github.com/ghiscoding/slickgrid-universal/commit/30be8353101157a00440dba0357f88879bd3acda)) - by @ghiscoding-SE

* **styling:** small Composite Editor fixes for Dark Mode ([#1417](https://github.com/ghiscoding/slickgrid-universal/issues/1417)) ([7e00087](https://github.com/ghiscoding/slickgrid-universal/commit/7e000877a85059e23d3aa4c00c04d0e4e1e0abc1)) - by @ghiscoding

### Features

* **common:** add optional "Toggle Dark Mode" in Grid Menu ([#1418](https://github.com/ghiscoding/slickgrid-universal/issues/1418)) ([990c1df](https://github.com/ghiscoding/slickgrid-universal/commit/990c1df2a39a6b5098c991b16f43c5679daf4bb5)) - by @ghiscoding

* **core:** rename SG `editorClass` & deprecate `internalColumnEditor` ([#1429](https://github.com/ghiscoding/slickgrid-universal/issues/1429)) ([409115c](https://github.com/ghiscoding/slickgrid-universal/commit/409115cecb132556e88abf6e281f4fcb52414d71)) - by @ghiscoding

* upgrade to ms-select-vanilla v3.x ([#1439](https://github.com/ghiscoding/slickgrid-universal/issues/1439)) ([8f2378e](https://github.com/ghiscoding/slickgrid-universal/commit/8f2378e6cfed3489ce487fe84947bdabd04e31d2)) - by @ghiscoding

# [4.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.4.1...v4.5.0) (2024-03-05)

### Bug Fixes

* auto-resize not just grid but also headers for Salesforce tabs ([#1395](https://github.com/ghiscoding/slickgrid-universal/issues/1395)) ([6180461](https://github.com/ghiscoding/slickgrid-universal/commit/6180461b543cb7d4cc14d1504cb0db7d35990164)) - by @ghiscoding

* **common:** switch to `isomorphic-dompurify` for SSR support ([#1413](https://github.com/ghiscoding/slickgrid-universal/issues/1413)) ([b619453](https://github.com/ghiscoding/slickgrid-universal/commit/b619453fd9825500f2d9589e31bdcf5e17ac412d)), closes [/github.com/ghiscoding/Angular-Slickgrid/discussions/838#discussioncomment-8574215](https://github.com//github.com/ghiscoding/Angular-Slickgrid/discussions/838/issues/discussioncomment-8574215) - by @ghiscoding

* **core:** add extra checks for some objects to be a bit more strict ([#1404](https://github.com/ghiscoding/slickgrid-universal/issues/1404)) ([8b95c50](https://github.com/ghiscoding/slickgrid-universal/commit/8b95c505ed2409cde7b790f97b4fbc0d666ca459)) - by @ghiscoding

* **plugin:** the RowMove plugin cell should be selectable ([#1408](https://github.com/ghiscoding/slickgrid-universal/issues/1408)) ([8c01a13](https://github.com/ghiscoding/slickgrid-universal/commit/8c01a1361898fe3f3b6cfdba3239f93f2e8acec9)) - by @ghiscoding

* **styling:** add full width to grid container ([#1409](https://github.com/ghiscoding/slickgrid-universal/issues/1409)) ([eedc162](https://github.com/ghiscoding/slickgrid-universal/commit/eedc162e243b3c0bbf450bd404b199f5ee511926)) - by @ghiscoding

* **styling:** add menu shadow & increase contrast for Dark Mode ([bff2da0](https://github.com/ghiscoding/slickgrid-universal/commit/bff2da0dd027103c30fa86635b9e45460b10e700)) - by @ghiscoding

* **styling:** ms-select filter should use same color as other filters ([#1396](https://github.com/ghiscoding/slickgrid-universal/issues/1396)) ([a30d590](https://github.com/ghiscoding/slickgrid-universal/commit/a30d59066419d2c3324718f1d5497e8e89ebf749)) - by @ghiscoding

* **styling:** ms-select highlight bg-color same as nav highlight ([fe77341](https://github.com/ghiscoding/slickgrid-universal/commit/fe77341645f72be6c03a8e210dc08e6d0ef131d4)) - by @ghiscoding-SE

* **styling:** properly align flexbox ms-select icon+text vertically ([#1397](https://github.com/ghiscoding/slickgrid-universal/issues/1397)) ([e744d02](https://github.com/ghiscoding/slickgrid-universal/commit/e744d0256d25ba6ad5d538b827460828b6e0666f)) - by @ghiscoding

* **styling:** remove header menu open class for Dark Mode ([6a2e7e1](https://github.com/ghiscoding/slickgrid-universal/commit/6a2e7e13a18921c2b70caeb2690298173310aece)) - by @ghiscoding

* **styling:** tweak Composite Editor form disabled buttons style ([5052ba1](https://github.com/ghiscoding/slickgrid-universal/commit/5052ba19858ff2bced69f0846e00bbb36c9d0fde)) - by @ghiscoding

### Features

* **common:** upgrade `multiple-select-vanilla` to v2 ([#1401](https://github.com/ghiscoding/slickgrid-universal/issues/1401)) ([d6bb1d7](https://github.com/ghiscoding/slickgrid-universal/commit/d6bb1d7ef76100268456b2ab499c496a78debdd8)) - by @ghiscoding

* **deps:** simplify package TS Types exports ([#1402](https://github.com/ghiscoding/slickgrid-universal/issues/1402)) ([19bac52](https://github.com/ghiscoding/slickgrid-universal/commit/19bac52e5fcb8e523a26ab1f6564f0b6a2b93ef4)) - by @ghiscoding

* **editor:** add `onRendered` lifecycle callback option ([#1410](https://github.com/ghiscoding/slickgrid-universal/issues/1410)) ([9d348d6](https://github.com/ghiscoding/slickgrid-universal/commit/9d348d6e4b693e23a2959917e02a7bcfa55a0c90)) - by @ghiscoding

* **styling:** add Dark Mode grid option ([#1407](https://github.com/ghiscoding/slickgrid-universal/issues/1407)) ([855151b](https://github.com/ghiscoding/slickgrid-universal/commit/855151b9f47a5238e3069f8c85ba4ed8a5bf9bb6)) - by @ghiscoding

## [4.4.1](https://github.com/ghiscoding/slickgrid-universal/compare/v4.3.1...v4.4.1) (2024-02-13)

### Bug Fixes

* **core:** replace `any` types by valid types ([#1378](https://github.com/ghiscoding/slickgrid-universal/issues/1378)) ([02c4bc1](https://github.com/ghiscoding/slickgrid-universal/commit/02c4bc15e0da31c055c0fac9eecb7c4a17df3eb7)) - by @ghiscoding

* **deps:** update all non-major dependencies ([#1381](https://github.com/ghiscoding/slickgrid-universal/issues/1381)) ([2562352](https://github.com/ghiscoding/slickgrid-universal/commit/25623527d05dd713123e1031b682f0a80cca37de)) - by @renovate-bot

* mouse cell selection with active editor ([#1382](https://github.com/ghiscoding/slickgrid-universal/issues/1382)) ([17549b8](https://github.com/ghiscoding/slickgrid-universal/commit/17549b89933b10688fe8d186ab18ab4c8b7e9f87)) - by @zewa666

* **publish:** do not npm publish `tsconfig.tsbuildinfo` ([#1373](https://github.com/ghiscoding/slickgrid-universal/issues/1373)) ([9223338](https://github.com/ghiscoding/slickgrid-universal/commit/922333843852ae861015e4bbec053d4937222aa2)) - by @ghiscoding

### Features

* **ExcelExport:** migrate to Excel-Export-Vanilla (ESM) ([#1383](https://github.com/ghiscoding/slickgrid-universal/issues/1383)) ([f3838b3](https://github.com/ghiscoding/slickgrid-universal/commit/f3838b336659304988957ad933901645c5c243b7)) - by @ghiscoding

# [4.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.3.1...v4.4.0) (2024-02-12)

### Bug Fixes

* **core:** replace `any` types by valid types ([#1378](https://github.com/ghiscoding/slickgrid-universal/issues/1378)) ([02c4bc1](https://github.com/ghiscoding/slickgrid-universal/commit/02c4bc15e0da31c055c0fac9eecb7c4a17df3eb7)) - by @ghiscoding

* **deps:** update all non-major dependencies ([#1381](https://github.com/ghiscoding/slickgrid-universal/issues/1381)) ([2562352](https://github.com/ghiscoding/slickgrid-universal/commit/25623527d05dd713123e1031b682f0a80cca37de)) - by @renovate-bot

* mouse cell selection with active editor ([#1382](https://github.com/ghiscoding/slickgrid-universal/issues/1382)) ([17549b8](https://github.com/ghiscoding/slickgrid-universal/commit/17549b89933b10688fe8d186ab18ab4c8b7e9f87)) - by @zewa666

* **publish:** do not npm publish `tsconfig.tsbuildinfo` ([#1373](https://github.com/ghiscoding/slickgrid-universal/issues/1373)) ([9223338](https://github.com/ghiscoding/slickgrid-universal/commit/922333843852ae861015e4bbec053d4937222aa2)) - by @ghiscoding

### Features

* **ExcelExport:** migrate to Excel-Export-Vanilla (ESM) ([#1383](https://github.com/ghiscoding/slickgrid-universal/issues/1383)) ([f3838b3](https://github.com/ghiscoding/slickgrid-universal/commit/f3838b336659304988957ad933901645c5c243b7)) - by @ghiscoding

## [4.3.1](https://github.com/ghiscoding/slickgrid-universal/compare/v4.3.0...v4.3.1) (2024-01-27)

### Bug Fixes

* **core:** frozen grid w/hidden column should remove from DOM ([#1372](https://github.com/ghiscoding/slickgrid-universal/issues/1372)) ([2c1346e](https://github.com/ghiscoding/slickgrid-universal/commit/2c1346e53e0e5cba57c949f7b70d2b20d3dc1d22)) - by @ghiscoding

* **styling:** remove different bg-color on unorderable column ([#1358](https://github.com/ghiscoding/slickgrid-universal/issues/1358)) ([91426d1](https://github.com/ghiscoding/slickgrid-universal/commit/91426d1f6801680a5c40b3b900ab1a64cd771277)) - by @ghiscoding

### Performance Improvements

* **core:** convert `for..in` to `Object.keys().forEach` for better perf ([#1370](https://github.com/ghiscoding/slickgrid-universal/issues/1370)) ([29111a9](https://github.com/ghiscoding/slickgrid-universal/commit/29111a94756c34a2e01f2431c14b7ed806349a94)) - by @ghiscoding

* decrease calls to setItems & grid invalidate ([#1363](https://github.com/ghiscoding/slickgrid-universal/issues/1363)) ([cab6898](https://github.com/ghiscoding/slickgrid-universal/commit/cab68989ebd53178dfcee5ed293379dc8932a72f)) - by @ghiscoding

* **plugins:** decrease number of calls to translate all extensions only once ([#1359](https://github.com/ghiscoding/slickgrid-universal/issues/1359)) ([3e002f1](https://github.com/ghiscoding/slickgrid-universal/commit/3e002f15a06abd06893783e0667798f5ff8893cf)) - by @ghiscoding

* **plugins:** Row Base Editing tooltip title should be translated only once ([#1360](https://github.com/ghiscoding/slickgrid-universal/issues/1360)) ([ef4e8f9](https://github.com/ghiscoding/slickgrid-universal/commit/ef4e8f9f4bf491d670986c6dac8531274aaaa46b)) - by @ghiscoding

# [4.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.2.0...v4.3.0) (2024-01-20)

### Bug Fixes

* `getCellFromPoint()` should return row/cell -1 outside grid canvas ([#1325](https://github.com/ghiscoding/slickgrid-universal/issues/1325)) ([b483e62](https://github.com/ghiscoding/slickgrid-universal/commit/b483e62fc3931f836c77677db67557adb2ca4edd)) - by @ghiscoding

* add grid & cell `role` for screen ready accessibility ([#1337](https://github.com/ghiscoding/slickgrid-universal/issues/1337)) ([7309fa8](https://github.com/ghiscoding/slickgrid-universal/commit/7309fa8de4fc00f930e68af090010d91080b6213)) - by @ghiscoding

* **core:** allow extra spaces in `headerCssClass` & other `cssClass` ([#1303](https://github.com/ghiscoding/slickgrid-universal/issues/1303)) ([59ebaa6](https://github.com/ghiscoding/slickgrid-universal/commit/59ebaa65b6882ed3274a3185f457ecef4b2c5b51)) - by @ghiscoding

* **core:** allow extra spaces to be striped to any css classes ([#1352](https://github.com/ghiscoding/slickgrid-universal/issues/1352)) ([e5e29c0](https://github.com/ghiscoding/slickgrid-universal/commit/e5e29c063a9e018c2148685cfea5fc43c89426b9)) - by @ghiscoding

* **core:** column resize handle could throw when invalid elm ([#1344](https://github.com/ghiscoding/slickgrid-universal/issues/1344)) ([41f6058](https://github.com/ghiscoding/slickgrid-universal/commit/41f60583831b7284cba56f2af9cfe45b4a09d617)) - by @ghiscoding

* **core:** DataView `inlineFilters` should allow ES6 arrow functions ([#1304](https://github.com/ghiscoding/slickgrid-universal/issues/1304)) ([25b9a10](https://github.com/ghiscoding/slickgrid-universal/commit/25b9a10fdd14585f1b303361b2814e860c6e7031)) - by @ghiscoding

* **core:** don't show column header empty title tooltip ([#1317](https://github.com/ghiscoding/slickgrid-universal/issues/1317)) ([8b20407](https://github.com/ghiscoding/slickgrid-universal/commit/8b2040754f1810191fb26f0a5a91a19eae13ebfd)) - by @ghiscoding

* **core:** EventHandler subscribed event should be SlickEventData type ([#1327](https://github.com/ghiscoding/slickgrid-universal/issues/1327)) ([2573310](https://github.com/ghiscoding/slickgrid-universal/commit/25733102dbcefcbacc2ce5d6f4c07bd9d1cce6a1)) - by @ghiscoding

* **core:** remove editor keydown keyCaptureList duplicate code ([#1322](https://github.com/ghiscoding/slickgrid-universal/issues/1322)) ([c5f6b85](https://github.com/ghiscoding/slickgrid-universal/commit/c5f6b8575513aa6eb0215a47a0365fdab0059c3e)) - by @ghiscoding

* **core:** SlickEvent handler event should be type of ArgType ([#1328](https://github.com/ghiscoding/slickgrid-universal/issues/1328)) ([a9cb8ee](https://github.com/ghiscoding/slickgrid-universal/commit/a9cb8ee3f1a5da4249851e5b701b027b3f72ad26)), closes [#1327](https://github.com/ghiscoding/slickgrid-universal/issues/1327) - by @ghiscoding

* Editors/Filters should create SlickEventData with event arg ([#1326](https://github.com/ghiscoding/slickgrid-universal/issues/1326)) ([e008902](https://github.com/ghiscoding/slickgrid-universal/commit/e008902e6d85a7a424ed8c9e32786490daac66ce)) - by @ghiscoding

* **plugin:** CustomDataView for CellSelectionModel & SlickCustomTooltip ([#1306](https://github.com/ghiscoding/slickgrid-universal/issues/1306)) ([3bdd300](https://github.com/ghiscoding/slickgrid-universal/commit/3bdd30038b93af2db1f2f4a8b7df72ca6a06a06e)) - by @ghiscoding

* regression with `onSelectedRowsChanged` not receiving correct `caller` prop ([#1341](https://github.com/ghiscoding/slickgrid-universal/issues/1341)) ([03cad4a](https://github.com/ghiscoding/slickgrid-universal/commit/03cad4a34bf13a8e1342306f9210525f5025321f)) - by @ghiscoding

* SlickEmptyWarningComponent should accept native HTML for CSP safe ([#1333](https://github.com/ghiscoding/slickgrid-universal/issues/1333)) ([4740f96](https://github.com/ghiscoding/slickgrid-universal/commit/4740f961813666cbae918cb4940e7c2ec57bec2d)) - by @ghiscoding

* when `onDragInit` return false it should stop ([#1340](https://github.com/ghiscoding/slickgrid-universal/issues/1340)) ([d9c714c](https://github.com/ghiscoding/slickgrid-universal/commit/d9c714c042739d5cbdbe51b876f16a3152d200e6)), closes [#1339](https://github.com/ghiscoding/slickgrid-universal/issues/1339) - by @ghiscoding

* when `onResizeStart` return false it should stop ([#1339](https://github.com/ghiscoding/slickgrid-universal/issues/1339)) ([5a3bd1c](https://github.com/ghiscoding/slickgrid-universal/commit/5a3bd1c0c6a19294fe6578766d6b2d56ac8e2cac)) - by @ghiscoding

### Features

* add `name` option to CheckboxSelectColumn plugin on columDef ([#1331](https://github.com/ghiscoding/slickgrid-universal/issues/1331)) ([abe344b](https://github.com/ghiscoding/slickgrid-universal/commit/abe344b025b385630077bfb63d5534a88b3b7d71)) - by @ghiscoding

* add `onBeforePasteCell` event to excel copy buffer ([#1298](https://github.com/ghiscoding/slickgrid-universal/issues/1298)) ([22037ca](https://github.com/ghiscoding/slickgrid-universal/commit/22037ca7918fc4bfb55bb4bf619cd280b564a351)) - by @zewa666

* add column `reorderable` option to optionally lock a column ([#1357](https://github.com/ghiscoding/slickgrid-universal/issues/1357)) ([44f6c08](https://github.com/ghiscoding/slickgrid-universal/commit/44f6c085f009ec41bec711aa14ae7fbb3fcbc156)) - by @ghiscoding

* convert CheckSelectColumn plugin to native HTML for CSP safe code ([#1332](https://github.com/ghiscoding/slickgrid-universal/issues/1332)) ([2b9216d](https://github.com/ghiscoding/slickgrid-universal/commit/2b9216df3e1796ffb4081127cdaa9011e4d48b23)) - by @ghiscoding

* **core:** expose all SlickEvent via internal PubSub Service ([#1311](https://github.com/ghiscoding/slickgrid-universal/issues/1311)) ([f56edef](https://github.com/ghiscoding/slickgrid-universal/commit/f56edef91b76ab044134ddf36d67599e6d80f39c)) - by @ghiscoding

* **editor:** auto commit before save; add `onBeforeEditMode` callback ([#1353](https://github.com/ghiscoding/slickgrid-universal/issues/1353)) ([f33bf52](https://github.com/ghiscoding/slickgrid-universal/commit/f33bf5202e0db30121bf52ce184555f6524dde85)) - by @zewa666

* **plugin:** new Row Based Editor ([#1323](https://github.com/ghiscoding/slickgrid-universal/issues/1323)) ([64d464c](https://github.com/ghiscoding/slickgrid-universal/commit/64d464c2094c014024ddeaf49bd4f6ec898b1c25)) - by @zewa666

### Performance Improvements

* **resizer:** `autosizeColumns` is called too many times on page load ([#1343](https://github.com/ghiscoding/slickgrid-universal/issues/1343)) ([e02ac55](https://github.com/ghiscoding/slickgrid-universal/commit/e02ac550d9195ede2df58060fecc81b72c5011f9)) - by @ghiscoding

# [4.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.1.0...v4.2.0) (2023-12-30)

### Bug Fixes

* `updateColumns()` should be public use with column hidden ([#1288](https://github.com/ghiscoding/slickgrid-universal/issues/1288)) ([211180b](https://github.com/ghiscoding/slickgrid-universal/commit/211180b8c1f32250e6fc7a559baaa203154473e0)) - by @ghiscoding

* applyDefaults use provided grid options before applying defaults ([#1283](https://github.com/ghiscoding/slickgrid-universal/issues/1283)) ([7fc772f](https://github.com/ghiscoding/slickgrid-universal/commit/7fc772fb80a80e0eafa900fc688667d12e1f9429)) - by @ghiscoding

* **core:** `SlickGroupItemMetadataProvider` should implements `SlickPlugin` ([#1294](https://github.com/ghiscoding/slickgrid-universal/issues/1294)) ([5aac2b6](https://github.com/ghiscoding/slickgrid-universal/commit/5aac2b6a37cdd21938fa54769b72ce317562e45d)) - by @ghiscoding

* **core:** add missing option to control row highlight duration after CRUD ([#1278](https://github.com/ghiscoding/slickgrid-universal/issues/1278)) ([8240c8c](https://github.com/ghiscoding/slickgrid-universal/commit/8240c8c9710f4e5d902ec9961f6a721ae0f84f7f)) - by @ghiscoding

* GroupingGetterFunction should be allowed to return arbitrary value ([#1296](https://github.com/ghiscoding/slickgrid-universal/issues/1296)) ([3807116](https://github.com/ghiscoding/slickgrid-universal/commit/38071168e0fe5eea7d5e1ee117fae98c09057a4c)) - by @ghiscoding

* **RowDetail:** sort change should collapse all Row Detail ([#1284](https://github.com/ghiscoding/slickgrid-universal/issues/1284)) ([21f6031](https://github.com/ghiscoding/slickgrid-universal/commit/21f60310a402dd12c80bf4553588c6cd777a131a)) - by @ghiscoding

* use correct argument type on `setData()` ([#1287](https://github.com/ghiscoding/slickgrid-universal/issues/1287)) ([0b0b86c](https://github.com/ghiscoding/slickgrid-universal/commit/0b0b86c2325ea2a11b74d8fe8debeb02e23bb014)) - by @ghiscoding

### Features

* (re)add option to cancel Row Detail opening ([#1286](https://github.com/ghiscoding/slickgrid-universal/issues/1286)) ([f08925c](https://github.com/ghiscoding/slickgrid-universal/commit/f08925c50c1dd18448a04a55c8303736e3cc2289)) - by @ghiscoding

* datasetIdPropertyName respected in newRowCreator ([#1279](https://github.com/ghiscoding/slickgrid-universal/issues/1279)) ([9d60a9d](https://github.com/ghiscoding/slickgrid-universal/commit/9d60a9d82e605ae2351822c66ff8757349b906cf)) - by @zewa666

* make DataView Grouping `compileAccumulatorLoop` CSP safe ([#1295](https://github.com/ghiscoding/slickgrid-universal/issues/1295)) ([af82208](https://github.com/ghiscoding/slickgrid-universal/commit/af8220881b2791be2cc3f6605eda3955428094c7)) - by @ghiscoding

### Performance Improvements

* prefer `.forEach` over `for...in` and `for...of` ([#1281](https://github.com/ghiscoding/slickgrid-universal/issues/1281)) ([9cc6941](https://github.com/ghiscoding/slickgrid-universal/commit/9cc69410c25685c9251606fc82b91f8fd157be27)) - by @ghiscoding

# [4.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.3...v4.1.0) (2023-12-21)

### Bug Fixes

* **npm:** publish src folder for source maps, fixes downstream builds ([#1269](https://github.com/ghiscoding/slickgrid-universal/issues/1269)) ([701da75](https://github.com/ghiscoding/slickgrid-universal/commit/701da752565384408e22857a201828379bfc26ff)) - by @ghiscoding

### Features

* **core:** add `rowHighlightCssClass` & `highlightRow()` to SlickGrid ([#1272](https://github.com/ghiscoding/slickgrid-universal/issues/1272)) ([31c38ad](https://github.com/ghiscoding/slickgrid-universal/commit/31c38ad4d0a2e5c07ad92964fee303b31a192b59)) - by @ghiscoding

* **utils:** replace slick-core extend utils with `node-extend` ([#1277](https://github.com/ghiscoding/slickgrid-universal/issues/1277)) ([3439118](https://github.com/ghiscoding/slickgrid-universal/commit/3439118da344cd852a1b1af5bd83c4b894213464)) - by @ghiscoding

## [4.0.3](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.2...v4.0.3) (2023-12-16)

### Bug Fixes

* add back moment rollup patch with default import ([2e81421](https://github.com/ghiscoding/slickgrid-universal/commit/2e814214fe7246c76fe8e1398c87cd20cc41c862)) - by @ghiscoding

## [4.0.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.2...v4.0.2) (2023-12-15)

* BREAKING CHANGE: merge SlickGrid into Slickgrid-Universal & drop external dep (#1264) ([18b96ce](https://github.com/ghiscoding/slickgrid-universal/commit/18b96ce2a5779b36c8bc2a977d4e03b0a7003006)), closes [#1264](https://github.com/ghiscoding/slickgrid-universal/issues/1264) - by @ghiscoding

### BREAKING CHANGES

* merge SlickGrid into Slickgrid-Universal & drop external dep

## [4.0.1-alpha.1](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.1-alpha.0...v4.0.1-alpha.1) (2023-12-12)

### Bug Fixes

* changing `enableCellNavigation` grid option not working ([#1262](https://github.com/ghiscoding/slickgrid-universal/issues/1262)) ([b7de0f1](https://github.com/ghiscoding/slickgrid-universal/commit/b7de0f12546a6cc02222ed747015e65c90bb7f7d)) - by @ghiscoding

## [4.0.1-alpha.0](https://github.com/ghiscoding/slickgrid-universal/compare/v4.0.0-alpha.0...v4.0.1-alpha.0) (2023-12-10)

### Bug Fixes

* **core:** SlickEventHandler handler args should have Types ([#1261](https://github.com/ghiscoding/slickgrid-universal/issues/1261)) ([a33129b](https://github.com/ghiscoding/slickgrid-universal/commit/a33129b0ce1443443e7dcebb3562ffd538b6a731)) - by @ghiscoding

* regression, Row Detail no longer displayed after CSP safe code ([#1259](https://github.com/ghiscoding/slickgrid-universal/issues/1259)) ([a35f0a4](https://github.com/ghiscoding/slickgrid-universal/commit/a35f0a488775e8ccb68ec8fe0ece9abc47c358f4)) - by @ghiscoding

# [4.0.0-alpha.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.1...v4.0.0-alpha.0) (2023-12-09)

### Bug Fixes

* `setActiveCellInternal()` should not throw when cell/row undefined ([dbe6413](https://github.com/ghiscoding/slickgrid-universal/commit/dbe64132294bc88f5dc13ac23a6f6f84ac5e1ffd)) - by @ghiscoding

* change dynamic html string w/CSP safe code to fix scroll ([#1210](https://github.com/ghiscoding/slickgrid-universal/issues/1210)) ([cd03907](https://github.com/ghiscoding/slickgrid-universal/commit/cd03907b20468190db7f84f3ae24fbd531e4f6e4)) - by @ghiscoding

* Draggable shouldn't trigger dragEnd without first dragging ([#1211](https://github.com/ghiscoding/slickgrid-universal/issues/1211)) ([47cb36e](https://github.com/ghiscoding/slickgrid-universal/commit/47cb36e78995f70933807aa33ba3afa0fecf491e)) - by @ghiscoding

* escape glob pattern for SASS copy to work in CI ([0590b24](https://github.com/ghiscoding/slickgrid-universal/commit/0590b24bf2ac140ba69149bd55cbff95b3493112)) - by @ghiscoding-SE

* only allow row drag on cell w/`dnd` or `cell-reorder`, fix [#937](https://github.com/ghiscoding/slickgrid-universal/issues/937) ([6a2ab55](https://github.com/ghiscoding/slickgrid-universal/commit/6a2ab550a253a4a1f35e4e81a120fa9247ce753b)), closes [#897](https://github.com/ghiscoding/slickgrid-universal/issues/897) - by @ghiscoding-SE

* remove CellRange, SlickRange, SlickGroup, ... unused interfaces ([#1219](https://github.com/ghiscoding/slickgrid-universal/issues/1219)) ([a4cc469](https://github.com/ghiscoding/slickgrid-universal/commit/a4cc469e9c21c5ed851bfbaafdc6b580e7389272)) - by @ghiscoding

* the `devMode` should be `false` or an object with other options ([ac57992](https://github.com/ghiscoding/slickgrid-universal/commit/ac57992abd821cdd6fec823464944dadfa1e7b2c)) - by @ghiscoding-SE

* the `devMode` should be `false` or an object with other options ([ad2285a](https://github.com/ghiscoding/slickgrid-universal/commit/ad2285a3890442b28dfc7c668ab1b1376e17d3df)) - by @ghiscoding-SE

* try adding sort icon on non `sortable` column shouldn't throw ([4791fc8](https://github.com/ghiscoding/slickgrid-universal/commit/4791fc89078d9f3212d034fb1d5e43b8bbfffc5d)) - by @ghiscoding-SE

### Features

* convert GroupItemMetadataProvider Formatter to native HTML for CSP ([#1215](https://github.com/ghiscoding/slickgrid-universal/issues/1215)) ([d723856](https://github.com/ghiscoding/slickgrid-universal/commit/d723856777329f2e40fe3a12d3c59e33afd0e3a8)) - by @ghiscoding

* introduce devMode to support nodejs based unit testing ([#1251](https://github.com/ghiscoding/slickgrid-universal/issues/1251)) ([596737d](https://github.com/ghiscoding/slickgrid-universal/commit/596737d52a2ec8c42320152342144ff32191ebfd)) - by @ghiscoding

* remove unnecessary Formatters, replace by `cssClass` ([#1225](https://github.com/ghiscoding/slickgrid-universal/issues/1225)) ([de26496](https://github.com/ghiscoding/slickgrid-universal/commit/de26496aa5dc462869a4a1ff966b32baf86e188b)) - by @ghiscoding

* rewrite all Formatters as native HTML elements ([#1229](https://github.com/ghiscoding/slickgrid-universal/issues/1229)) ([5cb4dd5](https://github.com/ghiscoding/slickgrid-universal/commit/5cb4dd5757adc401ed4e6deab0e41bcd08a827a3)) - by @ghiscoding

* use PubSub Service singleton to subscribe to any SlickEvent ([#1248](https://github.com/ghiscoding/slickgrid-universal/issues/1248)) ([388bd11](https://github.com/ghiscoding/slickgrid-universal/commit/388bd115c1a15f853da8ac943a6e5e3574630438)) - by @ghiscoding

### Performance Improvements

* skip reapplying empty html when target is already empty ([#1230](https://github.com/ghiscoding/slickgrid-universal/issues/1230)) ([ba99fae](https://github.com/ghiscoding/slickgrid-universal/commit/ba99fae664f8a35573f00cf4719f1d70bcb9e37d)) - by @ghiscoding

## [3.7.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.1...v3.7.2) (2023-12-12)

### Bug Fixes

* the `devMode` should be `false` or an object with other options ([ad2285a](https://github.com/ghiscoding/slickgrid-universal/commit/ad2285a3890442b28dfc7c668ab1b1376e17d3df)) - by @ghiscoding-SE

* use !important on CSS text utils ([7fdbeb6](https://github.com/ghiscoding/slickgrid-universal/commit/7fdbeb6c46201ae80d6e71e2df7016735b771bf2)) - by @ghiscoding

## [3.7.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.7.0...v3.7.1) (2023-12-08)

### Bug Fixes

* add missing `devMode` option into `GridOption` interface ([a963223](https://github.com/ghiscoding/slickgrid-universal/commit/a9632239b5773d27b3712f75fdc47f3c5d13406e)) - by @ghiscoding-SE

# [3.7.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.6.0...v3.7.0) (2023-12-08)

### Bug Fixes

* cell selection range with key combos were incorrect ([#1244](https://github.com/ghiscoding/slickgrid-universal/issues/1244)) ([79d86fe](https://github.com/ghiscoding/slickgrid-universal/commit/79d86fea99258ccf82a5d3d8c684410623e6753b)) - by @ghiscoding

* DraggableGrouping & Select Filter `collectionAsync` mem leaks ([#1247](https://github.com/ghiscoding/slickgrid-universal/issues/1247)) ([7dcf53a](https://github.com/ghiscoding/slickgrid-universal/commit/7dcf53ac4d7873c75e82e01c2b4a806f88d8ff39)) - by @ghiscoding

* **formatters:** show console error on invalid multiple formatters ([#1227](https://github.com/ghiscoding/slickgrid-universal/issues/1227)) ([fd69ac0](https://github.com/ghiscoding/slickgrid-universal/commit/fd69ac01c68496d4e7d5dd2f06186fba961016d9)) - by @ghiscoding

* registered external resouces should keep singleton ref ([#1242](https://github.com/ghiscoding/slickgrid-universal/issues/1242)) ([adf2054](https://github.com/ghiscoding/slickgrid-universal/commit/adf2054bdc8ef7701e6fab78e685d49b8424da29)) - by @ghiscoding

### Features

* **Formatters:** add new `Formatters.iconBoolean` for icon w/truthy val ([#1228](https://github.com/ghiscoding/slickgrid-universal/issues/1228)) ([17ab965](https://github.com/ghiscoding/slickgrid-universal/commit/17ab965102c1f71270ea2423f9d6e0fd4ad73c14)) - by @ghiscoding

# 3.6.0 (2023-11-26)

### Features

* Column.excludeFieldFromQuery, exclude field but keep fields array ([#1217](https://github.com/ghiscoding/slickgrid-universal/issues/1217)) ([85cc514](https://github.com/ghiscoding/slickgrid-universal/commit/85cc514c945c1ad6eadd1a93a2839775a95da261)) - by @Harsgalt86

## [3.5.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.5.0...v3.5.1) (2023-11-13)

### Bug Fixes

* **common:** ms-select-vanilla requires `@types/trusted-types` dep ([#1190](https://github.com/ghiscoding/slickgrid-universal/issues/1190)) ([284a379](https://github.com/ghiscoding/slickgrid-universal/commit/284a3791027423d0d7f45a950e0a3b8a8a684612)) - by @ghiscoding

* improve build & types exports for all targets, Node, CJS/ESM ([#1188](https://github.com/ghiscoding/slickgrid-universal/issues/1188)) ([980fd68](https://github.com/ghiscoding/slickgrid-universal/commit/980fd68f6ce9564bb1fcac5f6ee68fd35f839e8f)) - by @ghiscoding

# [3.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.4.2...v3.5.0) (2023-11-10)

### Bug Fixes

* **common:** SlickCellRangeSelector shouldn't stop editor event bubbling ([#1183](https://github.com/ghiscoding/slickgrid-universal/issues/1183)) ([7bb9d25](https://github.com/ghiscoding/slickgrid-universal/commit/7bb9d25c40c3f7f53be57c45917802e5f426c599)) - by @ghiscoding

* **graphql:** deprecate `isWithCursor` in favor of simpler `useCursor` ([#1187](https://github.com/ghiscoding/slickgrid-universal/issues/1187)) ([7b3590f](https://github.com/ghiscoding/slickgrid-universal/commit/7b3590f323ea2fe3d3f312674205fc94485213fa)) - by @ghiscoding

* **pagination:** should recreate pagination on cursor based changed ([#1175](https://github.com/ghiscoding/slickgrid-universal/issues/1175)) ([c7836aa](https://github.com/ghiscoding/slickgrid-universal/commit/c7836aae4a4ea0892791acc79a7bcb338ddb2038)) - by @ghiscoding

* **styles:** menu command with & without icons aren't aligned ([#1180](https://github.com/ghiscoding/slickgrid-universal/issues/1180)) ([35f040d](https://github.com/ghiscoding/slickgrid-universal/commit/35f040dbd1f2d384aadbfbe351dd0e55f8d34c68)) - by @ghiscoding

### Features

* **common:** add `compoundOperatorAltTexts` grid option ([#1181](https://github.com/ghiscoding/slickgrid-universal/issues/1181)) ([dc0aa5e](https://github.com/ghiscoding/slickgrid-universal/commit/dc0aa5e28351af989e9dd691916af909e3a5fdf5)) - by @ghiscoding

* Graphql verbatim search terms ([#1174](https://github.com/ghiscoding/slickgrid-universal/issues/1174)) ([eadc5ef](https://github.com/ghiscoding/slickgrid-universal/commit/eadc5ef636e8bf331d89f37be4596e7cc534b974)) - by @Harsgalt86

## [3.4.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.4.1...v3.4.2) (2023-11-02)

**Note:** Version bump only for package @slickgrid-universal/common

## [3.4.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.4.0...v3.4.1) (2023-11-02)

### Bug Fixes

* **pagination:** add missing setCursorBased() method for dynamic change ([#1171](https://github.com/ghiscoding/slickgrid-universal/issues/1171)) ([886170e](https://github.com/ghiscoding/slickgrid-universal/commit/886170e35f68fe06cfe9e185e2f39d75d8e295f4)) - by @ghiscoding

# [3.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.3.2...v3.4.0) (2023-11-02)

### Bug Fixes

* **common:** `unbindAll` with a group name should remove all tagged ones ([#1152](https://github.com/ghiscoding/slickgrid-universal/issues/1152)) ([5014354](https://github.com/ghiscoding/slickgrid-universal/commit/5014354803d4561409c0f9622ad8bc5093d494cf)), closes [#1150](https://github.com/ghiscoding/slickgrid-universal/issues/1150) - by @ghiscoding

* **common:** calling `bind` with multiple events should add group name ([#1157](https://github.com/ghiscoding/slickgrid-universal/issues/1157)) ([9023b54](https://github.com/ghiscoding/slickgrid-universal/commit/9023b54146b72c0305128484f9fd6f9d1ac47b48)), closes [#1150](https://github.com/ghiscoding/slickgrid-universal/issues/1150) - by @ghiscoding

* **common:** clicking Menu close button should only close current menu ([#1160](https://github.com/ghiscoding/slickgrid-universal/issues/1160)) ([b524ef1](https://github.com/ghiscoding/slickgrid-universal/commit/b524ef1af6c662bc4ebcd87ad95aa99dd077a119)) - by @ghiscoding

* **common:** context menu should close when clicking another cell ([#1163](https://github.com/ghiscoding/slickgrid-universal/issues/1163)) ([bd132c5](https://github.com/ghiscoding/slickgrid-universal/commit/bd132c52a082147c2366b2fade124e145834902f)) - by @ghiscoding

* **common:** disable throwWhenFrozenNotAllViewable w/frozen grids ([#1149](https://github.com/ghiscoding/slickgrid-universal/issues/1149)) ([9a06875](https://github.com/ghiscoding/slickgrid-universal/commit/9a06875d8654c47d97aaaa0fd5191c1bfeae7288)) - by @ghiscoding

* **common:** make sure destroy is a function before calling it ([#1148](https://github.com/ghiscoding/slickgrid-universal/issues/1148)) ([dba9606](https://github.com/ghiscoding/slickgrid-universal/commit/dba96060666a929eb616bcacb492f6f5f3f56106)) - by @ghiscoding

* **common:** mouseover disabled sub-menu shouldn't open it ([#1167](https://github.com/ghiscoding/slickgrid-universal/issues/1167)) ([550f103](https://github.com/ghiscoding/slickgrid-universal/commit/550f1031ca2c56649ed630ab753d757a3fb799fa)) - by @ghiscoding

* **common:** replace `innerHTML: '&times;'` with `textContent: '×'` ([#1156](https://github.com/ghiscoding/slickgrid-universal/issues/1156)) ([e8b2cfb](https://github.com/ghiscoding/slickgrid-universal/commit/e8b2cfb4b3d182de429ba367d1c83b873670fabc)) - by @ghiscoding

* **common:** rollback event capture causing multiple calls ([#1168](https://github.com/ghiscoding/slickgrid-universal/issues/1168)) ([90876c9](https://github.com/ghiscoding/slickgrid-universal/commit/90876c9a57f291271a3510541e4a24a4ef86413c)) - by @ghiscoding

* deprecate HeaderMenu `items` in favor of `commandItems` ([#1159](https://github.com/ghiscoding/slickgrid-universal/issues/1159)) ([2b26d6d](https://github.com/ghiscoding/slickgrid-universal/commit/2b26d6da1232f4ad4a7d0db8ad077b3b2e3c6bd7)) - by @ghiscoding

* **deps:** update all non-major dependencies ([#1138](https://github.com/ghiscoding/slickgrid-universal/issues/1138)) ([82a602e](https://github.com/ghiscoding/slickgrid-universal/commit/82a602e8c3c25a45979d3e3bbf4766d1bae33f80)) - by @renovate-bot

* **gridMenu:** remove GridMenu from DOM after closing it ([#1169](https://github.com/ghiscoding/slickgrid-universal/issues/1169)) ([87b242f](https://github.com/ghiscoding/slickgrid-universal/commit/87b242fdebd6d8ce838842458e192a6e90de3d80)) - by @ghiscoding

* move `innerHTML` as separate assignment to improve CSP trusted types ([#1162](https://github.com/ghiscoding/slickgrid-universal/issues/1162)) ([9c6a002](https://github.com/ghiscoding/slickgrid-universal/commit/9c6a002666f16b1096d3f928900ad412a4124233)) - by @ghiscoding

### Features

* add `subMenuOpenByEvent` option to open sub-menus via mouseover ([#1161](https://github.com/ghiscoding/slickgrid-universal/issues/1161)) ([609f88b](https://github.com/ghiscoding/slickgrid-universal/commit/609f88b2b80515a540bd7ae1c8366b57bd288dbc)) - by @ghiscoding

* add sub-menu(s) to CellMenu & ContextMenu plugins ([#1141](https://github.com/ghiscoding/slickgrid-universal/issues/1141)) ([bd18af1](https://github.com/ghiscoding/slickgrid-universal/commit/bd18af1ee960f9417cb7625ff8c3fb5d9567d16e)) - by @ghiscoding

* add sub-menu(s) to GridMenu plugin ([#1151](https://github.com/ghiscoding/slickgrid-universal/issues/1151)) ([5178310](https://github.com/ghiscoding/slickgrid-universal/commit/5178310c0247d5524300841aac7aea7c4f3df733)) - by @ghiscoding

* add sub-menu(s) to HeaderMenu plugin ([#1158](https://github.com/ghiscoding/slickgrid-universal/issues/1158)) ([eeab42e](https://github.com/ghiscoding/slickgrid-universal/commit/eeab42e270e53341a8572ab55ed758276a4d30d6)) - by @ghiscoding

* add support for grid inside Shadow DOM ([#1166](https://github.com/ghiscoding/slickgrid-universal/issues/1166)) ([f7b8c46](https://github.com/ghiscoding/slickgrid-universal/commit/f7b8c46593c71b7114ac85610c12ad6187e3f6de)) - by @ghiscoding

* **common:** add group name to `bind` and `unbindAll` methods ([#1150](https://github.com/ghiscoding/slickgrid-universal/issues/1150)) ([6c3b90e](https://github.com/ghiscoding/slickgrid-universal/commit/6c3b90e774906621d5b1584a2372ba633d2366ff)) - by @ghiscoding

* **common:** create ColumnPicker dynamically every time ([#1165](https://github.com/ghiscoding/slickgrid-universal/issues/1165)) ([7e8d80e](https://github.com/ghiscoding/slickgrid-universal/commit/7e8d80e807176ba2064cbb71d06fb53995aae06c)) - by @ghiscoding

* **graphql:** add optional cursor pagination to GraphQL backend service ([#1153](https://github.com/ghiscoding/slickgrid-universal/issues/1153)) ([29579b2](https://github.com/ghiscoding/slickgrid-universal/commit/29579b23ab1e531b3323cbf10eb9e9882e244b8f)) - by @Harsgalt86

## [3.3.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.3.1...v3.3.2) (2023-10-06)

**Note:** Version bump only for package @slickgrid-universal/common

# [3.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.2.2...v3.3.0) (2023-10-05)

### Bug Fixes

* **types:** small TS type fix on DataView setFilter ([1ab0930](https://github.com/ghiscoding/slickgrid-universal/commit/1ab0930213e68110e22b6f89681c4651586c9420)) - by @ghiscoding

### Features

* add pageUp/pageDown/home/end to SlickCellSelection ([#1126](https://github.com/ghiscoding/slickgrid-universal/issues/1126)) ([b7e9e0d](https://github.com/ghiscoding/slickgrid-universal/commit/b7e9e0db9fde184c76cb835858d195ad28657b05)) - by @ghiscoding

## [3.2.2](https://github.com/ghiscoding/slickgrid-universal/compare/v3.2.1...v3.2.2) (2023-09-24)

### Bug Fixes

* **deps:** update dependency multiple-select-vanilla to ^0.4.10 ([#1098](https://github.com/ghiscoding/slickgrid-universal/issues/1098)) ([ab97b9d](https://github.com/ghiscoding/slickgrid-universal/commit/ab97b9df3205f1a55f69f3722d276c8c71d8fd29)) - by @renovate-bot

* **GridService:** clear any opened highlight timers before disposing ([#1116](https://github.com/ghiscoding/slickgrid-universal/issues/1116)) ([c6a0957](https://github.com/ghiscoding/slickgrid-universal/commit/c6a095702a672e14b442e71be492942c07d6f1e6)) - by @ghiscoding

* **resizer:** resize without container ([#1117](https://github.com/ghiscoding/slickgrid-universal/issues/1117)) ([9013522](https://github.com/ghiscoding/slickgrid-universal/commit/90135223130dacfdd376b56d4cf49437328b08ae)) - by @zewa666

## [3.2.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.2.0...v3.2.1) (2023-09-05)

### Bug Fixes

* **common:** Select Filter/Editor enableRenderHtml was wrong ([#1096](https://github.com/ghiscoding/slickgrid-universal/issues/1096)) ([1f09eef](https://github.com/ghiscoding/slickgrid-universal/commit/1f09eefaf2dbb13434fd90b54b5361ef9f08116c)) - by @ghiscoding

## [3.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.1.0...v3.2.0) (2023-08-21)

### Features

* **export:** add `autoDetectCellFormat` flag to Excel Export Options ([#1083](https://github.com/ghiscoding/slickgrid-universal/issues/1083)) ([839b09a](https://github.com/ghiscoding/slickgrid-universal/commit/839b09a10ceba889bc96a7f229f58412a6d5649c)) - by @ghiscoding

* **TreeData:** add auto-recalc feature for Tree Totals w/Aggregators ([#1084](https://github.com/ghiscoding/slickgrid-universal/issues/1084)) ([e884c03](https://github.com/ghiscoding/slickgrid-universal/commit/e884c0356595c161b746ca370efa4bd74088c458)) - by @ghiscoding

* **TreeData:** add optional Aggregators to Tree Data grids  ([#1074](https://github.com/ghiscoding/slickgrid-universal/issues/1074)) ([6af5fd1](https://github.com/ghiscoding/slickgrid-universal/commit/6af5fd17b582834b24655b06c34c634a99c93c6e)) - by @ghiscoding

### Bug Fixes

* **common:** Sort Service could throw on 3rd with undefined columnId ([#1059](https://github.com/ghiscoding/slickgrid-universal/issues/1059)) ([1141230](https://github.com/ghiscoding/slickgrid-universal/commit/114123040a6b69d40f928955627121189a6feb75)) - by @ghiscoding

* copying multiple times only kept last undo CellExternalCopyManager ([#1075](https://github.com/ghiscoding/slickgrid-universal/issues/1075)) ([e3beee2](https://github.com/ghiscoding/slickgrid-universal/commit/e3beee208fcd223e911d2d88a15b9d2950267eda)) - by @ghiscoding

* **deps:** update dependency autocompleter to v9 ([#1051](https://github.com/ghiscoding/slickgrid-universal/issues/1051)) ([0e05f2a](https://github.com/ghiscoding/slickgrid-universal/commit/0e05f2a4c9f3c9640a3982b7cfa04ea71cfaab96)) - by @renovate-bot

* **TreeData:** auto-recalc should update totals for collapsed items too ([#1086](https://github.com/ghiscoding/slickgrid-universal/issues/1086)) ([25d39f2](https://github.com/ghiscoding/slickgrid-universal/commit/25d39f277093990f150ec4aa471c079eab73e4b1)) - by @ghiscoding

## [3.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v3.0.1...v3.1.0) (2023-07-20)

### Features

* **common:** add optional `scrollIntoView` to GridService `addItems` ([#1043](https://github.com/ghiscoding/slickgrid-universal/issues/1043)) ([a6d194a](https://github.com/ghiscoding/slickgrid-universal/commit/a6d194a4352f22a23c493250ceef67e5acd86ce4)) - by @ghiscoding

### Bug Fixes

* **deps:** update dependency dompurify to ^3.0.5 ([#1030](https://github.com/ghiscoding/slickgrid-universal/issues/1030)) ([728bc58](https://github.com/ghiscoding/slickgrid-universal/commit/728bc58b6844544479695f29984221c9ea099936)) - by @renovate-bot

* **plugins:** RowMoveManager shouldn't add cssClass when not usable ([#1044](https://github.com/ghiscoding/slickgrid-universal/issues/1044)) ([f25eeec](https://github.com/ghiscoding/slickgrid-universal/commit/f25eeec7a277d4b915d1423f12e688ad8ac98e7c)) - by @ghiscoding

## [3.0.1](https://github.com/ghiscoding/slickgrid-universal/compare/v3.0.0...v3.0.1) (2023-07-01)

### Bug Fixes

* **common:** Select Filter/Editor regular text shouldn't be html encoded ([#1011](https://github.com/ghiscoding/slickgrid-universal/issues/1011)) ([c203a2c](https://github.com/ghiscoding/slickgrid-universal/commit/c203a2ce4d4e5cf6dfb0e05a25f5fd6b0c4cbe4d)), closes [#976](https://github.com/ghiscoding/slickgrid-universal/issues/976) - by @ghiscoding

* **deps:** update all non-major dependencies ([#1016](https://github.com/ghiscoding/slickgrid-universal/issues/1016)) ([c34ed84](https://github.com/ghiscoding/slickgrid-universal/commit/c34ed84c8c5aa20876c70b6350f711e16fe6b965)) - by @renovate-bot

* **deps:** update dependency autocompleter to ^8.0.4 ([#996](https://github.com/ghiscoding/slickgrid-universal/issues/996)) ([3adf3a1](https://github.com/ghiscoding/slickgrid-universal/commit/3adf3a1a4cf960963ce1447617b3f34b68b6ff4d)) - by @renovate-bot

* **deps:** update dependency slickgrid to ^4.0.1 ([#1017](https://github.com/ghiscoding/slickgrid-universal/issues/1017)) ([2750816](https://github.com/ghiscoding/slickgrid-universal/commit/2750816b7b669a820362934daa9bbfd5d60f3ac5)) - by @renovate-bot

* **GridState:** calling `getAssociatedGridColumns` should extend column ([#1014](https://github.com/ghiscoding/slickgrid-universal/issues/1014)) ([77cec0c](https://github.com/ghiscoding/slickgrid-universal/commit/77cec0cd052ec3145d73a7a16d0c7f5c663e3901)) - by @ghiscoding

* **GridState:** calling getAssociatedGridColumns should extend column (part2) ([#1015](https://github.com/ghiscoding/slickgrid-universal/issues/1015)) ([3ea1d02](https://github.com/ghiscoding/slickgrid-universal/commit/3ea1d0289ba260325a2592fda42fecce10499525)) - by @ghiscoding

* **grouping:** DraggableGrouping could throw when leaving page ([#1019](https://github.com/ghiscoding/slickgrid-universal/issues/1019)) ([c233a9c](https://github.com/ghiscoding/slickgrid-universal/commit/c233a9c5db1fc06395e75f1bc5bb34ea3431ba1f)) - by @ghiscoding

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

* **core:** set `wheel` event listener to passive for better perf ([#971](https://github.com/ghiscoding/slickgrid-universal/issues/971)) ([e4417e8](https://github.com/ghiscoding/slickgrid-universal/commit/e4417e865f6fdf4bcb27eebfc476d959a16d47ea)) - by @ghiscoding

* **export:** fix negative number exports to Excel ([#977](https://github.com/ghiscoding/slickgrid-universal/issues/977)) ([edf5721](https://github.com/ghiscoding/slickgrid-universal/commit/edf5721007ce0745fc81f3f0261fb7e25340cbc1)) - by @ghiscoding

* SlickDraggableGrouping should hide group elms when dragging ([#965](https://github.com/ghiscoding/slickgrid-universal/issues/965)) ([6601998](https://github.com/ghiscoding/slickgrid-universal/commit/660199896df040a34f8947acf81a5d720d11a8c4)) - by @ghiscoding

## [2.6.3](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.2...v2.6.3) (2023-03-23)

### Bug Fixes

* **presets:** dynamic columns should be auto-inserted with Grid Presets ([#938](https://github.com/ghiscoding/slickgrid-universal/issues/938)) ([1f9c1c4](https://github.com/ghiscoding/slickgrid-universal/commit/1f9c1c492586f4a0a6582ece4b44bc747e6990c8)) - by @ghiscoding

## [2.6.2](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.1...v2.6.2) (2023-03-03)

### Bug Fixes

* draggable grouping shouldn't throw error when dynamically changing columns ([#922](https://github.com/ghiscoding/slickgrid-universal/issues/922)) ([07a39dc](https://github.com/ghiscoding/slickgrid-universal/commit/07a39dc3f3b07cd44a39b790737a57f60d967c7c)) - by @dmitov92

## [2.6.1](https://github.com/ghiscoding/slickgrid-universal/compare/v2.6.0...v2.6.1) (2023-02-24)

### Bug Fixes

* **common:** remove jQuery import to avoid duplicate jQuery load ([4622258](https://github.com/ghiscoding/slickgrid-universal/commit/462225835382ecd36dbdb6bc042b38d5171c7ada)), closes [#911](https://github.com/ghiscoding/slickgrid-universal/issues/911) - by @ghiscoding

# [2.6.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.5.0...v2.6.0) (2023-02-23)

### Bug Fixes

* Edt cell mouseout should save & excel copy buffer should still work ([#917](https://github.com/ghiscoding/slickgrid-universal/issues/917)) ([18ba0fc](https://github.com/ghiscoding/slickgrid-universal/commit/18ba0fc4ed2cb2f678dc4a5486439d59e051a94a)), closes [#901](https://github.com/ghiscoding/slickgrid-universal/issues/901) [#901](https://github.com/ghiscoding/slickgrid-universal/issues/901) - by @ghiscoding

### Features

* **build:** move TypeScript types into a single dist/types folder ([#905](https://github.com/ghiscoding/slickgrid-universal/issues/905)) ([b139c1e](https://github.com/ghiscoding/slickgrid-universal/commit/b139c1e7910f2029ceca58a9d744320ed3ba5372)) - by @ghiscoding

# [2.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.4.1...v2.5.0) (2023-02-17)

### Bug Fixes

* **autocomplete:** Autocomplete drop container should take content width ([#897](https://github.com/ghiscoding/slickgrid-universal/issues/897)) ([9690a38](https://github.com/ghiscoding/slickgrid-universal/commit/9690a38f678ca6f0632b847aebfe93e5b7f0bc12)) - by @ghiscoding

* **build:** package exports prop had invalid ESM import link ([#892](https://github.com/ghiscoding/slickgrid-universal/issues/892)) ([7f95f69](https://github.com/ghiscoding/slickgrid-universal/commit/7f95f698447f8178cb7ceec416c35f4957fddbe9)) - by @ghiscoding

* **common:** Excel copy cell ranges shouldn't lose its cell focus ([#901](https://github.com/ghiscoding/slickgrid-universal/issues/901)) ([1dc8b76](https://github.com/ghiscoding/slickgrid-universal/commit/1dc8b762b4fc8070eec003161fdc9c4ebf60afd2)) - by @ghiscoding

* **deps:** update dependency autocompleter to v8 ([#895](https://github.com/ghiscoding/slickgrid-universal/issues/895)) ([7df225d](https://github.com/ghiscoding/slickgrid-universal/commit/7df225d844ec5629800373da59aeed44eee04e1b)) - by @renovate-bot

* **deps:** update dependency dompurify to v3 ([#907](https://github.com/ghiscoding/slickgrid-universal/issues/907)) ([66c8b4d](https://github.com/ghiscoding/slickgrid-universal/commit/66c8b4d602d88d733070b2189468bf1b6508d7eb)) - by @renovate-bot

* **editor:** comparing select editor value against `['']` isn't valid ([#909](https://github.com/ghiscoding/slickgrid-universal/issues/909)) ([d93fd5f](https://github.com/ghiscoding/slickgrid-universal/commit/d93fd5f163e393c47fad8c8d285a5788b3834adf)) - by @ghiscoding

* **export:** Excel export auto-detect number with Formatters.multiple ([#902](https://github.com/ghiscoding/slickgrid-universal/issues/902)) ([be33a68](https://github.com/ghiscoding/slickgrid-universal/commit/be33a68cadbdaed0c60b00bdcd123f3a4797fb8a)) - by @ghiscoding

* **RowDetail:** Row Detail extension should work with editable grid ([#896](https://github.com/ghiscoding/slickgrid-universal/issues/896)) ([99677f0](https://github.com/ghiscoding/slickgrid-universal/commit/99677f08b9cb383a2b64540700e501c7bdfe9f72)) - by @ghiscoding

### Features

* **build:** add cssnano into postcss to shrink css output ([#903](https://github.com/ghiscoding/slickgrid-universal/issues/903)) ([b1ae2a7](https://github.com/ghiscoding/slickgrid-universal/commit/b1ae2a7a1e3717e83209af1f0d1309113f3cdd12)) - by @ghiscoding

## [2.4.1](https://github.com/ghiscoding/slickgrid-universal/compare/v2.4.0...v2.4.1) (2023-02-04)

### Bug Fixes

* use DOMPurify correct namespace for dts file ([#890](https://github.com/ghiscoding/slickgrid-universal/issues/890)) ([78357bc](https://github.com/ghiscoding/slickgrid-universal/commit/78357bc3247200a281b42e6b8a7e58f8f7ca4132)) - by @ghiscoding

# [2.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.3.0...v2.4.0) (2023-02-04)

### Bug Fixes

* **build:** some TypeScript 5.x related errors ([#886](https://github.com/ghiscoding/slickgrid-universal/issues/886)) ([4aa2f56](https://github.com/ghiscoding/slickgrid-universal/commit/4aa2f56b545f912d04fe4fab553d783164f6fc36)) - by @ghiscoding

### Features

* **dataView:** add option to apply row selection to all pages ([#882](https://github.com/ghiscoding/slickgrid-universal/issues/882)) ([4aac7cb](https://github.com/ghiscoding/slickgrid-universal/commit/4aac7cb7f38c3675a2ad693212152ded94ee2174)) - by @ghiscoding

# [2.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.2.2...v2.3.0) (2023-01-21)

### Bug Fixes

* **filters:** provide flag to disable special chars input filter parsing ([#873](https://github.com/ghiscoding/slickgrid-universal/issues/873)) ([7e35dae](https://github.com/ghiscoding/slickgrid-universal/commit/7e35dae2258c191e76dbdf01ac654f4a54b5b547)), closes [/stackoverflow.com/questions/75155658/in-angular-slickgrid-the-records-with-special-characters-are-not-gett/75160978#75160978](https://github.com//stackoverflow.com/questions/75155658/in-angular-slickgrid-the-records-with-special-characters-are-not-gett/75160978/issues/75160978) - by @ghiscoding

* **styling:** do not remove ul>li bullet on html root, fixes [#868](https://github.com/ghiscoding/slickgrid-universal/issues/868) ([#872](https://github.com/ghiscoding/slickgrid-universal/issues/872)) ([59fa0ba](https://github.com/ghiscoding/slickgrid-universal/commit/59fa0badad181172bf37a31ecf4ef0f44ee47e8d)) - by @ghiscoding

## [2.2.2](https://github.com/ghiscoding/slickgrid-universal/compare/v2.2.1...v2.2.2) (2022-12-24)

### Bug Fixes

* **common:** cell selection in Firefox not working ([#859](https://github.com/ghiscoding/slickgrid-universal/issues/859)) ([41ec4e7](https://github.com/ghiscoding/slickgrid-universal/commit/41ec4e7b8ad2396b2c8a6b5ddc43b23fb13af386)) - by @ghiscoding

## [2.2.1](https://github.com/ghiscoding/slickgrid-universal/compare/v2.2.0...v2.2.1) (2022-12-22)

### Bug Fixes

* **styling:** make Grid Menu item full width instead of max-content ([#858](https://github.com/ghiscoding/slickgrid-universal/issues/858)) ([9c57365](https://github.com/ghiscoding/slickgrid-universal/commit/9c5736540fae98e227fa99b182904a228886f4cb)) - by @ghiscoding

# [2.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.1.3...v2.2.0) (2022-12-21)

### Bug Fixes

* **editors:** Autocomplete list should be using same width as cell width ([#846](https://github.com/ghiscoding/slickgrid-universal/issues/846)) ([0055f8a](https://github.com/ghiscoding/slickgrid-universal/commit/0055f8a925f7ec6e381c9b9b05dccdb405b7a420)) - by @ghiscoding

* **export:** create custom Excel cell format with Formatters.decimal ([#844](https://github.com/ghiscoding/slickgrid-universal/issues/844)) ([a7a626c](https://github.com/ghiscoding/slickgrid-universal/commit/a7a626ccaaa510d084979d38d9a6b5a439f24e6d)) - by @ghiscoding

* **exports:** Date should always export w/Formatter unless false ([#856](https://github.com/ghiscoding/slickgrid-universal/issues/856)) ([1b249e8](https://github.com/ghiscoding/slickgrid-universal/commit/1b249e88e3033ff4c432346ae32ce3183537237b)) - by @ghiscoding

* **formatters:** add all missing Date Formatters ([#855](https://github.com/ghiscoding/slickgrid-universal/issues/855)) ([9d29e59](https://github.com/ghiscoding/slickgrid-universal/commit/9d29e59818ae4e7d3cac692f0479e0147cc2ba8d)) - by @ghiscoding

* **formatters:** Date Formatter should work with Date object ([#854](https://github.com/ghiscoding/slickgrid-universal/issues/854)) ([30b80e2](https://github.com/ghiscoding/slickgrid-universal/commit/30b80e27b209dbafda25963864116d980650a648)) - by @ghiscoding

* **styling:** Grid Menu & Col Picker overflow in Firefox ([#845](https://github.com/ghiscoding/slickgrid-universal/issues/845)) ([9b0aef7](https://github.com/ghiscoding/slickgrid-universal/commit/9b0aef74d569c73e18d64e29034d777315c19cf8)) - by @ghiscoding

### Features

* **exports:** add Excel auto-detect format by field types & formatters ([#848](https://github.com/ghiscoding/slickgrid-universal/issues/848)) ([27a18c4](https://github.com/ghiscoding/slickgrid-universal/commit/27a18c416e71a2a1f418d5c2c850fd331262bf7f)) - by @ghiscoding

* **exports:** add Excel custom cell (column) styling ([#851](https://github.com/ghiscoding/slickgrid-universal/issues/851)) ([dd92d44](https://github.com/ghiscoding/slickgrid-universal/commit/dd92d44e0ac27c94a72c98af314cfa23f525f94c)) - by @ghiscoding

* **exports:** add optional Excel export parser callback functions ([#852](https://github.com/ghiscoding/slickgrid-universal/issues/852)) ([975da5b](https://github.com/ghiscoding/slickgrid-universal/commit/975da5b1d87ac287c1240e7ec88be4760e22ca74)) - by @ghiscoding

* **exports:** add optional file MIME type to Excel export service ([#849](https://github.com/ghiscoding/slickgrid-universal/issues/849)) ([05402e5](https://github.com/ghiscoding/slickgrid-universal/commit/05402e5b3a4cec9306ed21a495cc89c31b3816d8)) - by @ghiscoding

* **formatters:** add Currency Formatter and GroupTotalFormatter ([#850](https://github.com/ghiscoding/slickgrid-universal/issues/850)) ([ad373ab](https://github.com/ghiscoding/slickgrid-universal/commit/ad373abd84468367d43bf4fa0feccb99ae22821c)) - by @ghiscoding

## [2.1.3](https://github.com/ghiscoding/slickgrid-universal/compare/v2.1.2...v2.1.3) (2022-12-08)

### Bug Fixes

* **common:** Date Sorting was shuffling other lines with same dates ([#831](https://github.com/ghiscoding/slickgrid-universal/issues/831)) ([db34213](https://github.com/ghiscoding/slickgrid-universal/commit/db34213bc8594ae12a6fd241f9fb6d6bfd1b8334)) - by @ghiscoding

* **common:** Resizer Service should only resize grid not its container ([#833](https://github.com/ghiscoding/slickgrid-universal/issues/833)) ([7d21233](https://github.com/ghiscoding/slickgrid-universal/commit/7d21233deb16a1bda99799fe54401a8b9410197a)) - by @ghiscoding

* Fix for page being cleared when using copy and paste with selectEditor ([#836](https://github.com/ghiscoding/slickgrid-universal/pull/836)) ([f1cadb33](https://github.com/ghiscoding/slickgrid-universal/commit/f1cadb33d99bcd98bc3c79221fbe55a5b1d72cfd)) - by @austinsimpson

## [2.1.2](https://github.com/ghiscoding/slickgrid-universal/compare/v2.1.1...v2.1.2) (2022-12-02)

### Bug Fixes

* **addons:** do not add special columns twice (like Row Selection) ([#822](https://github.com/ghiscoding/slickgrid-universal/issues/822)) ([a80d6f8](https://github.com/ghiscoding/slickgrid-universal/commit/a80d6f8f2cae674e0a870eb9c450de991cd84837)) - by @ghiscoding

* **addons:** onGroupChanged callback should be executed with Draggable ([#826](https://github.com/ghiscoding/slickgrid-universal/issues/826)) ([35c2631](https://github.com/ghiscoding/slickgrid-universal/commit/35c2631feb00a5b2efe6903e9bfdfe5c95df318e)) - by @ghiscoding

* **common:** remove unused console log ([593928a](https://github.com/ghiscoding/slickgrid-universal/commit/593928af8a7e92ecf2a8c67e4cff4c8e5da58468)) - by @ghiscoding

* **core:** grid service `resetGrid` method wasn't always resetting ([#829](https://github.com/ghiscoding/slickgrid-universal/issues/829)) ([1ffc382](https://github.com/ghiscoding/slickgrid-universal/commit/1ffc38265006e8b6e584e6de8f6c4fe53c2e2bf8)) - by @ghiscoding

* **styling:** editor clear button should always be centered ([3e9f330](https://github.com/ghiscoding/slickgrid-universal/commit/3e9f3304dc2b02450e859af27af254fee1fbd650)) - by @ghiscoding

* **styling:** focused compound input box-shadow css ([2c50c47](https://github.com/ghiscoding/slickgrid-universal/commit/2c50c47a76556ae4a6f842c483800d5af90637fc)) - by @ghiscoding

## [2.1.1](https://github.com/ghiscoding/slickgrid-universal/compare/v2.1.0...v2.1.1) (2022-11-19)

### Bug Fixes

* **plugin:** do not show drag group sort when column is not sortable ([#819](https://github.com/ghiscoding/slickgrid-universal/issues/819)) ([049303b](https://github.com/ghiscoding/slickgrid-universal/commit/049303b0f6d085e7d022a2c87572c9ac90082b3e)) - by @ghiscoding

# [2.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v2.0.0...v2.1.0) (2022-11-17)

### Bug Fixes

* **build:** upgrading to TypeScript 4.9 brought new build issue ([#816](https://github.com/ghiscoding/slickgrid-universal/issues/816)) ([4d46d8a](https://github.com/ghiscoding/slickgrid-universal/commit/4d46d8ab251bd78671140f82cb143b973e5422b3)) - by @ghiscoding

* **common:** changing Slider value(s) should update Tooltip instantly ([#800](https://github.com/ghiscoding/slickgrid-universal/issues/800)) ([9c6be27](https://github.com/ghiscoding/slickgrid-universal/commit/9c6be271a956876edaa03be7bf4bda9821840910)) - by @ghiscoding

* **common:** Slider Range should update both number addons ([#803](https://github.com/ghiscoding/slickgrid-universal/issues/803)) ([3cfd84e](https://github.com/ghiscoding/slickgrid-universal/commit/3cfd84e7ec4e45cf6a4896dc6143da1fecb0402c)) - by @ghiscoding

* **deps:** update dependency autocompleter to v7 ([#804](https://github.com/ghiscoding/slickgrid-universal/issues/804)) ([c298646](https://github.com/ghiscoding/slickgrid-universal/commit/c298646fca64059ca3a59a370f870ad4b3a573da)) - by @renovate-bot

* **deps:** update dependency dompurify to ^2.4.1 ([#806](https://github.com/ghiscoding/slickgrid-universal/issues/806)) ([a33d8fb](https://github.com/ghiscoding/slickgrid-universal/commit/a33d8fbf3e48bfa29b9173f9263620e61608fffb)) - by @renovate-bot

* **editors:** disable browser autofill on the Editors.autocompleter ([#776](https://github.com/ghiscoding/slickgrid-universal/issues/776)) ([fd2cf53](https://github.com/ghiscoding/slickgrid-universal/commit/fd2cf535c0bd941203951c665bb3da00f4a4677e)) - by @ghiscoding

* **editors:** Slider editor track not showing after Slider filter change ([#792](https://github.com/ghiscoding/slickgrid-universal/issues/792)) ([2ad02d2](https://github.com/ghiscoding/slickgrid-universal/commit/2ad02d22cfbb2187df62f0ec19b26f828fec57a6)) - by @ghiscoding

* **filters:** changing Slider value should update tooltip value ([#788](https://github.com/ghiscoding/slickgrid-universal/issues/788)) ([509a31d](https://github.com/ghiscoding/slickgrid-universal/commit/509a31d5630689c6c91cc2cef4e87b8dea72a243)) - by @ghiscoding

* **filters:** Slider default operator should be greater or equal (>=) ([#793](https://github.com/ghiscoding/slickgrid-universal/issues/793)) ([b895864](https://github.com/ghiscoding/slickgrid-universal/commit/b895864bc39a415622ac9f2a4b79565aa3d89179)) - by @ghiscoding

* **styling:** new Slider not flexed correctly ([#799](https://github.com/ghiscoding/slickgrid-universal/issues/799)) ([83a86d0](https://github.com/ghiscoding/slickgrid-universal/commit/83a86d0575a47ed3a11ede31af2a8a3a8186fb9d)) - by @ghiscoding

### Features

* **addon:** add group by sorting to SlickDraggableGrouping ([#814](https://github.com/ghiscoding/slickgrid-universal/issues/814)) ([962a756](https://github.com/ghiscoding/slickgrid-universal/commit/962a756fb17476221867c977752e28bd1d74f6db)) - by @ghiscoding

* **common:** add "targetSelector" to onFilterChanged & Grid State ([#813](https://github.com/ghiscoding/slickgrid-universal/issues/813)) ([a25791a](https://github.com/ghiscoding/slickgrid-universal/commit/a25791a5d11b73fd88d80ef8a6f788b27d7390ec)) - by @ghiscoding

* **common:** use editorOptions/filterOptions instead of params ([#798](https://github.com/ghiscoding/slickgrid-universal/issues/798)) ([a3c8b6e](https://github.com/ghiscoding/slickgrid-universal/commit/a3c8b6e48dbe3db7eb154837f15ce10780923b32)) - by @ghiscoding

* **filters:** add "target" prop to `onBeforeSearchChange` ([#796](https://github.com/ghiscoding/slickgrid-universal/issues/796)) ([c4606fd](https://github.com/ghiscoding/slickgrid-universal/commit/c4606fde3cf206f81ab5f83d150cf3ce29cbfe75)) - by @ghiscoding

* **filters:** add back Slider Range filter in pure JS ([#784](https://github.com/ghiscoding/slickgrid-universal/issues/784)) ([b84525c](https://github.com/ghiscoding/slickgrid-universal/commit/b84525c3c087582854e30b386a1015f6ce3156b4)) - by @ghiscoding

* **filters:** add grid option `skipCompoundOperatorFilterWithNullInput` ([#794](https://github.com/ghiscoding/slickgrid-universal/issues/794)) ([617c88d](https://github.com/ghiscoding/slickgrid-universal/commit/617c88d7432c35b8ac0c0f40066a2f55a58b6d35)) - by @ghiscoding

* **filters:** add Slider filter track filled track color ([#795](https://github.com/ghiscoding/slickgrid-universal/issues/795)) ([5fbd9c9](https://github.com/ghiscoding/slickgrid-universal/commit/5fbd9c9036844e7e88a99fea6a4d1e1f0fd2377a)) - by @ghiscoding

* **plugins:** sync column definitions to user after plugin adds column ([#781](https://github.com/ghiscoding/slickgrid-universal/issues/781)) ([0755b65](https://github.com/ghiscoding/slickgrid-universal/commit/0755b655b7be5911345334e094544a14c3698b51)) - by @ghiscoding

* **tooltip:** add a new "center" position option to SlickCustomTooltip ([#787](https://github.com/ghiscoding/slickgrid-universal/issues/787)) ([b019de5](https://github.com/ghiscoding/slickgrid-universal/commit/b019de50244836a984314ea6e6f5cee639551438)) - by @ghiscoding

### Performance Improvements

* **filters:** merge all date range & compound filters into one class ([#812](https://github.com/ghiscoding/slickgrid-universal/issues/812)) ([ca9adfa](https://github.com/ghiscoding/slickgrid-universal/commit/ca9adfae84ca8fd57b61548b1222ade5a8b9c498)) - by @ghiscoding

* **filters:** merge all input & compound filters into one class ([#809](https://github.com/ghiscoding/slickgrid-universal/issues/809)) ([6d08f4d](https://github.com/ghiscoding/slickgrid-universal/commit/6d08f4dc9fc471b316f375d77fa8ae1805dc9b83)) - by @ghiscoding

* **filters:** merge all Slider filters into one class ([#791](https://github.com/ghiscoding/slickgrid-universal/issues/791)) ([fc4304b](https://github.com/ghiscoding/slickgrid-universal/commit/fc4304b3dd47ac10df65f5b8dda9d8ce5aad8ed9)) - by @ghiscoding

# [2.0.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.4.0...v2.0.0) (2022-10-17)

### Bug Fixes

* **deps:** update all non-major dependencies ([#769](https://github.com/ghiscoding/slickgrid-universal/issues/769)) ([4e05a4b](https://github.com/ghiscoding/slickgrid-universal/commit/4e05a4b977c760511fc90903c0f62673859bd65f)) - by @renovate-bot

* **styling:** fix some styling issues with input groups and Firefox ([#750](https://github.com/ghiscoding/slickgrid-universal/issues/750)) ([1aa849e](https://github.com/ghiscoding/slickgrid-universal/commit/1aa849ea81461dc9bbd7b3bc05a092bb14c88be2)) - by @ghiscoding

### Features

* **common:** BREAKING CHANGE replace jQueryUI with SortableJS in common & DraggableGrouping ([#772](https://github.com/ghiscoding/slickgrid-universal/issues/772)) ([a9db2cc](https://github.com/ghiscoding/slickgrid-universal/commit/a9db2cca965adc7871d7e4d050ae8f3653c84bb4)), closes [#752](https://github.com/ghiscoding/slickgrid-universal/issues/752) [#756](https://github.com/ghiscoding/slickgrid-universal/issues/756) - by @ghiscoding

# [2.0.0-alpha.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.4.0...v2.0.0-alpha.0) (2022-10-15)

### Bug Fixes

* **deps:** update all non-major dependencies ([#769](https://github.com/ghiscoding/slickgrid-universal/issues/769)) ([4e05a4b](https://github.com/ghiscoding/slickgrid-universal/commit/4e05a4b977c760511fc90903c0f62673859bd65f)) - by @renovate-bot

* **styling:** fix some styling issues with input groups and Firefox ([#750](https://github.com/ghiscoding/slickgrid-universal/issues/750)) ([1aa849e](https://github.com/ghiscoding/slickgrid-universal/commit/1aa849ea81461dc9bbd7b3bc05a092bb14c88be2)) - by @ghiscoding

### Features

* **common:** replace jQueryUI Autocomplete with Kradeen Autocomplete ([#752](https://github.com/ghiscoding/slickgrid-universal/issues/752)) ([991d29c](https://github.com/ghiscoding/slickgrid-universal/commit/991d29c4c8c85d800d69c4ba16d608d7a20d2a90)) - by @ghiscoding

# [1.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.7...v1.4.0) (2022-08-15)

### Bug Fixes

* **common:** duplicate translation namespace prefix, fixes [#738](https://github.com/ghiscoding/slickgrid-universal/issues/738) ([#739](https://github.com/ghiscoding/slickgrid-universal/issues/739)) ([ed6b0cc](https://github.com/ghiscoding/slickgrid-universal/commit/ed6b0cc4f664e27830357ac45d523d0571c94bce)) - by @someusersomeuser

* **deps:** update all non-major dependencies ([#740](https://github.com/ghiscoding/slickgrid-universal/issues/740)) ([c8acb65](https://github.com/ghiscoding/slickgrid-universal/commit/c8acb6542a768b2a2b4e0ea0e1f71533d7077927)) - by @renovate-bot

* **filters:** fetch API isn't always an instance of Response ([#746](https://github.com/ghiscoding/slickgrid-universal/issues/746)) ([11be5c2](https://github.com/ghiscoding/slickgrid-universal/commit/11be5c2f9554c8fad2b984864ec7180698d02d19)), closes [#744](https://github.com/ghiscoding/slickgrid-universal/issues/744) - by @ghiscoding

### Features

* **common:** remove jquery-ui-dist from deps, use jquery-ui only ([#733](https://github.com/ghiscoding/slickgrid-universal/issues/733)) ([b89d1f1](https://github.com/ghiscoding/slickgrid-universal/commit/b89d1f169bfde21d8a46520aed580c12db5f668f)) - by @ghiscoding

* **common:** update title prop on change event for Slider Filter/Editor ([#743](https://github.com/ghiscoding/slickgrid-universal/issues/743)) ([0ca6f3f](https://github.com/ghiscoding/slickgrid-universal/commit/0ca6f3f4d8894d4bb9459cabca9a3492e7cca0ad)) - by @ghiscoding

## [1.3.7](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.6...v1.3.7) (2022-08-02)

### Bug Fixes

* **service:** should be able to update dataview item not shown in grid ([#730](https://github.com/ghiscoding/slickgrid-universal/issues/730)) ([dc88c87](https://github.com/ghiscoding/slickgrid-universal/commit/dc88c870e046e904b160546239ab2d403237d98a)) - by @ghiscoding

## [1.3.5](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.4...v1.3.5) (2022-07-28)

### Bug Fixes

* **build:** use `workspace:~` to avoid multiple versions d/l on ext libs ([3ca1943](https://github.com/ghiscoding/slickgrid-universal/commit/3ca1943f1247e66d3213fb5edeed7e7246032767)) - by @ghiscoding

## [1.3.4](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.3...v1.3.4) (2022-07-28)

### Bug Fixes

* **deps:** update dependency jquery-ui to ^1.13.2 ([#720](https://github.com/ghiscoding/slickgrid-universal/issues/720)) ([8351f14](https://github.com/ghiscoding/slickgrid-universal/commit/8351f144192ec5e91ad52678787a448cf42f975f)) - by @renovate-bot

## [1.3.3](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.2...v1.3.3) (2022-07-07)

### Bug Fixes

* **common:** remove dispose method from container service abstract class ([838fc54](https://github.com/ghiscoding/slickgrid-universal/commit/838fc54f72782aa5187644a134063a125c01e12e))

## [1.3.2](https://github.com/ghiscoding/slickgrid-universal/compare/v1.3.0...v1.3.2) (2022-07-06)

### Bug Fixes

* **composite:** selected row count always 0 on mass-selected ([#712](https://github.com/ghiscoding/slickgrid-universal/issues/712)) ([ec42dc7](https://github.com/ghiscoding/slickgrid-universal/commit/ec42dc753fbf8c84040e252f328e51ea4a98cedf))

* **deps:** update all non-major dependencies ([230291c](https://github.com/ghiscoding/slickgrid-universal/commit/230291c94506fdd12e7f843a3d7f324922ef97f6))

# [1.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.6...v1.3.0) (2022-06-18)

### Bug Fixes

* **deps:** add missing dependencies in child package ([97d0230](https://github.com/ghiscoding/slickgrid-universal/commit/97d02306899e583779c3b6d5b219b2798a5f9cfd))

* **deps:** update all non-major dependencies ([5097cea](https://github.com/ghiscoding/slickgrid-universal/commit/5097ceae88c0ea212e0aa6ea2a5b1020368f3216))

### Features

* **core:** upgrade to jQuery 3.6 and jQuery-UI 1.13 ([84b09dc](https://github.com/ghiscoding/slickgrid-universal/commit/84b09dc8ba7c78c14e0ae563cd560eec46973a4b))

## [1.2.6](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.5...v1.2.6) (2022-03-19)

### Bug Fixes

* **core:** use latest Flatpickr version to fix leak in it ([0f68f51](https://github.com/ghiscoding/slickgrid-universal/commit/0f68f5131e227abfaf2dcaa790dda53a235d95fe))

## [1.2.5](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.4...v1.2.5) (2022-03-06)

### Bug Fixes

* **utilities:** check if the normalize function exists ([00c1c92](https://github.com/ghiscoding/slickgrid-universal/commit/00c1c9255165ff31cbab444d9bfc06818765bcd5))

## [1.2.4](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.3...v1.2.4) (2022-02-15)

### Bug Fixes

* **core:** rollback node/npm minimum engine versions ([7fcaecd](https://github.com/ghiscoding/slickgrid-universal/commit/7fcaecdf5087e1414037832962ec9ea5365aca41))

## [1.2.3](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.1...v1.2.3) (2022-02-14)

### Bug Fixes

* **editors:** select editor should call save only once ([d111c2f](https://github.com/ghiscoding/slickgrid-universal/commit/d111c2f7799151236c6053d7a5288d1fdd530550))

* **resizer:** use default resize when resizeByContent has no data ([8499b61](https://github.com/ghiscoding/slickgrid-universal/commit/8499b61b5cc6365af0035d254a9487c79b74bd7f))

* **selections:** selected rows doesn't update when hidden column shown ([0d1cf29](https://github.com/ghiscoding/slickgrid-universal/commit/0d1cf294e8ae944672a9c9a2cece1de553c2f973)), closes [#661](https://github.com/ghiscoding/slickgrid-universal/issues/661)

* **styling:** add pointer cursor on ms-filter, avoid Bootstrap override ([11e1e12](https://github.com/ghiscoding/slickgrid-universal/commit/11e1e12115896e73096e10b34575e4e8ebe5b819))

## [1.2.1](https://github.com/ghiscoding/slickgrid-universal/compare/v1.2.0...v1.2.1) (2022-01-18)

### Bug Fixes

* **memory:** clear & dispose of grid to avoid mem leaks & detached elm ([7035db5](https://github.com/ghiscoding/slickgrid-universal/commit/7035db5f878187f6fb8b9d2effacb7443f25e2c9))

# [1.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/v1.1.1...v1.2.0) (2022-01-06)

### Bug Fixes

* **demo:** latest change with Filter container breaks other demos ([129cc78](https://github.com/ghiscoding/slickgrid-universal/commit/129cc78ac34ad632f2a265d49a631e04b119250b))

* **filter:** add the "filled" class for styling purposes ([ea7974a](https://github.com/ghiscoding/slickgrid-universal/commit/ea7974a9a7d54150c16d22ccb8008c692faf6132))

* **filter:** add the "filled" class for styling purposes -  better code ([4a650cd](https://github.com/ghiscoding/slickgrid-universal/commit/4a650cd269852ab20088b274939e89b2cfc96ec8))

* **filter:** add the "filled" class for styling purposes - ajust code format ([abe481e](https://github.com/ghiscoding/slickgrid-universal/commit/abe481e0cd11bfe204399814c1be0eeb66d3f91a))

* **filter:** add the "filled" class for styling purposes - ajust format ([fc8c899](https://github.com/ghiscoding/slickgrid-universal/commit/fc8c8992381b001d6ada449352d7b66c6ca08e00))

* **filter:** update multiple-select to fix select filtering ([63dcd08](https://github.com/ghiscoding/slickgrid-universal/commit/63dcd0873026fb8ba036ca52ba31f583d6ad136f)), closes [#865](https://github.com/ghiscoding/slickgrid-universal/issues/865)

* **plugins:** Draggable Grouping Toggle All should follow `collapsed` ([7fedfa1](https://github.com/ghiscoding/slickgrid-universal/commit/7fedfa1129e12a3bf665efe0bd9160b6a7a1b6a9))

* **services:** unsubscribe shouldn't remove when poping out of array ([e841da9](https://github.com/ghiscoding/slickgrid-universal/commit/e841da9df7a23bf7b789e4a13803488ab479ff15))

### Features

* **binding:** make Binding Service a little smarter ([98a7661](https://github.com/ghiscoding/slickgrid-universal/commit/98a766173638246b6a17e31812929a9bba1eb52b))

* **composite:** add new `validateMassUpdateChange` callback & bug fixes ([#603](https://github.com/ghiscoding/slickgrid-universal/issues/603)) ([2c1559b](https://github.com/ghiscoding/slickgrid-universal/commit/2c1559b7a3b0b1a642a664e59a025ce78a747946))

* **demo:** add new Example to demo Real-time Market Trading ([e50434a](https://github.com/ghiscoding/slickgrid-universal/commit/e50434ac3dab98644e23266c81d09b3789ea7de4))

* **filters:** change-filter-element-Container ([31c6e54](https://github.com/ghiscoding/slickgrid-universal/commit/31c6e54a3b2e0d135d8407c74b7bfa329a85e0c5))

* **filters:** change-filter-element-Container ([d455d27](https://github.com/ghiscoding/slickgrid-universal/commit/d455d2781f19fc9865600b6123f679ab3526cf04))

* **filters:** change-filter-element-Container ([704c52a](https://github.com/ghiscoding/slickgrid-universal/commit/704c52a1d5dec9fedbe837ceca41b96a0d673061))

* **filters:** change-filter-element-Container-ajust-code-format ([efb0189](https://github.com/ghiscoding/slickgrid-universal/commit/efb0189b0ce357b07025e2f9f29717a41128ab6b))

* **filters:** change-filter-element-Container-ajust-test ([268ccb4](https://github.com/ghiscoding/slickgrid-universal/commit/268ccb4d6be916959f2eadd87d7c506dff1df472))

* **filters:** change-filter-element-Container-test ([61e29c5](https://github.com/ghiscoding/slickgrid-universal/commit/61e29c5851487f7470e6f631c890c346f07ed242))

* **plugins:** Apply auto scroll when dragging on RowMoveManager plugin ([1c14a4f](https://github.com/ghiscoding/slickgrid-universal/commit/1c14a4fd06693425be52e91f405d1c8739699627)), closes [#662](https://github.com/ghiscoding/slickgrid-universal/issues/662)

* **selection:** auto-scroll the viewport when dragging with selection ([ecd9c57](https://github.com/ghiscoding/slickgrid-universal/commit/ecd9c57bd6c1315e2358722785a87582ec939f85)), closes [#656](https://github.com/ghiscoding/slickgrid-universal/issues/656)

* **services:** add `skipError` to CRUD methods in Grid Service ([869ed87](https://github.com/ghiscoding/slickgrid-universal/commit/869ed87bfa4e60d089138bcba1da5f4bb120e73b))

* **services:** add extra features to EventPubSub Service ([9bd02b5](https://github.com/ghiscoding/slickgrid-universal/commit/9bd02b5d92bcf6aaf89a828c4e6496a24e795c53))

# [1.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.19.2...v1.1.0) (2021-12-11)

### Bug Fixes

* **build:** add DOM purify optional default import to fix rollup builds ([73bc3c0](https://github.com/ghiscoding/slickgrid-universal/commit/73bc3c0756cf6d28b292f0162afffc06412a126e))

* **build:** DOMPurify import fix for all framework ([c551d0c](https://github.com/ghiscoding/slickgrid-universal/commit/c551d0c64d4c7325578acf4feb5d22132c7d7f91))

* **comp:** replace `prepend` not supported in IE/Salesforce ([13bd9a4](https://github.com/ghiscoding/slickgrid-universal/commit/13bd9a4f8c4fdaedccc65db7100527be0e84eb00))

* **context:** remove fixed width on ContextMenu use auto instead ([403679b](https://github.com/ghiscoding/slickgrid-universal/commit/403679be5ca8547b53ed2525a4017923302afae7))

* **context:** strip hidden special chars on context menu Copy command ([5d81644](https://github.com/ghiscoding/slickgrid-universal/commit/5d81644a194b66e7fb5efc550a08962d8087f0e3))

* **context:** strip hidden special chars on context menu Copy command ([f94ca83](https://github.com/ghiscoding/slickgrid-universal/commit/f94ca834b1fdee94e4e44bdc3d245956a4437de6))

* **filters:** remove Filters from DOM after header row gets destroyed ([3f08162](https://github.com/ghiscoding/slickgrid-universal/commit/3f08162cd8b5fbb407c77b6dc441e60239ba5788))

* **locales:** add missing text & remove global config texts fix Locales ([655a872](https://github.com/ghiscoding/slickgrid-universal/commit/655a872d7160ab53530f8e2fdc575817af782b5d))

* **plugin:** Copy command from Context Menu should work with numbers ([9d36491](https://github.com/ghiscoding/slickgrid-universal/commit/9d36491c407beb0fdc53588ffc6264306fab607a))

* **plugin:** providing usability override via grid option should work ([6446a10](https://github.com/ghiscoding/slickgrid-universal/commit/6446a1061d7d0126cfe655518b7179d93356aa83)), closes [#555](https://github.com/ghiscoding/slickgrid-universal/issues/555)

* **plugins:** remove invalid export for build to work ([9353022](https://github.com/ghiscoding/slickgrid-universal/commit/9353022593ba9b16e34a8b3dd3ad62bc5b5e7569))

* **styling:** better support of auto width on drop menu ([8a48dd2](https://github.com/ghiscoding/slickgrid-universal/commit/8a48dd2a224c757534a631e88a4864e151496438))

* **styling:** Grid Menu Title not aligned correctly with Bootstrap ([e2b991f](https://github.com/ghiscoding/slickgrid-universal/commit/e2b991fb05b8ca94e5a0e3986aabaefc7bc245fb))

* **styling:** slightly off Autocomplete position ([cd03f67](https://github.com/ghiscoding/slickgrid-universal/commit/cd03f67f50db301cfe74a1e20efd998102bcf3bf))

* **styling:** tweak & fix all styling with Salesforce & other frameworks ([86dbb76](https://github.com/ghiscoding/slickgrid-universal/commit/86dbb76b439a99773a3fe6fd154440eacb20d510))

* **tree:** reset to initial tree sort when calling "Clear all Sorting" ([8bd3f4f](https://github.com/ghiscoding/slickgrid-universal/commit/8bd3f4f68247681f8eb57e7aabd59b636face7e7))

* **treeGrid:** Bug in onCellClick event ([42155af](https://github.com/ghiscoding/slickgrid-universal/commit/42155af12b0808fc95d5f1c00fcec9bfaef64c44))

* apply fixes & refactoring after testing in Aurelia-Slickgrid ([038fa3f](https://github.com/ghiscoding/slickgrid-universal/commit/038fa3f56f202465f2b40af57e8acf752fe31f60))

* switch normal/frozen should always show Grid Menu on far right ([6bef090](https://github.com/ghiscoding/slickgrid-universal/commit/6bef0901652a2bdbf661cf5a0fc0d9a7c325a44a))

* translation wasn't working with context menu ([889e443](https://github.com/ghiscoding/slickgrid-universal/commit/889e44387279c7834944600417c0c2da11b7991f))

### Features

* **controls:** add `minHeight` option to ColumnPicker/GridMenu ([cfcfc85](https://github.com/ghiscoding/slickgrid-universal/commit/cfcfc8588b854530425f2bea19e8aa7c5256d059))

* **controls:** convert and add ColumnPicker into Slickgrid-Universal ([1f937b9](https://github.com/ghiscoding/slickgrid-universal/commit/1f937b9a3abe43cf1a2bb1f52ba625c34431e328))

* **controls:** move external Grid Menu into Slickgrid-Universal ([40adff4](https://github.com/ghiscoding/slickgrid-universal/commit/40adff49c2a74769823dfbed3d32b239608e2a59))

* **core:** add TS utility to infer extension instance by name ([3f4f65f](https://github.com/ghiscoding/slickgrid-universal/commit/3f4f65fb1c4f01cddca0e356a0a770b575a7384a))

* **plugins:** add all Cell Range/Selection plugins into Universal ([3b4ddca](https://github.com/ghiscoding/slickgrid-universal/commit/3b4ddcaff6e2e8db5804b995ff2282f306cc1a7a))

* **plugins:** add extra callback methods to checkbox selector ([#570](https://github.com/ghiscoding/slickgrid-universal/issues/570)) ([a9245f9](https://github.com/ghiscoding/slickgrid-universal/commit/a9245f920397bab0ef5105404babe8443654785c))

* **plugins:** add Row Detail plugin final code & tests ([045ea6d](https://github.com/ghiscoding/slickgrid-universal/commit/045ea6d0e49e55163edcbe1ec6e796f51349667b))

* **plugins:** make it possible to use both Header Button/Menu together ([965bd58](https://github.com/ghiscoding/slickgrid-universal/commit/965bd588aeba7528031f309020bdfd3c611ebeab))

* **plugins:** move Checkbox and Row Selection plugins to universal ([06f0ab1](https://github.com/ghiscoding/slickgrid-universal/commit/06f0ab155a2f0ee06681d3e94780397c5e4f9f67))

* **plugins:** move external Cell Menu into Slickgrid-Universal ([6f34c10](https://github.com/ghiscoding/slickgrid-universal/commit/6f34c10b9a8522ae430e13c9519083451bf71ebf))

* **plugins:** move external cell related plugins to universal ([11e15d8](https://github.com/ghiscoding/slickgrid-universal/commit/11e15d88360b7b30ca7ab94624a7928201f15945))

* **plugins:** move external Context Menu into Slickgrid-Universal ([2170bb4](https://github.com/ghiscoding/slickgrid-universal/commit/2170bb4e3f02ef6f45ad13a1c59730047942651e))

* **plugins:** move external Draggable Grouping into Slickgrid-Universal ([8e6eb48](https://github.com/ghiscoding/slickgrid-universal/commit/8e6eb4881741313b7d582d2e3d17ffef582ecb35))

* **plugins:** move external GroupItemMetataProvider into Universal ([8f18c7d](https://github.com/ghiscoding/slickgrid-universal/commit/8f18c7d3d616e4cd72eb5478d544ec241c53154f))

* **plugins:** move external Header Button into Slickgrid-Universal ([69711ad](https://github.com/ghiscoding/slickgrid-universal/commit/69711aded5aa835091789800214f82cd7c72753e))

* **plugins:** move external Header Menu into Slickgrid-Universal ([aeba480](https://github.com/ghiscoding/slickgrid-universal/commit/aeba4801fdb5cba3976984f5c591be8c1ad97e4b))

* **plugins:** move Row Detail View plugin to universal ([9700ff4](https://github.com/ghiscoding/slickgrid-universal/commit/9700ff49132e9408b808f916f634976d80e12579))

* **plugins:** move Row Detail View plugin to universal ([fb327a6](https://github.com/ghiscoding/slickgrid-universal/commit/fb327a6abe85b86683572cde2a550de43a01f9e1))

* **plugins:** move Row Move Manager plugin to universal ([b19b2ed](https://github.com/ghiscoding/slickgrid-universal/commit/b19b2ed2da669662fbbdcf9fdefac243132909b2))

* **plugins:** replace AutoTooltips Extension by plugin ([80df14d](https://github.com/ghiscoding/slickgrid-universal/commit/80df14da9b66e9e1b8314e5adb1b96890cc7baa1))

* **plugins:** show bullet when command menu icon missing ([cbe580a](https://github.com/ghiscoding/slickgrid-universal/commit/cbe580a97313b7b90e287586b4a6420f0a983f20))

* **selection:** add `caller` property to `onSelectedRowsChanged` event ([cc5f4ae](https://github.com/ghiscoding/slickgrid-universal/commit/cc5f4aec7334b6d001bde55dacf83722c3b2763b))

* **utils:** replace ext lib `assign-deep` by local `deepMerge` util ([2f56bd3](https://github.com/ghiscoding/slickgrid-universal/commit/2f56bd3571d9c5fb689a09d21cfb3813f5b70e89))

## [0.19.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.19.1...v0.19.2) (2021-11-19)

### Bug Fixes

* **build:** add DOM purify optional default import to fix rollup builds ([3bd335d](https://github.com/ghiscoding/slickgrid-universal/commit/3bd335dd62d0829c1581ca0fde560c93dcd84458))

* **resizer:** use autosize width when total width smaller than viewport ([555fb0c](https://github.com/ghiscoding/slickgrid-universal/commit/555fb0cb793c111de837ffe6e9f212fcbf5ed701))

* **translation:** add new UNFREEZE_COLUMNS to fix translation ([0010861](https://github.com/ghiscoding/slickgrid-universal/commit/001086165434f619f1e90f664e2185b77fb6a92e))

* **translation:** add new UNFREEZE_COLUMNS to fix translation ([22ed231](https://github.com/ghiscoding/slickgrid-universal/commit/22ed2313c45587f2ebdb279c9e47df881c6f83d6))

## [0.19.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.19.0...v0.19.1) (2021-11-15)

### Bug Fixes

* **context:** strin hidden special chars on context menu Copy command ([221c05d](https://github.com/ghiscoding/slickgrid-universal/commit/221c05d8d6345d090074c92e423071888e4a2686))

* **context:** when copying use opacity 0 on temp element ([3f0896f](https://github.com/ghiscoding/slickgrid-universal/commit/3f0896fab30aa5a3da278912f00272ce434b8c15))

* **subscriptions:** unsubscribe every subcriptions while disposing comp ([bf0dcd4](https://github.com/ghiscoding/slickgrid-universal/commit/bf0dcd4963171b703f07e705aac7230402c84dbf))

* **tree:**  reset to initial tree sort when calling "Clear all Sorting" ([984e3a7](https://github.com/ghiscoding/slickgrid-universal/commit/984e3a7bf0bf734f035514d32d44c6164c6fdab1))

# [0.19.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.18.0...v0.19.0) (2021-10-28)

### Bug Fixes

* make it work with AutoTooltip and extra option to skip it ([2f7e4c5](https://github.com/ghiscoding/slickgrid-universal/commit/2f7e4c502471c236a76510905ddbf07f653ea5d8))

* **frozen:** calling `setPinning` with empty object/null should clear it ([48b11f7](https://github.com/ghiscoding/slickgrid-universal/commit/48b11f74f2ce6541b6e6e03bf7fe194e5be96d0e))

* **style:** remove unnecessary css source map ([4e6fc08](https://github.com/ghiscoding/slickgrid-universal/commit/4e6fc085abe19389d28bf7a8cea3f83859582bdc))

* **styling:** cleanup CSS files to ship smaller bundle ([69b18bf](https://github.com/ghiscoding/slickgrid-universal/commit/69b18bf3505fc5538de878b7dbf33104faa8b11a))

* **tree:** Grid State should have Tree Data initial sort ([b24ce40](https://github.com/ghiscoding/slickgrid-universal/commit/b24ce4032ea671aa6de6d8e2bb8b045359fd897b))

* **tree:** use previous state when refreshing dataset afterward ([0982474](https://github.com/ghiscoding/slickgrid-universal/commit/09824741be404d3d05ccff4417f243c4b1c5c113))

### Features

* **plugin:** add row move shadown item while moving/dragging row ([c665ec8](https://github.com/ghiscoding/slickgrid-universal/commit/c665ec88be859feeea89e5ab8826f2b0a57c5cfb))

* add async process to use with Promise/Observable ([7350a6d](https://github.com/ghiscoding/slickgrid-universal/commit/7350a6d06ef5bb8495a05e22421f9b7b5a4270cb))

* add auto-position depending on available space ([82d6134](https://github.com/ghiscoding/slickgrid-universal/commit/82d6134003900ca8e345bd02a35e3830476638e3))

* **plugin:** create new Custom Tooltip plugin ([4c8c4f6](https://github.com/ghiscoding/slickgrid-universal/commit/4c8c4f62423665bc2e1dcf0675b1300607397b6a))

# [0.18.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.17.0...v0.18.0) (2021-09-29)

### Bug Fixes

* **context:** Copy Cell via Context Menu shouldn't include Tree symbols ([f710084](https://github.com/ghiscoding/slickgrid-universal/commit/f710084c06cd47d900daccd389de131209e19163))

* **filters:** css "filled" class on filters should also work w/Grid View ([e8edae7](https://github.com/ghiscoding/slickgrid-universal/commit/e8edae79bcd5c28438203e269d26f107e26c4ae5))

* **resizer:** clear pending resizeGrid on dispose ([07ed6a0](https://github.com/ghiscoding/slickgrid-universal/commit/07ed6a0390f235341b116d981aa4ee84719b029b))

* **resizer:** only bind autoresize when enabled ([ca894c0](https://github.com/ghiscoding/slickgrid-universal/commit/ca894c0a83b5762a42b703f28fc59bdb38e01944))

* **styling:** List bullets shouldn't show in any frameworks, fixes [#487](https://github.com/ghiscoding/slickgrid-universal/issues/487) ([53ea537](https://github.com/ghiscoding/slickgrid-universal/commit/53ea5379c6109383630362717b980a1dbe099681))

* **tree:** when Tree Data is filtered then Sort, footer count is invalid ([4f5fc44](https://github.com/ghiscoding/slickgrid-universal/commit/4f5fc443fbc7a0ab3cbe46722fc6bd85fd4b1594))

### Features

* **context:** expose 3 events for Tree/Grouping clear/collapse/expand ([317f3ad](https://github.com/ghiscoding/slickgrid-universal/commit/317f3ad443f8ac81c7cacacaec6d38553bec147b))

* **Resizer:** add useResizeObserver option ([bb33cdd](https://github.com/ghiscoding/slickgrid-universal/commit/bb33cdd716834913846ab2fcf74a84f8424acf92))

* **sorts:** option to ignore accent while sorting text ([1b4fe81](https://github.com/ghiscoding/slickgrid-universal/commit/1b4fe81d613b780aefcc0ba3e7b16c20eaebd0aa))

* **styling:** increase highlight of filters that are filled w/values ([8f93534](https://github.com/ghiscoding/slickgrid-universal/commit/8f9353418190ee3e11aca65d1a57fa4204331011))

* **tree:** new `excludeChildrenWhenFilteringTree` set as new default ([47df943](https://github.com/ghiscoding/slickgrid-universal/commit/47df943414f383a47062a7ad9245700a1bd8a24e))

# [0.17.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.16.2...v0.17.0) (2021-09-09)

### Bug Fixes

* **filters:** IN_CONTAINS should be sanitized when used with html ([961d8fd](https://github.com/ghiscoding/slickgrid-universal/commit/961d8fd7ea6f915dd8f0749d0329219b82923fea))

* **filters:** remove Filters from DOM after header row gets destroyed ([b08d4ba](https://github.com/ghiscoding/slickgrid-universal/commit/b08d4ba070ec9d9d131d6830e4625e6ef950ac09))

* **grouping:** Draggable Grouping should clear preheader when called ([37811a5](https://github.com/ghiscoding/slickgrid-universal/commit/37811a51d2af04e78aedc88ff5d8eae8a622ac40))

* **resizer:** regression introduced by [#462](https://github.com/ghiscoding/slickgrid-universal/issues/462) for the grid resize in SF ([f34d8b9](https://github.com/ghiscoding/slickgrid-universal/commit/f34d8b9678c7ee9e76534a7f7ffdf2c4d7f9f772))

* **resizer:** resizer not always triggered in SF and show broken UI ([89fc62e](https://github.com/ghiscoding/slickgrid-universal/commit/89fc62eff7fac8b5cf43b3b6acd7590ed84288f6))

* **state:** don't use previous columns ref when getting current cols ([f312c60](https://github.com/ghiscoding/slickgrid-universal/commit/f312c60349d5bc95527ec93cb752f449d1c761f7))

* **styling:** add ms-select placeholder bg-color to fix Bootstrap 5 ([2c34d12](https://github.com/ghiscoding/slickgrid-universal/commit/2c34d1229c14bd36bd034062cc7eb7a7cbe1bf5c))

* **styling:** add ms-select placeholder bg-color to fix Bootstrap 5 ([5d6454e](https://github.com/ghiscoding/slickgrid-universal/commit/5d6454e9f175b8694f372a7e26492ae573eb918f))

### Features

* **aggregators:** add better TS typing for all Aggregators ([1518d6a](https://github.com/ghiscoding/slickgrid-universal/commit/1518d6aef194f184390316f8421f51d23a1d470a))

* **backend:** add cancellable onBeforeSearchChange & revert on error ([b26a53d](https://github.com/ghiscoding/slickgrid-universal/commit/b26a53d2e1fc7172c8c054b9c27ab1b3a2d3dff6))

* **backend:** add cancellable onBeforeSort & revert sort on error ([958f823](https://github.com/ghiscoding/slickgrid-universal/commit/958f823a6bffedc2c146c7c68d49a29419812995))

* **backend:** add cancellable Pagination change & revert on error ([7a8d903](https://github.com/ghiscoding/slickgrid-universal/commit/7a8d9038f230ba433f2773c02992a211a322ebd4))

* **composite:** move SlickGrid Composite Editor factory into universal ([c813cea](https://github.com/ghiscoding/slickgrid-universal/commit/c813ceac1ed6535963df15e7933a444de3a8790a))

* **editors:** add Ctrl+S combo to enhance LongText (textarea) Editor ([5116bbd](https://github.com/ghiscoding/slickgrid-universal/commit/5116bbd9e837a3bbd9835b10b2167edf3561cd3d))

* **filters:** option to ignore accent while filtering text, closes [#470](https://github.com/ghiscoding/slickgrid-universal/issues/470) ([cba9a4e](https://github.com/ghiscoding/slickgrid-universal/commit/cba9a4e4d12b6dfaaec06af5edf4c629b2943feb))

* **sanitize:** make sure any string sent to innerHtml are sanitized ([fe55046](https://github.com/ghiscoding/slickgrid-universal/commit/fe550461d27d01cb5c54d93812db82fa7213f96b))

* **styling:** only show header menu caret when hovering ([41e7856](https://github.com/ghiscoding/slickgrid-universal/commit/41e7856f9483f7228d1455f2e3810ae58a5f5c8d))

* **tree:** add `dynamicallyToggledItemState` method to toggle parent(s) ([26369f9](https://github.com/ghiscoding/slickgrid-universal/commit/26369f9b6c9e81ad5705f580896ab28cf362d090))

## [0.16.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.16.1...v0.16.2) (2021-07-23)

### Bug Fixes

* **formatters:** Complex Object Formatter shouldn't throw with null data ([3421465](https://github.com/ghiscoding/slickgrid-universal/commit/342146557c16b560b5b8ef0f0e47f971179bc765))

* **tree:** exclude the correct type from interface argument ([af51784](https://github.com/ghiscoding/slickgrid-universal/commit/af51784aa3471dcc88c567f4c3762ab7590184f6))

## [0.16.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.16.0...v0.16.1) (2021-07-16)

### Bug Fixes

* **filters:** startsWith/endsWith operator should work ([f99f1c5](https://github.com/ghiscoding/slickgrid-universal/commit/f99f1c56c27b3e192b829b83a5fde6aad9efc3e7))

# [0.16.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.15.0...v0.16.0) (2021-07-16)

### Bug Fixes

* **filter:** refreshTreeDataFilters only when Tree is enabled ([07c70d5](https://github.com/ghiscoding/slickgrid-universal/commit/07c70d5d17dab464cefb1046c72abbd41da4c834))

* **filters:** always find locale  even without TranslaterService ([c4b17c4](https://github.com/ghiscoding/slickgrid-universal/commit/c4b17c4f51ba6f80b907dab0fd0493a8b0944908))

* **styling:** remove css variable on width causing UX problem ([df69f9c](https://github.com/ghiscoding/slickgrid-universal/commit/df69f9c33604187f91adaf5bb8b43b6abd624d32))

### Features

* **aria:** add aria-label to all Editors/Filters & other html templates ([1a4f8f7](https://github.com/ghiscoding/slickgrid-universal/commit/1a4f8f7873d76b7da5a7d38debed598d3d395c10))

* make constructor arguments as readonly ([a4588ea](https://github.com/ghiscoding/slickgrid-universal/commit/a4588ea5722ae44b647b8c0d02cf8e2a60ff5963))

* **services:** make everything extendable by using `protected` ([ecbb93a](https://github.com/ghiscoding/slickgrid-universal/commit/ecbb93a56abba39dd050bbd6019b86694495edd1))

* **styling:** add support for CSS Variables ([674dd1a](https://github.com/ghiscoding/slickgrid-universal/commit/674dd1a064d4d42af1d5841ac87ba8ea35a26b2f))

# [0.15.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.14.1...v0.15.0) (2021-07-06)

### Bug Fixes

* **addon:** providing columnIndexPosition should always work ([42c8cff](https://github.com/ghiscoding/slickgrid-universal/commit/42c8cff7dd6cf9103149445969be289710549590))

* **demo:** we should be able to move row(s) and keep selections ([d5669a1](https://github.com/ghiscoding/slickgrid-universal/commit/d5669a1d9c07680540d084dad6e1ef06faca0357))

* **editors:** longText Editor (textarea) was scrolling to page bottom ([a4e37a0](https://github.com/ghiscoding/slickgrid-universal/commit/a4e37a0baf329a100f72fe12c35af67fa072829a))

* **editors:** select dropdown value is undefined it shouldn't call save ([015294b](https://github.com/ghiscoding/slickgrid-universal/commit/015294b86e431e8109ce540dda7856b7e9e27575))

* **filters:** filtering with IN_CONTAINS should also work with spaces ([ab54724](https://github.com/ghiscoding/slickgrid-universal/commit/ab5472437b94fe81270f809ab6fd00f204c688b8))

* **frozen:** in some occasion column pinning changes column positions ([70cb74e](https://github.com/ghiscoding/slickgrid-universal/commit/70cb74ef1119a60b37d438130d4a463a87a8939a))

* **menu:** toggle filter bar could be out of sync w/horizontal scroll ([ab7f589](https://github.com/ghiscoding/slickgrid-universal/commit/ab7f58929b10d1b250765b707363aedd9f9d7866))

* **pagination:** should be able to toggle Pagination ([c0367c2](https://github.com/ghiscoding/slickgrid-universal/commit/c0367c24da2ccb3558e1b27f8e70a81d84201479))

* **plugin:** row move shouldn't go further when onBefore returns false ([e9bfb5c](https://github.com/ghiscoding/slickgrid-universal/commit/e9bfb5ceba6a18a020b8b34f72abba6e3d13d8b8))

* **resizer:** few fixes & adjustments after trying in SF ([32e80ec](https://github.com/ghiscoding/slickgrid-universal/commit/32e80ecdbc5072c1619593d101289a3c1ea92b3a))

* **services:** toggle pagination was not displaying all row selection ([e51ccb4](https://github.com/ghiscoding/slickgrid-universal/commit/e51ccb4352bf3a578159b8b63f0a6caf891c382a))

* **state:** changeColumnsArrangement should work w/columnIndexPosition ([7c1e9d3](https://github.com/ghiscoding/slickgrid-universal/commit/7c1e9d3d243988d6d99a9696b0afbe8f62ac45b4))

* **state:** Grid View/Columns dynamically should work w/row move ([a7cf1df](https://github.com/ghiscoding/slickgrid-universal/commit/a7cf1dfb73c770908aadf01fd67680c985449f9d))

* **state:** Grid View/Columns dynamically should work w/row selection ([865944f](https://github.com/ghiscoding/slickgrid-universal/commit/865944f5d6aadc0c05c7f83db7c11a569a33118f))

* **styling:** address latest dart-sass math division deprecation warning ([b7317d8](https://github.com/ghiscoding/slickgrid-universal/commit/b7317d8fa619b35fb65789e12b268d65ff65968c))

* **styling:** header title should show ellipsis if too long ([607e14d](https://github.com/ghiscoding/slickgrid-universal/commit/607e14d7fffa4f9854eff5103e1a1a0881664286))

* **tree:** using `initiallyCollapsed` change internal toggled state ([380f2f9](https://github.com/ghiscoding/slickgrid-universal/commit/380f2f903d9908e2bed5b3f44d04e28e5d5b9c63))

* initial grid state should also include toggled presets ([f1fe39f](https://github.com/ghiscoding/slickgrid-universal/commit/f1fe39f5d68487e815be7fd3d7ca5a6fd4cba7c6))

* **tree:** calling updateItems should not lose the Tree collapsing icon ([45b9622](https://github.com/ghiscoding/slickgrid-universal/commit/45b96225dd5a676b6a85bbb2c8146137eb95b33f))

* option labels weren't showing correctly after running Cypress tests ([10d4339](https://github.com/ghiscoding/slickgrid-universal/commit/10d4339da70cce4977707a6a19a79cceb4bf87df))

* provide input type directly in constructor before init() is called ([e89c3bd](https://github.com/ghiscoding/slickgrid-universal/commit/e89c3bd3da66e4b16342cefe1eedd5df96363e45))

### Features

* **components:** extract Custom Footer to be an external component ([1794c27](https://github.com/ghiscoding/slickgrid-universal/commit/1794c27d7669c172f606d709d3360bc5d2f77798))

* **editors:** convert jQuery to native element on slider editor ([3181cf0](https://github.com/ghiscoding/slickgrid-universal/commit/3181cf069d9f3bc85dc0d13ceeb9623d21ae8eff))

* **editors:** replace jQuery with native element on date editor ([062f1f9](https://github.com/ghiscoding/slickgrid-universal/commit/062f1f9713c8f236c30b4d631b601b24b56a530d))

* **editors:** use class inheritance to extend main input editor ([ad3e696](https://github.com/ghiscoding/slickgrid-universal/commit/ad3e6965d4cd4295086401de26b5d3aad13a7650))

* **filters:** build multiple-select options from native dom elements ([aa548a9](https://github.com/ghiscoding/slickgrid-universal/commit/aa548a9bc05da0d4d5233a2633ae3055fd9f7178))

* **filters:** convert jQuery to native element on more filters ([b46eb5e](https://github.com/ghiscoding/slickgrid-universal/commit/b46eb5ebdb177e7d0d6c93cb6df541cedc7eb5d1))

* **filters:** convert jQuery to native elements on multiple filters ([3a80996](https://github.com/ghiscoding/slickgrid-universal/commit/3a80996bec96e465d23a30387af707289f4089e3))

* **footer:** add option to customize right footer text ([2ea41cc](https://github.com/ghiscoding/slickgrid-universal/commit/2ea41cc8ab38ebc5d5276c90de33b57247c4476f))

* **formatters:** add Bootstrap Dropdown Formatter ([5ba9423](https://github.com/ghiscoding/slickgrid-universal/commit/5ba9423200e60460c22f05253901707ef7055782))

* **services:** convert jQuery to native elements ([4da0a20](https://github.com/ghiscoding/slickgrid-universal/commit/4da0a201aaa866447a0c76e3b9c16503e2ed6af9))

* **services:** decouple the EventPubSubService to separate package ([9f51665](https://github.com/ghiscoding/slickgrid-universal/commit/9f516655e9ce5f06e0cfeabc43536834dc38c70b))

* **services:** move Resizer Service w/common services folder for reuse ([d127ac7](https://github.com/ghiscoding/slickgrid-universal/commit/d127ac797ee787ea7785e8ae9f4c0bcaed786afd))

* **styling:** add a new `color-disabled-dark` ([55c3062](https://github.com/ghiscoding/slickgrid-universal/commit/55c30621241ec5da7a2e19879265c4e15a6ad907))

* **styling:** add a new `color-disabled` ([7151198](https://github.com/ghiscoding/slickgrid-universal/commit/7151198dd393c0bc93151cc4dc9c3295917b6b3e))

* **styling:** add extra material icons & new color ([4205b66](https://github.com/ghiscoding/slickgrid-universal/commit/4205b664e80af691c72d5520e4778ad4cd7d94b3))

* **tree:** add `getItemCount` method with optional tree level ([b3f8f94](https://github.com/ghiscoding/slickgrid-universal/commit/b3f8f9484e7ea352b2ed264c6a27e1e091eaf918))

* **tree:** add Tree Collapse Grid State/Preset ([998b01a](https://github.com/ghiscoding/slickgrid-universal/commit/998b01a2f10ccee5636f616921dd86b35a4feaec))

* **tree:** add ways to reapply Tree Collapse previous state ([3702ed3](https://github.com/ghiscoding/slickgrid-universal/commit/3702ed32629f84397349147c978ca650043c45eb))

* add new Input Password Editor which uses common inputEditor ([87e547c](https://github.com/ghiscoding/slickgrid-universal/commit/87e547c0dbccc106a1109c3902ac2027fbd52138))

* convert jQuery to native element on few more filters ([7d5e1e8](https://github.com/ghiscoding/slickgrid-universal/commit/7d5e1e859a0331699d6fb07d2d35797d7274d1df))

## [0.14.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.14.0...v0.14.1) (2021-05-22)

### Bug Fixes

* **editors:** revert to jquery element for aurelia-slickgrid to work ([4d6c358](https://github.com/ghiscoding/slickgrid-universal/commit/4d6c3580ee56df7ec8993176322aede6895f1745))

# [0.14.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.13.0...v0.14.0) (2021-05-22)

### Bug Fixes

* **backend:** able to preset filters on hidden columns & all queried ([c610979](https://github.com/ghiscoding/slickgrid-universal/commit/c610979c54170c069b97a71864d95d0363d75e80))

* **editors:** select editor inline blur save before destroy ([0e591b1](https://github.com/ghiscoding/slickgrid-universal/commit/0e591b1812fc1c733c03f7afcf81dee7a3e4b107))

* **frozen:** rollback previous commit since the issue was found in SlickGrid (core) ([780bcd7](https://github.com/ghiscoding/slickgrid-universal/commit/780bcd7bfae35e26cd84c9a6d220e2dab9eca3b4))

* **resizer:** remove delay to call resize by content to avoid flickering ([961efe6](https://github.com/ghiscoding/slickgrid-universal/commit/961efe6fe7ad721e8196c76ed4c35205830b6b83))

* **services:** fix couple of issues found with custom grid views ([db06736](https://github.com/ghiscoding/slickgrid-universal/commit/db0673688b2b6e6dde8f25af9551bf6c27174a44))

* **sorting:** multi-column sort shouldn't work when option is disabled ([bfc8651](https://github.com/ghiscoding/slickgrid-universal/commit/bfc865128de0a9e4c21ff0dc8b564c15c88dea93))

* **styling:** center horizontally checkbox selector in column header ([bb5aebc](https://github.com/ghiscoding/slickgrid-universal/commit/bb5aebc355a22e19b0071bfe993bbeb0e1090265))

* **tree:** Tree Data export should also include correct indentation ([f1e06c1](https://github.com/ghiscoding/slickgrid-universal/commit/f1e06c11f9eaa9ee778d319bfbaba20bb9abfcc9))

* add item should work in the demo even with filter preset ([d9c97eb](https://github.com/ghiscoding/slickgrid-universal/commit/d9c97ebb587184e94439f6fde1ec8c8a739e7bfa))

* add item to flat and/or tree should both work ([1b19028](https://github.com/ghiscoding/slickgrid-universal/commit/1b19028c9d58a31597906e371f439b094bca7ff0))

* adding optional tree level property should be used when sorting ([a3598c5](https://github.com/ghiscoding/slickgrid-universal/commit/a3598c519a875585498cc828b5a0e76e95890795))

* addItem from grid service should work with tree data ([8b468f0](https://github.com/ghiscoding/slickgrid-universal/commit/8b468f055144b001378395546519d1801e046a0a))

* export to file/excel should also have tree indentation ([8c4c2b8](https://github.com/ghiscoding/slickgrid-universal/commit/8c4c2b8d30bb78e927f0a28bb0f7bef81e95d789))

* Grid Service addItem should invalidate hierarchical dataset itself ([066e894](https://github.com/ghiscoding/slickgrid-universal/commit/066e894271603562b10e014c4febfb18626e54f0))

* previous commit caused issue with composite editor ([13c2a49](https://github.com/ghiscoding/slickgrid-universal/commit/13c2a49916282c1888ae23c1720a617755341e0f))

* return all onBeforeX events in delayed promise to fix spinner ([bb36d1a](https://github.com/ghiscoding/slickgrid-universal/commit/bb36d1af114031eb973cf9993bdb9be1dd050de3))

* **formatters:** Tree Data use nullish coallescing w/optional chaining ([f6cf14c](https://github.com/ghiscoding/slickgrid-universal/commit/f6cf14c06518d47742ee17d82a22a39af490c9e7))

* **styling:** add a better search filter magnify glass icon as placeholder ([5464824](https://github.com/ghiscoding/slickgrid-universal/commit/5464824f3719ebddb303ee1b82161638d870a288))

* **tree:** couple of issues found in Tree Data, fixes [#307](https://github.com/ghiscoding/slickgrid-universal/issues/307) ([e684d1a](https://github.com/ghiscoding/slickgrid-universal/commit/e684d1af1c078a8861c3c94fe5486cbe68d57b85))

### Features

* **addon:** provide grid menu labels for all built-in commands ([44c72d3](https://github.com/ghiscoding/slickgrid-universal/commit/44c72d3ca0b8a88e6ae5022a25b11c4d41fd2897))

* **editors:** add `compositeEditorFormOrder` option ([03f2d66](https://github.com/ghiscoding/slickgrid-universal/commit/03f2d662a69d71edf4b61cdda862fb4eef0f9b47))

* **editors:** add ways to preload date without closing date picker ([3088038](https://github.com/ghiscoding/slickgrid-universal/commit/30880380584b281c756e0ad437031631e6f607e0))

* **resizer:** add `resizeByContentOnlyOnFirstLoad` grid option ([ffe7dc4](https://github.com/ghiscoding/slickgrid-universal/commit/ffe7dc4c2a7ae778c8e731fd7637b154c10035f0))

* **resizer:** add single Column Resize by Content dblClick & headerMenu ([683389f](https://github.com/ghiscoding/slickgrid-universal/commit/683389fcc343ac5c0378a9e34b7f11dda97fc719))

* **styling:** add new marker material icons for project ([9b386fa](https://github.com/ghiscoding/slickgrid-universal/commit/9b386fa3e6af8e76cf4beb5aa0b5322db2f270af))

* add `titleFormatter` to Tree Data ([8bf32ca](https://github.com/ghiscoding/slickgrid-universal/commit/8bf32caa08a6c5a28c7114cb8abe33a5ed9bc4cb))

* add few pubsub events to help with big dataset ([360c62c](https://github.com/ghiscoding/slickgrid-universal/commit/360c62cb0979792dddef8fab39383266c0d855e3))

* add optional child value prefix to Tree Formatter ([9da9662](https://github.com/ghiscoding/slickgrid-universal/commit/9da966298120686929ab3dd2f276574d7f6c8c7e))

* **tree:** improve Tree Data speed considerably ([5487798](https://github.com/ghiscoding/slickgrid-universal/commit/548779801d06cc9ae7e319e72d351c8a868ed79f))

* **editors:** replace jQuery with native elements ([d6e8f4e](https://github.com/ghiscoding/slickgrid-universal/commit/d6e8f4e59823673df290b179d7ee277e3d7bb1af))

# [0.13.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.12.0...v0.13.0) (2021-04-27)

### Bug Fixes

* **editors:** Composite Editor modal compo should work w/complex objects ([#298](https://github.com/ghiscoding/slickgrid-universal/issues/298)) ([721a6c5](https://github.com/ghiscoding/slickgrid-universal/commit/721a6c5627369cfc89710705384995f8aba3a178))

* **exports:** grid with colspan should be export accordingly ([#311](https://github.com/ghiscoding/slickgrid-universal/issues/311)) ([e899fbb](https://github.com/ghiscoding/slickgrid-universal/commit/e899fbba3daa41261dcaa57b0555e37e9bdfafb4))

* **observables:** http cancellable Subject should be unsubscribed ([cbc951b](https://github.com/ghiscoding/slickgrid-universal/commit/cbc951bcf5891658f55981e88887f41b4fb5d5c4))

* **selection:** full row selection should be selected w/show hidden row ([f76e30c](https://github.com/ghiscoding/slickgrid-universal/commit/f76e30cdca476c947089d88069bd21e42639ba7e))

### Features

* **editors:** add `onBeforeOpen` optional callback to Composite Editor ([#306](https://github.com/ghiscoding/slickgrid-universal/issues/306)) ([a642482](https://github.com/ghiscoding/slickgrid-universal/commit/a642482254009115366ca4992e2e60647f8ae9b0))

* **editors:** add `target` to `onBeforeEditCell` w/called by composite ([#301](https://github.com/ghiscoding/slickgrid-universal/issues/301)) ([7440ff5](https://github.com/ghiscoding/slickgrid-universal/commit/7440ff58988acd7abd1ce249b1ceb72556cceb1d))

* **filters:** add option to filter empty values for select filter ([#310](https://github.com/ghiscoding/slickgrid-universal/issues/310)) ([c58a92a](https://github.com/ghiscoding/slickgrid-universal/commit/c58a92a8e2b29ea216211e3561d5567c43f0376a))

* **filters:** option to add custom compound operator list ([3e8d2cb](https://github.com/ghiscoding/slickgrid-universal/commit/3e8d2cbcea6181e3ce3157798f003a8479d11011))

* **footer:** add row selection count to the footer component ([8ba146c](https://github.com/ghiscoding/slickgrid-universal/commit/8ba146cd4cbdccdb61f3441918065fad4561ff84))

* **resize:** add column resize by cell content ([#309](https://github.com/ghiscoding/slickgrid-universal/issues/309)) ([515a072](https://github.com/ghiscoding/slickgrid-universal/commit/515a072b3a16d3aca0f48e62c968ae89a1510669))

* **services:** remove deprecated hideColumnByIndex form Grid Service ([#312](https://github.com/ghiscoding/slickgrid-universal/issues/312)) ([b00c64d](https://github.com/ghiscoding/slickgrid-universal/commit/b00c64d8f88d4560c677f667a84d95ba30e96399))

* **styling:** switch from node-sass to dart-sass (sass) ([81f8d9f](https://github.com/ghiscoding/slickgrid-universal/commit/81f8d9fbd1381b4c877eeeb4992bdcc90c1cd677))

* **typing:** add missing item metadata interface ([#299](https://github.com/ghiscoding/slickgrid-universal/issues/299)) ([7cf0a21](https://github.com/ghiscoding/slickgrid-universal/commit/7cf0a2185c73dcb7748a193ba2272bb7af699266))

# [0.12.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.11.2...v0.12.0) (2021-03-24)

### Bug Fixes

* **editors:** show all editors as 100% height in their cell container ([#277](https://github.com/ghiscoding/slickgrid-universal/issues/277)) ([3f49aea](https://github.com/ghiscoding/slickgrid-universal/commit/3f49aeabd6016c705d4d6b809345fe1ac948cfc5))

* **filters:** rollback a change made in PR [#288](https://github.com/ghiscoding/slickgrid-universal/issues/288) causing preset issues ([18ffc0c](https://github.com/ghiscoding/slickgrid-universal/commit/18ffc0c8285e4e2306bc60817fba357734a65b61))

* **filters:** SearchTerms shouldn't come back after calling clearFilters ([04f3d12](https://github.com/ghiscoding/slickgrid-universal/commit/04f3d1267de493b9dc1e922dca3b433b9cb34fde))

* **filters:** string <> should be Not Contains instead of Not Equal ([#276](https://github.com/ghiscoding/slickgrid-universal/issues/276)) ([960884d](https://github.com/ghiscoding/slickgrid-universal/commit/960884ddf58b1e87ad5ef71e3713f8836e6190c0))

* **firefox:** add all missing SVG color filter classes for Firefox/SF ([#296](https://github.com/ghiscoding/slickgrid-universal/issues/296)) ([a07ebdf](https://github.com/ghiscoding/slickgrid-universal/commit/a07ebdfbd2c2197c28102efe1f4a685ea61185e1))

* **pinning:** reordering cols position freezing cols shouldn't affect ([#275](https://github.com/ghiscoding/slickgrid-universal/issues/275)) ([a30665d](https://github.com/ghiscoding/slickgrid-universal/commit/a30665d54da583c47b1f533002173af99e9ab20d))

* **plugin:** Grid Menu Clear Frozen Cols shouldn't change cols positions ([#291](https://github.com/ghiscoding/slickgrid-universal/issues/291)) ([4fdab08](https://github.com/ghiscoding/slickgrid-universal/commit/4fdab08357d12349b6402e3007f4ab399d9a2140))

* **presets:** Filter & Sorting presets & Footer metrics issues ([#285](https://github.com/ghiscoding/slickgrid-universal/issues/285)) ([3174c86](https://github.com/ghiscoding/slickgrid-universal/commit/3174c86e011b4927510b99a348e8019adb4baa00))

* **presets:** Multiple Select Filter Grid Presets values should be shown ([dd1f231](https://github.com/ghiscoding/slickgrid-universal/commit/dd1f231850819bde455e24d743b9e1637767ecb3))

* **resizer:** allow gridHeight/gridWidth to be passed as string ([#284](https://github.com/ghiscoding/slickgrid-universal/issues/284)) ([20bda50](https://github.com/ghiscoding/slickgrid-universal/commit/20bda50bf3ab647ae4ee3d7ffe0c9c8b58e8f187)), closes [#534](https://github.com/ghiscoding/slickgrid-universal/issues/534)

* **sorting:** add some unit tests that were previously commented out ([#290](https://github.com/ghiscoding/slickgrid-universal/issues/290)) ([2a91fa6](https://github.com/ghiscoding/slickgrid-universal/commit/2a91fa6f672650bb525a4ba1774d02c5ac435c5b))

### Features

* **editors:** add `onSelect` callback to Autocomplete Editor ([#286](https://github.com/ghiscoding/slickgrid-universal/issues/286)) ([2d106d4](https://github.com/ghiscoding/slickgrid-universal/commit/2d106d4df0a259d36bee3d910320706ddb7e8580))

* **filters:** add new IN_COLLECTION operator to allow searching cell value as Array ([#282](https://github.com/ghiscoding/slickgrid-universal/issues/282)) ([ecce93c](https://github.com/ghiscoding/slickgrid-universal/commit/ecce93c92b7424522ad2af0d7d82963a3a56ca97))

* **filters:** add optional `filterTypingDebounce` for filters w/keyup ([#289](https://github.com/ghiscoding/slickgrid-universal/issues/289)) ([3aecc89](https://github.com/ghiscoding/slickgrid-universal/commit/3aecc899ebd78d9597cc4ed4919c0a8dd26673a8))

* **filters:** add optional `filterTypingDebounce` for keyboard filters ([#283](https://github.com/ghiscoding/slickgrid-universal/issues/283)) ([bb7dcd3](https://github.com/ghiscoding/slickgrid-universal/commit/bb7dcd3a9e28f45c7339e2f30685220b7a152507))

* **filters:** add possibility to filter by text range like "a..e" ([#279](https://github.com/ghiscoding/slickgrid-universal/issues/279)) ([e44145d](https://github.com/ghiscoding/slickgrid-universal/commit/e44145d897da570bf6ea15b156c7961ce96ce6f0))

* **filters:** display operator into input text filter from Grid Presets ([#288](https://github.com/ghiscoding/slickgrid-universal/issues/288)) ([3fad4fe](https://github.com/ghiscoding/slickgrid-universal/commit/3fad4fe9ef3bec290dabb860d7ea4baf8f182a4a))

* **resources:** add RxJS support into Slickgrid-Universal via external package ([#280](https://github.com/ghiscoding/slickgrid-universal/issues/280)) ([c10fc33](https://github.com/ghiscoding/slickgrid-universal/commit/c10fc339019c04ec0f7c4357ccdb3949a2358460))

* **state:** add Pinning (frozen) to Grid State & Presets ([#292](https://github.com/ghiscoding/slickgrid-universal/issues/292)) ([ba703d8](https://github.com/ghiscoding/slickgrid-universal/commit/ba703d8353a243ffed4d40804c0f977119424f6c))

## [0.11.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.11.1...v0.11.2) (2021-02-27)

### Bug Fixes

* **editors:** styling issue found with input group and Bootstrap ([18a9d02](https://github.com/ghiscoding/slickgrid-universal/commit/18a9d020a5d0016643e6a2ab8dbd93f896dcbc8b))

## [0.11.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.11.0...v0.11.1) (2021-02-27)

### Bug Fixes

* **plugins:** do not recreate header button plugin after re-render ([09d44ec](https://github.com/ghiscoding/slickgrid-universal/commit/09d44ecf29a4465bf8a13db818329e5c93cc47f1))

# [0.11.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.10.2...v0.11.0) (2021-02-27)

### Bug Fixes

* **build:** enable tsconfig strict mode tsconfig ([#269](https://github.com/ghiscoding/slickgrid-universal/issues/269)) ([095fc71](https://github.com/ghiscoding/slickgrid-universal/commit/095fc71052c1f4e776544781da5fe762cfa16238))

* **filters:** don't use indexOf NOT_IN_CONTAINS ([#262](https://github.com/ghiscoding/slickgrid-universal/issues/262)) ([310be30](https://github.com/ghiscoding/slickgrid-universal/commit/310be30efb653151a75dde0a14b1ed3f9946b333))

* **filters:** use defaultFilterOperator in range when none provided ([#271](https://github.com/ghiscoding/slickgrid-universal/issues/271)) ([993675f](https://github.com/ghiscoding/slickgrid-universal/commit/993675f6b0d76e76010d5cadc6696134a73dad66))

* **helpers:** should be able to highlight first row (0) ([#268](https://github.com/ghiscoding/slickgrid-universal/issues/268)) ([a58be17](https://github.com/ghiscoding/slickgrid-universal/commit/a58be17959e28ab9a1280c3d7d7c8df9db02587e)), closes [#527](https://github.com/ghiscoding/slickgrid-universal/issues/527)

* **plugin:** recreate header menu when adding column dynamically ([#257](https://github.com/ghiscoding/slickgrid-universal/issues/257)) ([16c4984](https://github.com/ghiscoding/slickgrid-universal/commit/16c49845c5d3388502811c15f0a23daa1a01f850))

### Features

* **demo:** add Example 13 Header Button Plugin ([f345cd1](https://github.com/ghiscoding/slickgrid-universal/commit/f345cd18b89f849f3f873538c214d3ac24ff12f8))

* **editors:** add a Clear (X) button to the Autocomplete Editor ([#270](https://github.com/ghiscoding/slickgrid-universal/issues/270)) ([ffbd188](https://github.com/ghiscoding/slickgrid-universal/commit/ffbd188534992c31848691154517deb64694f3b2))

* **filters:** add updateSingleFilter for a single external filter ([#265](https://github.com/ghiscoding/slickgrid-universal/issues/265)) ([20564a3](https://github.com/ghiscoding/slickgrid-universal/commit/20564a3096948626beada698460b72374a18ca7c))

* **perf:** huge filtering speed improvements ([a101ed1](https://github.com/ghiscoding/slickgrid-universal/commit/a101ed1b62c2fbfec2712f64e08192a4852bce9d))

* **perf:** improve date sorting speed ([258da22](https://github.com/ghiscoding/slickgrid-universal/commit/258da2238bba3693eada058f9405012f68af150b))

* **perf:** improve date sorting speed ([#259](https://github.com/ghiscoding/slickgrid-universal/issues/259)) ([a52f4fc](https://github.com/ghiscoding/slickgrid-universal/commit/a52f4fcee1627ac5906388f8dcf4b7fe3f5c4aa7))

* **services:** add bulk transactions in Grid Service CRUD methods ([#256](https://github.com/ghiscoding/slickgrid-universal/issues/256)) ([03385d9](https://github.com/ghiscoding/slickgrid-universal/commit/03385d9ac58cb3ce7501a409394706c0cb4f4d29))

## [0.10.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.10.1...v0.10.2) (2021-01-28)

### Bug Fixes

* **filter:** filter service not returning correct operator ([bd30697](https://github.com/ghiscoding/slickgrid-universal/commit/bd30697e1f3b6bf0e0d8b18b1c2ff30416ed022d))

## [0.10.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.10.0...v0.10.1) (2021-01-28)

### Bug Fixes

* **build:** decrease tsc target to es2017 instead of es2020 ([2f2e5f4](https://github.com/ghiscoding/slickgrid-universal/commit/2f2e5f46a3b25897f1a4a59daa1346b5d577ddb8))

# [0.10.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.9.0...v0.10.0) (2021-01-28)

### Bug Fixes

* **core:** fix types index.d.ts url ([a76b3a3](https://github.com/ghiscoding/slickgrid-universal/commit/a76b3a3d97a6d211ec2e7e8d9060fd8dd0719f58))

* **editors:** add blank disabled fields in Composite Editor form values ([#233](https://github.com/ghiscoding/slickgrid-universal/issues/233)) ([b634902](https://github.com/ghiscoding/slickgrid-universal/commit/b6349029b705991b7ac2d1df99f5b330fe69ef36))

* **editors:** fix clear date & blank disabled field w/Composite Editor ([#235](https://github.com/ghiscoding/slickgrid-universal/issues/235)) ([9aac97d](https://github.com/ghiscoding/slickgrid-universal/commit/9aac97d2d433c809facc8d7092467780d55ca01a))

* **filters:** Grid State filters should always include an operator ([#238](https://github.com/ghiscoding/slickgrid-universal/issues/238)) ([f64ed37](https://github.com/ghiscoding/slickgrid-universal/commit/f64ed37f7ffe01346c8f68d4bd170ffdce54839d))

* **frozen:** hiding multiple columns when using pinning gets out of sync ([#243](https://github.com/ghiscoding/slickgrid-universal/issues/243)) ([b255220](https://github.com/ghiscoding/slickgrid-universal/commit/b255220ec37dbdc9df4f3ecccb4397656cf9f2a6))

* **lint:** add eslint as a pre task when bundling & fix linting errors ([#246](https://github.com/ghiscoding/slickgrid-universal/issues/246)) ([6f7ccd8](https://github.com/ghiscoding/slickgrid-universal/commit/6f7ccd8ee4cc5e005034965a2c2dcc0499f06a73))

* **pinning:** recalculate frozen idx properly when column shown changes ([#241](https://github.com/ghiscoding/slickgrid-universal/issues/241)) ([3b55972](https://github.com/ghiscoding/slickgrid-universal/commit/3b559726acdff96970c68c10c8d256d0403d6c4f))

* **plugins:** add missing Row Detail filtering code ([#239](https://github.com/ghiscoding/slickgrid-universal/issues/239)) ([d9cad63](https://github.com/ghiscoding/slickgrid-universal/commit/d9cad635840650d2b2dd91444ffa0121147f4140))

### Features

* **editors:** add Clone functionality to Composite Editor ([#236](https://github.com/ghiscoding/slickgrid-universal/issues/236)) ([df545e4](https://github.com/ghiscoding/slickgrid-universal/commit/df545e4ec64271307b1979feb5e786f449433639))

* **editors:** change all private keyword to protected for extensability ([#247](https://github.com/ghiscoding/slickgrid-universal/issues/247)) ([089b6cb](https://github.com/ghiscoding/slickgrid-universal/commit/089b6cbbdd6284d94f765fdad08642e0d0d81ff0))

* **filters:** change all private keyword to protected for extensability ([#245](https://github.com/ghiscoding/slickgrid-universal/issues/245)) ([52cc702](https://github.com/ghiscoding/slickgrid-universal/commit/52cc7022c4b847566d89e91a80c423373538a15a))

* **formatters:** add grid option to auto add custom editor formatter ([#248](https://github.com/ghiscoding/slickgrid-universal/issues/248)) ([db77d46](https://github.com/ghiscoding/slickgrid-universal/commit/db77d464ee37eda573351e89d4c5acc9b5648649))

* add nameCompositeEditor override to be used by Composite Editor ([fcdb2e9](https://github.com/ghiscoding/slickgrid-universal/commit/fcdb2e92ed736b09e947cdbcf39ee157afc4acab))

# [0.9.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.8.0...v0.9.0) (2021-01-06)

### Bug Fixes

* **build:** import Flatpickr Locale on demand via regular imports ([#227](https://github.com/ghiscoding/slickgrid-universal/issues/227)) ([6644822](https://github.com/ghiscoding/slickgrid-universal/commit/664482210557fc1a7a178856e2641f71b9580c44))

### Features

* **build:** upgrade to WebPack 5 ([#225](https://github.com/ghiscoding/slickgrid-universal/issues/225)) ([c6b3ad3](https://github.com/ghiscoding/slickgrid-universal/commit/c6b3ad3eb6fb64306bfd8bd300fcc1e86b27e5a6))

* **ci:** replace CircleCI with GitHub Actions ([#211](https://github.com/ghiscoding/slickgrid-universal/issues/211)) ([4f91140](https://github.com/ghiscoding/slickgrid-universal/commit/4f9114031ca6236ef45f04b67dcba1a9981035c4))

* **editors:** add Column Editor collectionOverride option ([#228](https://github.com/ghiscoding/slickgrid-universal/issues/228)) ([91421fc](https://github.com/ghiscoding/slickgrid-universal/commit/91421fc0154e432874fb2211e430a79032b996b8))

* **styling:** add support for Bootstrap 5 ([#226](https://github.com/ghiscoding/slickgrid-universal/issues/226)) ([e35f116](https://github.com/ghiscoding/slickgrid-universal/commit/e35f116efc1989f675ef6e030d80a8a31a444373))

# [0.8.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.7...v0.8.0) (2020-12-22)

### Bug Fixes

* **core:** change moment/lodash imports so it works with ES6 module ([#210](https://github.com/ghiscoding/slickgrid-universal/issues/210)) ([2d25d3b](https://github.com/ghiscoding/slickgrid-universal/commit/2d25d3b99f7be93f2bc69f006fb67a39cf39ce7c))

* **core:** use regular imports instead of require to load plugins ([#209](https://github.com/ghiscoding/slickgrid-universal/issues/209)) ([6816696](https://github.com/ghiscoding/slickgrid-universal/commit/6816696c98be0d2dd80c1ff49358bd49ee7caacb))

### Features

* **filters:** add Autocomplete/Select Filters collection observers ([#208](https://github.com/ghiscoding/slickgrid-universal/issues/208)) ([3b3b463](https://github.com/ghiscoding/slickgrid-universal/commit/3b3b4631e5d878ba72d5f2579c5a6b05cc1a7028))

## [0.7.7](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.6...v0.7.7) (2020-12-20)

**Note:** Version bump only for package @slickgrid-universal/common

## [0.7.6](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.5...v0.7.6) (2020-12-20)

**Note:** Version bump only for package @slickgrid-universal/common

## [0.7.5](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.4...v0.7.5) (2020-12-20)

**Note:** Version bump only for package @slickgrid-universal/common

## [0.7.4](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.3...v0.7.4) (2020-12-20)

**Note:** Version bump only for package @slickgrid-universal/common

## [0.7.3](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.2...v0.7.3) (2020-12-20)

### Bug Fixes

* **editors:** fix BS3,BS4 styles & slider value not shown with undefined ([#204](https://github.com/ghiscoding/slickgrid-universal/issues/204)) ([3aca8f9](https://github.com/ghiscoding/slickgrid-universal/commit/3aca8f9053365c1987f6c5abc43f8ce5eca015fb))

* **exports:** should be able to change export file name ([#205](https://github.com/ghiscoding/slickgrid-universal/issues/205)) ([9d26213](https://github.com/ghiscoding/slickgrid-universal/commit/9d262134b12da46ef1fea970f092d96ce875ed78))

## [0.7.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.1...v0.7.2) (2020-12-17)

### Bug Fixes

* **core:** range default should be inclusive instead of exclusive ([#203](https://github.com/ghiscoding/slickgrid-universal/issues/203)) ([b7f74ad](https://github.com/ghiscoding/slickgrid-universal/commit/b7f74ad8a1539aed32ac643b4fe395fbdecf4459))

* **sorting:** add cellValueCouldBeUndefined in grid option for sorting ([#202](https://github.com/ghiscoding/slickgrid-universal/issues/202)) ([865256e](https://github.com/ghiscoding/slickgrid-universal/commit/865256efe927a5715840963cb2945f16a402789b))

* **stylings:** small alignment issue with the slider value elm height ([5a453b8](https://github.com/ghiscoding/slickgrid-universal/commit/5a453b8739c07e07f835e111d7d3ca5d627a0c2f))

## [0.7.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.0...v0.7.1) (2020-12-17)

**Note:** Version bump only for package @slickgrid-universal/common

# [0.7.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.6.0...v0.7.0) (2020-12-16)

### Bug Fixes

* **components:** refactor to use registerExternalResources grid option ([#199](https://github.com/ghiscoding/slickgrid-universal/issues/199)) ([7ca42f4](https://github.com/ghiscoding/slickgrid-universal/commit/7ca42f4242bfddd4dd746d7f3f37dbe1e3f7368b))

### Features

* **core:** methods to change column positions/visibilities dynamically ([#200](https://github.com/ghiscoding/slickgrid-universal/issues/200)) ([5048a4b](https://github.com/ghiscoding/slickgrid-universal/commit/5048a4b969f337f002dad552197d02f970590c73))

# [0.6.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.5.1...v0.6.0) (2020-12-14)

### Bug Fixes

* **core:** add console error if any of column def id includes dot ([#198](https://github.com/ghiscoding/slickgrid-universal/issues/198)) ([6ee40af](https://github.com/ghiscoding/slickgrid-universal/commit/6ee40af507b066602c39e057349b5ead6e7952f3))

* **stylings:** composite editor styling fixes for BS4 ([#195](https://github.com/ghiscoding/slickgrid-universal/issues/195)) ([305eb90](https://github.com/ghiscoding/slickgrid-universal/commit/305eb90c75e6a4aa076c62b5364b904dc5c6518e))

* **stylings:** re-align the svg icons & single/multiple-select icon+text ([#194](https://github.com/ghiscoding/slickgrid-universal/issues/194)) ([b730be7](https://github.com/ghiscoding/slickgrid-universal/commit/b730be7a75b3035c01aa7ca8f48a88df447ad461))

### Features

* **core:** add registerExternalResources for Components/Services ([#196](https://github.com/ghiscoding/slickgrid-universal/issues/196)) ([ee02f1d](https://github.com/ghiscoding/slickgrid-universal/commit/ee02f1d62d1a0601421352e43d17bd8c89e4348c))

* **core:** refactor code using the container service everywhere ([#197](https://github.com/ghiscoding/slickgrid-universal/issues/197)) ([96ce9bd](https://github.com/ghiscoding/slickgrid-universal/commit/96ce9bdbf18330e522dad0cbb0eda09c41f6a3df))

* **formatters:** add numberPrefix & Suffix to Decimal Formatter ([#193](https://github.com/ghiscoding/slickgrid-universal/issues/193)) ([0e4d30c](https://github.com/ghiscoding/slickgrid-universal/commit/0e4d30c0ee23bc598206fbba4e5ed406e4aeecfe))

## [0.5.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.5.0...v0.5.1) (2020-12-10)

**Note:** Version bump only for package @slickgrid-universal/common

# [0.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.4.2...v0.5.0) (2020-12-10)

### Bug Fixes

* **editors:** make sure select editor is defined before reading a prop ([763f981](https://github.com/ghiscoding/slickgrid-universal/commit/763f98111d03652b0ad903ba487a3b8c83a5ef5d))

* **editors:** only translate button texts when enableTranslate is true ([b698c6b](https://github.com/ghiscoding/slickgrid-universal/commit/b698c6bd3f13af017c7f3c0113b8407269ba1e0d))

* **editors:** Select Editor option to return flat data w/complex object ([#189](https://github.com/ghiscoding/slickgrid-universal/issues/189)) ([4695cd3](https://github.com/ghiscoding/slickgrid-universal/commit/4695cd3b6871dc1ceca4036fd30935eca8011b7e))

* **exports:** when cell value is empty object return empty string ([#190](https://github.com/ghiscoding/slickgrid-universal/issues/190)) ([cd34901](https://github.com/ghiscoding/slickgrid-universal/commit/cd349012c82a8bdff113fb9f8ef23ea18c6e3035))

### Features

* **components:** extract CompositeEditor & EmptyWarning Components ([#191](https://github.com/ghiscoding/slickgrid-universal/issues/191)) ([00cf9a2](https://github.com/ghiscoding/slickgrid-universal/commit/00cf9a22e1924a46ed637d52bba8efc02ef7eea1))

# [0.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.3.0...v0.4.0) (2020-12-07)

### Bug Fixes

* **styling:** Compound Filter Operator dropdown too wide in BS4 ([9cb5750](https://github.com/ghiscoding/slickgrid-universal/commit/9cb575029e9b875af63cf131c1511e5e2c2036f2))

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

* **editors:** make sure editor element exist before focusing ([e57235b](https://github.com/ghiscoding/slickgrid-universal/commit/e57235b4339ffa1bee522c245665bb598d963fd1))

* **extensions:** draggable grouping style change to look better ([#171](https://github.com/ghiscoding/slickgrid-universal/issues/171)) ([d00be88](https://github.com/ghiscoding/slickgrid-universal/commit/d00be8868370f3679555b8f52ef4ad85916c93ac))

* **formatters:** date formatters should accept ISO input & output to US ([#172](https://github.com/ghiscoding/slickgrid-universal/issues/172)) ([85ce7cf](https://github.com/ghiscoding/slickgrid-universal/commit/85ce7cf3636d5bb43d3ef18ec6998bb0c423d218))

## [0.2.13](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/common@0.2.12...@slickgrid-universal/common@0.2.13) (2020-11-26)

**Note:** Version bump only for package @slickgrid-universal/common

## [0.2.12](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/common@0.2.11...@slickgrid-universal/common@0.2.12) (2020-11-26)

**Note:** Version bump only for package @slickgrid-universal/common

## [0.2.11](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/common@0.2.10...@slickgrid-universal/common@0.2.11) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/common

## [0.2.10](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/common@0.2.9...@slickgrid-universal/common@0.2.10) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/common

## [0.2.9](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/common@0.2.8...@slickgrid-universal/common@0.2.9) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/common

## [0.2.8](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/common@0.2.7...@slickgrid-universal/common@0.2.8) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/common

## [0.2.7](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/common@0.2.6...@slickgrid-universal/common@0.2.7) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/common

## [0.2.6](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/common@0.2.5...@slickgrid-universal/common@0.2.6) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/common

## [0.2.5](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/common@0.2.4...@slickgrid-universal/common@0.2.5) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/common

## [0.2.4](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/common@0.2.3...@slickgrid-universal/common@0.2.4) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/common

## [0.2.3](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/common@0.2.3...@slickgrid-universal/common@0.2.3) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/common

## [0.2.3](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/common@0.2.2...@slickgrid-universal/common@0.2.3) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/common

## [0.2.2](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/common@0.2.1...@slickgrid-universal/common@0.2.2) (2020-11-25)

**Note:** Version bump only for package @slickgrid-universal/common

## [0.2.1](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/common@0.2.0...@slickgrid-universal/common@0.2.1) (2020-11-25)

### Bug Fixes

* **core:** don't expose src folder on npm & update few npm package ([#168](https://github.com/ghiscoding/slickgrid-universal/issues/168)) ([3c05938](https://github.com/ghiscoding/slickgrid-universal/commit/3c059381b35bba88ea98d0206692c912c625f227))

* **editors:** make sure editor element exist before focusing ([e57235b](https://github.com/ghiscoding/slickgrid-universal/commit/e57235b4339ffa1bee522c245665bb598d963fd1))

# [0.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/common@0.1.0...@slickgrid-universal/common@0.2.0) (2020-11-20)

### Bug Fixes

* **core:** clear dataset when disposing and fix few unsubscribed events to avoid leak ([#156](https://github.com/ghiscoding/slickgrid-universal/issues/156)) ([78c80b4](https://github.com/ghiscoding/slickgrid-universal/commit/78c80b43ca04fd4fff68791556f9d4ab37f06caa))

* **core:** empty warning message should work with multiple grids ([#158](https://github.com/ghiscoding/slickgrid-universal/issues/158)) ([9e7c023](https://github.com/ghiscoding/slickgrid-universal/commit/9e7c023f7d33313400f4e55ddffd838d290b83dd))

* **core:** fix some problems found with AutoComplete ([#74](https://github.com/ghiscoding/slickgrid-universal/issues/74)) ([00fb478](https://github.com/ghiscoding/slickgrid-universal/commit/00fb478263db832ec31d940ed19417d9fcbae04a))

* **core:** Flatpickr is not destroyed properly & leaks detached elements ([#154](https://github.com/ghiscoding/slickgrid-universal/issues/154)) ([9633d4a](https://github.com/ghiscoding/slickgrid-universal/commit/9633d4a090c23ff4792cb614360afc58e76d74c3))

* **core:** header columns grouping misbehave after hiding column ([#164](https://github.com/ghiscoding/slickgrid-universal/issues/164)) ([6b8232b](https://github.com/ghiscoding/slickgrid-universal/commit/6b8232b3b98d1b75412bebd6b4528ee5dea71d7a))

* **core:** mem leaks w/orphan DOM elements when disposing ([#153](https://github.com/ghiscoding/slickgrid-universal/issues/153)) ([faba5a6](https://github.com/ghiscoding/slickgrid-universal/commit/faba5a6652fa2cf5e78f64b6b2e27bf9b85936ba))

* **core:** properly remove event listeners when disposing ([#163](https://github.com/ghiscoding/slickgrid-universal/issues/163)) ([ecfb9a7](https://github.com/ghiscoding/slickgrid-universal/commit/ecfb9a7c623010504a7a2d312ffef185f16cec9e))

* **editor:** SingleSelect Editor should show pick false value ([#75](https://github.com/ghiscoding/slickgrid-universal/issues/75)) ([fdb2c84](https://github.com/ghiscoding/slickgrid-universal/commit/fdb2c8433d443dd8f4fdd86f714354424cfb9ea3))

* **editors:** autocomplete editor spinner aligned right in mass update ([#162](https://github.com/ghiscoding/slickgrid-universal/issues/162)) ([6ae5189](https://github.com/ghiscoding/slickgrid-universal/commit/6ae51897979d80f5639fb095406e83e182649252))

* **filters:** disregard time when filtering date only format ([#134](https://github.com/ghiscoding/slickgrid-universal/issues/134)) ([7bd2d19](https://github.com/ghiscoding/slickgrid-universal/commit/7bd2d1964de2e809d8b08c737231eec31d146fae))

* **pinning:** put back vertical scroll on grid after removing freezing ([75a47a6](https://github.com/ghiscoding/slickgrid-universal/commit/75a47a607d463854c1b51fe5a330d629c79ac2e2))

* **select:** make a collection array copy to avoid change by ref ([#135](https://github.com/ghiscoding/slickgrid-universal/issues/135)) ([3237133](https://github.com/ghiscoding/slickgrid-universal/commit/323713382f1565ff8617ede08fdc8ed31ac3a594))

* **styling:** support other unit of measure in SASS ([5b9adec](https://github.com/ghiscoding/slickgrid-universal/commit/5b9adec6d11230a870337f1adaac1b0f9e157438))

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

* **formatters:** add AlignRight Formatter & alias AlignCenter=>Center ([#161](https://github.com/ghiscoding/slickgrid-universal/issues/161)) ([831580d](https://github.com/ghiscoding/slickgrid-universal/commit/831580d5234114d9510a578a71f608cbb3eda3ec))

* **icons:** add more Material icons ([9f9377b](https://github.com/ghiscoding/slickgrid-universal/commit/9f9377b2768c0ad6c091731be36125ea73e2ad46))

* **icons:** add some more material icons ([#124](https://github.com/ghiscoding/slickgrid-universal/issues/124)) ([b90fe2d](https://github.com/ghiscoding/slickgrid-universal/commit/b90fe2d231c1005ad137a7f0fbae8f6fb928cb79))

* **plugins:** add "hidden" to all controls/plugins with menu items ([#128](https://github.com/ghiscoding/slickgrid-universal/issues/128)) ([99202de](https://github.com/ghiscoding/slickgrid-universal/commit/99202deb7b452b7ac8d67d4b98545901cf99005e))

* **services:** add 2x new methods hideColumnById or ..byIds ([#160](https://github.com/ghiscoding/slickgrid-universal/issues/160)) ([d396653](https://github.com/ghiscoding/slickgrid-universal/commit/d3966530fab48ee72fab138b8caf97c4eb73ec91))

* **services:** add Toggle Filtering/Sorting & Hide Column methods ([#126](https://github.com/ghiscoding/slickgrid-universal/issues/126)) ([08fe2e1](https://github.com/ghiscoding/slickgrid-universal/commit/08fe2e19c5778941050e42ca207d55dc27564ba8))

* **styling:** add frozen on all possible elements with SASS variables ([#138](https://github.com/ghiscoding/slickgrid-universal/issues/138)) ([c61da91](https://github.com/ghiscoding/slickgrid-universal/commit/c61da911c449949570f54343724bc80523f77bcb)), closes [#537](https://github.com/ghiscoding/slickgrid-universal/issues/537)

* **styling:** add Pagination button height sass variable ([#136](https://github.com/ghiscoding/slickgrid-universal/issues/136)) ([43deeee](https://github.com/ghiscoding/slickgrid-universal/commit/43deeee99aee1887a62ec4238f68dce9e37fca69))

* **styling:** find way to add colors to SVGs used by the lib ([#73](https://github.com/ghiscoding/slickgrid-universal/issues/73)) ([8a07c16](https://github.com/ghiscoding/slickgrid-universal/commit/8a07c16ec3238533ab16fb22f8b748168cd5f18c))

* **tests:** add more Cypress E2E tests for grouping ([#125](https://github.com/ghiscoding/slickgrid-universal/issues/125)) ([814dec0](https://github.com/ghiscoding/slickgrid-universal/commit/814dec0dbad7cf59e98654a732dbf6d46de37a1a))

# [0.1.0](https://github.com/ghiscoding/slickgrid-universal/compare/@slickgrid-universal/common@0.0.2...@slickgrid-universal/common@0.1.0) (2020-07-28)

### Bug Fixes

* **build:** vscode chrome debugger + webpack prod build should both work ([e148090](https://github.com/ghiscoding/slickgrid-universal/commit/e148090b967119c911c5da2fc7cb2cfdf4c3de39))

* **components:** add "cssText" option to both Footer/Pagination ([abd4fcd](https://github.com/ghiscoding/slickgrid-universal/commit/abd4fcd6ea6c990e1192afaca450dd6b7847e590))

* **components:** both Footer/Pagination should always be 100% width ([#27](https://github.com/ghiscoding/slickgrid-universal/issues/27)) ([e587ef5](https://github.com/ghiscoding/slickgrid-universal/commit/e587ef5084d469c6342c84c5c2f6a0dc65ae4493))

* **context:** change copy cell command to make it work in SF ([#8](https://github.com/ghiscoding/slickgrid-universal/issues/8)) ([c0b8ad9](https://github.com/ghiscoding/slickgrid-universal/commit/c0b8ad943dbd6baf08f41c36d6d266382b758206))

* **core:** add missing use of custom datasetIdPropertyName ([917f044](https://github.com/ghiscoding/slickgrid-universal/commit/917f044b1489b19917b15bd146a2d40f8924ea23))

* **debug:** chrome debugger with webpack & TS breakpoints ([6c3ab52](https://github.com/ghiscoding/slickgrid-universal/commit/6c3ab521be42265edd33d30002f342493f12c54b))

* **editor:** disregard Flatpickr error on Date Editor ([e7d7ba5](https://github.com/ghiscoding/slickgrid-universal/commit/e7d7ba57c6a68309aafb0c2082b4e642194067f3))

* **editor:** disregard Flatpickr error on Date Editor and fix output format ([140c48e](https://github.com/ghiscoding/slickgrid-universal/commit/140c48e7fe18eea76d59b44bb6625d3cb89aaf55))

* **editor:** float validator min/max values should be inclusive ([3e193aa](https://github.com/ghiscoding/slickgrid-universal/commit/3e193aabd8bdf515d53da938c19bc931b29c8438))

* **editor:** float validator should accept decimal even without 0 suffix ([87808ce](https://github.com/ghiscoding/slickgrid-universal/commit/87808ce1f0c10e4dd070518b78e35e986580de30))

* **editor:** number validators should be ok with null value on init ([1aadc86](https://github.com/ghiscoding/slickgrid-universal/commit/1aadc86787d88de8e18a193853e40ee88e795f93))

* **editor:** shouldn't call cell changed when cell value is undefined ([d5796a1](https://github.com/ghiscoding/slickgrid-universal/commit/d5796a1c3d45d5592c56dc9001231b2943f56cc0))

* **editors:** add saveOutputType to finally have proper save format ([#17](https://github.com/ghiscoding/slickgrid-universal/issues/17)) ([ebfd715](https://github.com/ghiscoding/slickgrid-universal/commit/ebfd71582642abe136317dbef8cedee68d472aa7))

* **editors:** Editors should work with undefined item properties ([#25](https://github.com/ghiscoding/slickgrid-universal/issues/25)) ([9bc6f5a](https://github.com/ghiscoding/slickgrid-universal/commit/9bc6f5ad617d7144d8787d4afcfe3b888966dcb7))

* **editors:** invalid date should trigger onvalidationerror ([#19](https://github.com/ghiscoding/slickgrid-universal/issues/19)) ([041087e](https://github.com/ghiscoding/slickgrid-universal/commit/041087ea928b9c53ef118a198b6837a028933b7a))

* **editors:** make sure appendChild exist before using it to add Editor ([90d4a67](https://github.com/ghiscoding/slickgrid-universal/commit/90d4a670824eb979fc2813d0d42a5803dacd3739))

* **filter:** recreate filter when toggling header row ([e839464](https://github.com/ghiscoding/slickgrid-universal/commit/e839464fa5dbb1db274ebda69daf3f71808f0c93))

* **filter:** string filter should also work when using Contains ([fc54f9a](https://github.com/ghiscoding/slickgrid-universal/commit/fc54f9a03b974e000cde4ea4a18ddb261572f003))

* **filter:** when entering filter operator it shouldn't do any filtering ([81c465b](https://github.com/ghiscoding/slickgrid-universal/commit/81c465b61ca4c0883c4c4308a5b154ef7410039e))

* **formatter:** add possibility to parse a date formatter as a UTC date ([e72bcad](https://github.com/ghiscoding/slickgrid-universal/commit/e72bcadae652bb00cb8b51f92ff2b2cf67de37a4))

* **formatters:** decimalSeparator & thousandSeparator work tgt ([62de7c2](https://github.com/ghiscoding/slickgrid-universal/commit/62de7c2713c140ef757d821d7538a965ea625b7e))

* **header:** re-create header grouping title after changing picker cols ([872c780](https://github.com/ghiscoding/slickgrid-universal/commit/872c7808d27cae30c414d1e3769728aa083910e7))

* **menu:** context menu to copy cell with queryFieldNameGetterFn ([#21](https://github.com/ghiscoding/slickgrid-universal/issues/21)) ([53c50f9](https://github.com/ghiscoding/slickgrid-universal/commit/53c50f9d716725330681d3617082b1fa33f90c12))

* **pagination:** get pagination working in SF as well ([#24](https://github.com/ghiscoding/slickgrid-universal/issues/24)) ([1132f2e](https://github.com/ghiscoding/slickgrid-universal/commit/1132f2edec251e2f65cce860ebfa57dbe35cf852))

* **picker:** add missing pre-header title grouping extractor ([fa3148b](https://github.com/ghiscoding/slickgrid-universal/commit/fa3148bd90487cad6bcd01b782ab27570336f741))

* **resize:** add a patch to fix autoresize on Chrome ([02faae4](https://github.com/ghiscoding/slickgrid-universal/commit/02faae44118dd5adbda57a5363567a84c84e7cb2))

* **sanitizer:** add optional grid option sanitizer anywhere possible ([#9](https://github.com/ghiscoding/slickgrid-universal/issues/9)) ([a6c7997](https://github.com/ghiscoding/slickgrid-universal/commit/a6c7997d75d27cc14892de4460dea28b529b392e))

* **select:** revert to jQuery 3.4.1 since latest version seems ([e839a5e](https://github.com/ghiscoding/slickgrid-universal/commit/e839a5e0f8ef8ab21a341ee2e2961c5a07736805))

* **sort:** header menu sorting should include columnId property ([2c5d2e0](https://github.com/ghiscoding/slickgrid-universal/commit/2c5d2e0547179f4cbe8f491a83af5202ba3410f9))

* **sort:** header menu sorting should include columnId property ([666a831](https://github.com/ghiscoding/slickgrid-universal/commit/666a83166ec21062bba9be287d65a242f7b52a1a))

* **styling:** cell menu is re-position incorrectly below the grid ([6fd3552](https://github.com/ghiscoding/slickgrid-universal/commit/6fd3552b568faef252e77b0446f2ab08d2a6ccde))

* **styling:** cell/context menus get re-position below the grid ([7db862a](https://github.com/ghiscoding/slickgrid-universal/commit/7db862ad6d7a939d1a285141068e2095c3295541))

* **styling:** sass variable should be interpolate before using calc ([42e7e3d](https://github.com/ghiscoding/slickgrid-universal/commit/42e7e3d51e6750f11a17f11d259fe97851505385))

* **tests:** fix failing unit test ([f19745d](https://github.com/ghiscoding/slickgrid-universal/commit/f19745d91d264d3da450a674b9ca9c78bf157294))

* **types:** fix TS type warnings ([d22ee64](https://github.com/ghiscoding/slickgrid-universal/commit/d22ee64dfaabae5b0e497ade62192b1c5595e0c3))

### Features

* **backend:** add OData & GraphQL packages ([#2](https://github.com/ghiscoding/slickgrid-universal/issues/2)) ([53cf08b](https://github.com/ghiscoding/slickgrid-universal/commit/53cf08bff2eea18e677770f70eedef1bda9aefcc))

* **browser:** add browserslist for packages who uses it ([fc69908](https://github.com/ghiscoding/slickgrid-universal/commit/fc69908a4eccfaedeb1835eb9d00719e7926065f))

* **build:** add correct TS types to all packages ([5ab0833](https://github.com/ghiscoding/slickgrid-universal/commit/5ab0833e07b89504ac603c3d356d2a6bdb0dfee2))

* **build:** tweak build to use tsc and test with sf lwc ([e4964b3](https://github.com/ghiscoding/slickgrid-universal/commit/e4964b34513e828d5cc9f2b278d794d892895277))

* **colspan:** add Header Grouping & Column Span example ([b9a155d](https://github.com/ghiscoding/slickgrid-universal/commit/b9a155dcf58c9a7c984ea1b6426883af0ae2f9ca))

* **core:** add `collectionAsync` option for both the Editors & Filters ([#16](https://github.com/ghiscoding/slickgrid-universal/issues/16)) ([f9488ab](https://github.com/ghiscoding/slickgrid-universal/commit/f9488ab350421be771f356b1775559a8e0d8e0c0))

* **core:** add Translation into demo with fetch locale from json file ([#23](https://github.com/ghiscoding/slickgrid-universal/issues/23)) ([b5608e9](https://github.com/ghiscoding/slickgrid-universal/commit/b5608e958f659b839a8460ffee4a555c66774893))

* **core:** dynamically add/remove columns ([#13](https://github.com/ghiscoding/slickgrid-universal/issues/13)) ([959097c](https://github.com/ghiscoding/slickgrid-universal/commit/959097cf8363330c7166d0844048cfde57a5cabc))

* **core:** expose all Extensions in new getter prop & fix draggable ([#29](https://github.com/ghiscoding/slickgrid-universal/issues/29)) ([07257b2](https://github.com/ghiscoding/slickgrid-universal/commit/07257b2564d86cbfad4f69bb4e910e04d7df5688))

* **core:** expose all services, slickgrid, dataview instances ([a33e387](https://github.com/ghiscoding/slickgrid-universal/commit/a33e3876b1134f6839aac10a67193448997ae7c5))

* **core:** use DataView transactions with multiple item changes ([#14](https://github.com/ghiscoding/slickgrid-universal/issues/14)) ([8cbd03a](https://github.com/ghiscoding/slickgrid-universal/commit/8cbd03a678bc6a2a89495685cc781b12946ec404))

* **demo:** add prod build for github page sample ([13eb721](https://github.com/ghiscoding/slickgrid-universal/commit/13eb721f88114461e1dda70eeba0461b69a89f46))

* **editor:** add more Editors ([f08864d](https://github.com/ghiscoding/slickgrid-universal/commit/f08864d0d583d01dece58570ea5bf8d1a195cdc9))

* **editor:** add operatorConditionalType (inclusive or exclusive) ([e300b31](https://github.com/ghiscoding/slickgrid-universal/commit/e300b313ae0d04ad2ec65f932e243d2b4150eca3))

* **editor:** add readonly option to DualInput Editor ([4217c41](https://github.com/ghiscoding/slickgrid-universal/commit/4217c411304d6056a6de6489351497418b72d9e6))

* **editor:** fully working dual input editor ([773fb49](https://github.com/ghiscoding/slickgrid-universal/commit/773fb49c1dbb6876bf8c2d2c53a1f823a84dd655))

* **editor:** start working on a Compound Editor ([49107c1](https://github.com/ghiscoding/slickgrid-universal/commit/49107c14ca841edf7c279e9a0ffe334f1d5dc71a))

* **editor:** tweak Dual Input Editor and add full unit tests ([c48e321](https://github.com/ghiscoding/slickgrid-universal/commit/c48e32189db48ced3c68e3427c64583db2d8d1d7))

* **editors:** add Autocomplete Editor ([011df55](https://github.com/ghiscoding/slickgrid-universal/commit/011df552c48defb32e81a1552e8b4e38f25be028))

* **editors:** add combo input editor poc code ([5918c73](https://github.com/ghiscoding/slickgrid-universal/commit/5918c73ea82e13183e8a6c14021f38ddf0f2b0fd))

* **editors:** add min/max length options to text editors ([#30](https://github.com/ghiscoding/slickgrid-universal/issues/30)) ([318c70c](https://github.com/ghiscoding/slickgrid-universal/commit/318c70ccbf0f071e328457d6290b6b1e078a1564))

* **editors:** add missing Date Editor ([c897c7c](https://github.com/ghiscoding/slickgrid-universal/commit/c897c7c426c179282766bba3345f4b44317aee44))

* **editors:** add more Editors and rewrite some in vanilla JS ([9308d4b](https://github.com/ghiscoding/slickgrid-universal/commit/9308d4b78a77a86a4b86fd10fb1de34746276a9e))

* **editors:** add more Editors and update all npm packages ([14b10a1](https://github.com/ghiscoding/slickgrid-universal/commit/14b10a17642b2c7f889f90b58dd3fef084e983b9))

* **editors:** extract most of the Editor Validators into separate files ([a9a45e6](https://github.com/ghiscoding/slickgrid-universal/commit/a9a45e6f2ce3536f9be846ef932337f174569897))

* **examples:** add more Tree View with checkbox selector code ([7d7c644](https://github.com/ghiscoding/slickgrid-universal/commit/7d7c644b0ecc8c3b61dd706d37d31edd0cf92fca))

* **examples:** add new sample to showcase queued editing ([#28](https://github.com/ghiscoding/slickgrid-universal/issues/28)) ([3b8fec6](https://github.com/ghiscoding/slickgrid-universal/commit/3b8fec6e890fc0b8dc9754495c1022d898740b3e))

* **extension:** add latest slickgrid with RowMove improvements ([c10fffd](https://github.com/ghiscoding/slickgrid-universal/commit/c10fffdb2bd8a8ce0221e570cf0bfb4cf03c7c29))

* **extensions:** add more Extensions and all their unit tests ([30af496](https://github.com/ghiscoding/slickgrid-universal/commit/30af496c48233ff84ce548648994398db068dbcb))

* **filter:** add Filter Service, Filter Conditions and few unit tests ([2baed7f](https://github.com/ghiscoding/slickgrid-universal/commit/2baed7fa0c31d73437b3d08d2d48c91b05602ff9))

* **filter:** refactor Filter Service by adding a debounce fn ([#7](https://github.com/ghiscoding/slickgrid-universal/issues/7)) ([3ba243c](https://github.com/ghiscoding/slickgrid-universal/commit/3ba243ce3b4ade48531ca323a12b465b5ad0b091))

* **filters:** add Autocomplete Filter ([82bda77](https://github.com/ghiscoding/slickgrid-universal/commit/82bda776c9cb72c9d44aca24ecf289c839e6e24f))

* **filters:** add few Filters and their unit tests ([c7e5897](https://github.com/ghiscoding/slickgrid-universal/commit/c7e5897d2e2af93339ea28a2fabc5263015d7d2c))

* **filters:** add few more Filters ([76b4177](https://github.com/ghiscoding/slickgrid-universal/commit/76b41771bd55e846ee67c9100b0de29ddb0a9276))

* **filters:** add missing Date Filters ([76c66a3](https://github.com/ghiscoding/slickgrid-universal/commit/76c66a3ec2da4b1ff1b296851f46bf58967adc18))

* **footer:** add Custom Footer ([0d3e1da](https://github.com/ghiscoding/slickgrid-universal/commit/0d3e1dabf29c4bc354df598a3b166030f61769fc))

* **footer:** add Custom Footer component ([#5](https://github.com/ghiscoding/slickgrid-universal/issues/5)) ([59d0ba8](https://github.com/ghiscoding/slickgrid-universal/commit/59d0ba8921c2e0886b0c34705ac5a74f35ab4e43))

* **grouping:** add missing Grouping interface properties ([7c83fd0](https://github.com/ghiscoding/slickgrid-universal/commit/7c83fd09acff960b86f62a0bd0c1f4b654b25f9c))

* **grouping:** add more Grouping & Aggregators code ([8c20808](https://github.com/ghiscoding/slickgrid-universal/commit/8c20808d9a8b0a6166f4fb8fe013d33ae57a223c))

* **package:** add new Excel Export package ([808785e](https://github.com/ghiscoding/slickgrid-universal/commit/808785e0ea9508f817453211d8ed808398aa9c01))

* **package:** add new Export (csv, txt) package ([d6adc5c](https://github.com/ghiscoding/slickgrid-universal/commit/d6adc5ce7aa466fde3c1e1377bd47c9a6cd8b53b))

* **pinning:** add "Freezen Columns" to header menu ([#4](https://github.com/ghiscoding/slickgrid-universal/issues/4)) ([1c7d49f](https://github.com/ghiscoding/slickgrid-universal/commit/1c7d49f838a8cadb093dfbdf81c215ed250fbe14))

* **presets:** add missing row selections preset option ([#11](https://github.com/ghiscoding/slickgrid-universal/issues/11)) ([e0a729c](https://github.com/ghiscoding/slickgrid-universal/commit/e0a729cfbbe7aa75a18301b4db994ac9d3330f10))

* **query:** add queryFieldNameGetterFn callback know which field to use ([6d8955c](https://github.com/ghiscoding/slickgrid-universal/commit/6d8955c1933a88683c2284d9162e43248bc578a2))

* **service:** add GridEvent Service to the lib ([4a4bf6f](https://github.com/ghiscoding/slickgrid-universal/commit/4a4bf6f86ebdb6cbf911d838714440cceee4e07f))

* **services:** add Pagination & Grid State Services ([c15e6e6](https://github.com/ghiscoding/slickgrid-universal/commit/c15e6e63edce6f07751f3380229e9e1777c43d84))

* **services:** add registerServices in Grid Options ([#1](https://github.com/ghiscoding/slickgrid-universal/issues/1)) ([e7c2e91](https://github.com/ghiscoding/slickgrid-universal/commit/e7c2e91842eac2044ccdd82673bfade20b24ab4f))

* **sort:** add valueCouldBeUndefined column flag to help sorting ([6d2b6a6](https://github.com/ghiscoding/slickgrid-universal/commit/6d2b6a6b7521511470c27c17ce65784258a87868))

* **sorting:** header menu clear sort, reset sorting when nothing left ([032886b](https://github.com/ghiscoding/slickgrid-universal/commit/032886bf6da9e3d711a17d23481c47ccf81af353))

* **style:** tweak Editors styling and add Sort icon hint on hover ([aba4182](https://github.com/ghiscoding/slickgrid-universal/commit/aba41826659844519da1ef170f0b3641a0d91af0))

* **styling:** add a Salesforce theme ([3b62101](https://github.com/ghiscoding/slickgrid-universal/commit/3b62101413dc3eb4eeb5df7772db3b885d7ae7c5))

* **styling:** add css autoprefixer ([2e89c28](https://github.com/ghiscoding/slickgrid-universal/commit/2e89c287ea0ed5a508f2e977cae21ecc35ed414d))

* **styling:** add edit icon when hovering editable cell with SF Theme ([eef4403](https://github.com/ghiscoding/slickgrid-universal/commit/eef4403b8e9168ff119eb97ca5c663101104abae))

* **styling:** add material design icons to npm & scss instead of html ([9e9a1ca](https://github.com/ghiscoding/slickgrid-universal/commit/9e9a1ca7794eb807494bfbd837aa7e17ad4b42b2))

* **styling:** add more material design stylings ([680788b](https://github.com/ghiscoding/slickgrid-universal/commit/680788b9b456c6d87875234d9f2c033cfbb7e18f))

* **styling:** material theme, replace all built-in Font char to SVG ([ed25d6a](https://github.com/ghiscoding/slickgrid-universal/commit/ed25d6ae4848b614c84da111ff894eedb5be6400))

* **styling:** salesforce theme, replace all built-in Font char to SVG ([1c5f341](https://github.com/ghiscoding/slickgrid-universal/commit/1c5f3414d8bafea7cb393033c9753aef4ad66b2f))

* **styling:** update Material Design font and some material styling ([c7ecbf9](https://github.com/ghiscoding/slickgrid-universal/commit/c7ecbf91b000e0758df04f87f49c35c1293f0abe))

* **tests:** add export abstract classes and add few more unit tests ([13a1bca](https://github.com/ghiscoding/slickgrid-universal/commit/13a1bcac7c21666f2b006f3488036175b29b1b3d))

* **tests:** add Jest to lib root and add few more unit tests ([5811c96](https://github.com/ghiscoding/slickgrid-universal/commit/5811c96568c5255376ea6b97b132f4f0fded0647))

* **tests:** add more Jest unit tests & commands ([d4da547](https://github.com/ghiscoding/slickgrid-universal/commit/d4da547aaae797767140d73289d7f50874fdd09e))

* **tests:** add queryFieldNameGetterFn callback unit tests ([6426793](https://github.com/ghiscoding/slickgrid-universal/commit/64267931dd6ad5506c52da2b19854d2a56d2104f))

* **tests:** rename to slick-vanilla-grid-bundle and add unit tests ([#12](https://github.com/ghiscoding/slickgrid-universal/issues/12)) ([006c302](https://github.com/ghiscoding/slickgrid-universal/commit/006c30251ea1d473e5d1ae54d20c050fccf0e6a4))

* **translate:** add namespace prefix + separator grid option ([90b1b2e](https://github.com/ghiscoding/slickgrid-universal/commit/90b1b2ec0c1a55d23ebcc47b6a88d972c9bbcdb7))

* **tree:** add Collapse/Expand All comands in context menu ([0b58d5e](https://github.com/ghiscoding/slickgrid-universal/commit/0b58d5e3727541fa088a1eeb9e49bb55f367b7c5))

* **tree:** add Tree Data multi-column Filtering support ([f9b4863](https://github.com/ghiscoding/slickgrid-universal/commit/f9b4863810da47138be7f83222ee49d87b4e20c0))

* **tree:** fixed recursive methods to sort hierarchical array ([6bc2915](https://github.com/ghiscoding/slickgrid-universal/commit/6bc29158395e6f3c9e3fbf87358d3ecb5fb12b75))

* **tree:** get a functional Tree View example working with add item ([c07cdb5](https://github.com/ghiscoding/slickgrid-universal/commit/c07cdb545106fd845a105a28014daabaa2860137))
