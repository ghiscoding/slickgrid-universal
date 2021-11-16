# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.19.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.19.0...v0.19.1) (2021-11-15)


### Bug Fixes

* **export:** sanitize any html that could exist in header titles ([abdae52](https://github.com/ghiscoding/slickgrid-universal/commit/abdae52822c4496286a653ed84be964213e1d32f))






# [0.19.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.18.0...v0.19.0) (2021-10-28)


### Features

* **plugin:** add row move shadown item while moving/dragging row ([c665ec8](https://github.com/ghiscoding/slickgrid-universal/commit/c665ec88be859feeea89e5ab8826f2b0a57c5cfb))
* add async process to use with Promise/Observable ([7350a6d](https://github.com/ghiscoding/slickgrid-universal/commit/7350a6d06ef5bb8495a05e22421f9b7b5a4270cb))
* add auto-position depending on available space ([82d6134](https://github.com/ghiscoding/slickgrid-universal/commit/82d6134003900ca8e345bd02a35e3830476638e3))
* **plugin:** create new Custom Tooltip plugin ([4c8c4f6](https://github.com/ghiscoding/slickgrid-universal/commit/4c8c4f62423665bc2e1dcf0675b1300607397b6a))






# [0.18.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.17.0...v0.18.0) (2021-09-29)


### Features

* **Resizer:** add useResizeObserver option ([bb33cdd](https://github.com/ghiscoding/slickgrid-universal/commit/bb33cdd716834913846ab2fcf74a84f8424acf92))
* **tree:** new `excludeChildrenWhenFilteringTree` set as new default ([47df943](https://github.com/ghiscoding/slickgrid-universal/commit/47df943414f383a47062a7ad9245700a1bd8a24e))






# [0.17.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.16.2...v0.17.0) (2021-09-09)


### Bug Fixes

* **core:** potential event binding leaks not all removed when disposing ([3e61712](https://github.com/ghiscoding/slickgrid-universal/commit/3e61712156f3b76b48b04d66bb05f2533f041831))
* **footer:** use `getFilteredItemCount` to show correct count, fix [#469](https://github.com/ghiscoding/slickgrid-universal/issues/469) ([963235c](https://github.com/ghiscoding/slickgrid-universal/commit/963235c017c28309460d2cb88de88c880ac0cb4f))


### Features

* **backend:** add cancellable onBeforeSearchChange & revert on error ([b26a53d](https://github.com/ghiscoding/slickgrid-universal/commit/b26a53d2e1fc7172c8c054b9c27ab1b3a2d3dff6))
* **backend:** add cancellable onBeforeSort & revert sort on error ([958f823](https://github.com/ghiscoding/slickgrid-universal/commit/958f823a6bffedc2c146c7c68d49a29419812995))
* **backend:** add cancellable Pagination change & revert on error ([7a8d903](https://github.com/ghiscoding/slickgrid-universal/commit/7a8d9038f230ba433f2773c02992a211a322ebd4))
* **composite:** move SlickGrid Composite Editor factory into universal ([c813cea](https://github.com/ghiscoding/slickgrid-universal/commit/c813ceac1ed6535963df15e7933a444de3a8790a))
* **tree:** add `dynamicallyToggledItemState` method to toggle parent(s) ([26369f9](https://github.com/ghiscoding/slickgrid-universal/commit/26369f9b6c9e81ad5705f580896ab28cf362d090))





## [0.16.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.16.1...v0.16.2) (2021-07-23)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.16.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.16.0...v0.16.1) (2021-07-16)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





# [0.16.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.15.0...v0.16.0) (2021-07-16)


### Bug Fixes

* **examples:** onBeforeEditCell should return bool true/false ([382bfc8](https://github.com/ghiscoding/slickgrid-universal/commit/382bfc8d9f8bc2c176d617bd49e9b9b230c47be9))





# [0.15.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.14.1...v0.15.0) (2021-07-06)


### Bug Fixes

* **addon:** providing columnIndexPosition should always work ([42c8cff](https://github.com/ghiscoding/slickgrid-universal/commit/42c8cff7dd6cf9103149445969be289710549590))
* **demo:** we should be able to move row(s) and keep selections ([d5669a1](https://github.com/ghiscoding/slickgrid-universal/commit/d5669a1d9c07680540d084dad6e1ef06faca0357))
* **pagination:** should be able to toggle Pagination ([c0367c2](https://github.com/ghiscoding/slickgrid-universal/commit/c0367c24da2ccb3558e1b27f8e70a81d84201479))
* **Pagination:** the Pagination wasn't showing when using dataset setter ([ac3f933](https://github.com/ghiscoding/slickgrid-universal/commit/ac3f933d9829edcf89e5ea15571da9a7e4b7c4ba))
* **plugin:** row move shouldn't go further when onBefore returns false ([e9bfb5c](https://github.com/ghiscoding/slickgrid-universal/commit/e9bfb5ceba6a18a020b8b34f72abba6e3d13d8b8))
* **styling:** address latest dart-sass math division deprecation warning ([b7317d8](https://github.com/ghiscoding/slickgrid-universal/commit/b7317d8fa619b35fb65789e12b268d65ff65968c))


### Features

* **services:** decouple the EventPubSubService to separate package ([9f51665](https://github.com/ghiscoding/slickgrid-universal/commit/9f516655e9ce5f06e0cfeabc43536834dc38c70b))
* **styling:** add a new `color-disabled-dark` ([55c3062](https://github.com/ghiscoding/slickgrid-universal/commit/55c30621241ec5da7a2e19879265c4e15a6ad907))
* **styling:** add a new `color-disabled` ([7151198](https://github.com/ghiscoding/slickgrid-universal/commit/7151198dd393c0bc93151cc4dc9c3295917b6b3e))
* **styling:** add extra material icons & new color ([4205b66](https://github.com/ghiscoding/slickgrid-universal/commit/4205b664e80af691c72d5520e4778ad4cd7d94b3))
* **tree:** add `getItemCount` method with optional tree level ([b3f8f94](https://github.com/ghiscoding/slickgrid-universal/commit/b3f8f9484e7ea352b2ed264c6a27e1e091eaf918))
* **tree:** add Tree Collapse Grid State/Preset ([998b01a](https://github.com/ghiscoding/slickgrid-universal/commit/998b01a2f10ccee5636f616921dd86b35a4feaec))
* **tree:** add ways to reapply Tree Collapse previous state ([3702ed3](https://github.com/ghiscoding/slickgrid-universal/commit/3702ed32629f84397349147c978ca650043c45eb))






## [0.14.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.14.0...v0.14.1) (2021-05-22)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





# [0.14.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.13.0...v0.14.0) (2021-05-22)


### Bug Fixes

* **frozen:** rollback previous commit since the issue was found in SlickGrid (core) ([780bcd7](https://github.com/ghiscoding/slickgrid-universal/commit/780bcd7bfae35e26cd84c9a6d220e2dab9eca3b4))
* **tree:** Tree Data export should also include correct indentation ([f1e06c1](https://github.com/ghiscoding/slickgrid-universal/commit/f1e06c11f9eaa9ee778d319bfbaba20bb9abfcc9))
* add item should work in the demo even with filter preset ([d9c97eb](https://github.com/ghiscoding/slickgrid-universal/commit/d9c97ebb587184e94439f6fde1ec8c8a739e7bfa))
* add item to flat and/or tree should both work ([1b19028](https://github.com/ghiscoding/slickgrid-universal/commit/1b19028c9d58a31597906e371f439b094bca7ff0))
* adding optional tree level property should be used when sorting ([a3598c5](https://github.com/ghiscoding/slickgrid-universal/commit/a3598c519a875585498cc828b5a0e76e95890795))
* addItem from grid service should work with tree data ([8b468f0](https://github.com/ghiscoding/slickgrid-universal/commit/8b468f055144b001378395546519d1801e046a0a))
* export to file/excel should also have tree indentation ([8c4c2b8](https://github.com/ghiscoding/slickgrid-universal/commit/8c4c2b8d30bb78e927f0a28bb0f7bef81e95d789))
* Grid Service addItem should invalidate hierarchical dataset itself ([066e894](https://github.com/ghiscoding/slickgrid-universal/commit/066e894271603562b10e014c4febfb18626e54f0))
* return all onBeforeX events in delayed promise to fix spinner ([bb36d1a](https://github.com/ghiscoding/slickgrid-universal/commit/bb36d1af114031eb973cf9993bdb9be1dd050de3))
* **tree:** couple of issues found in Tree Data, fixes [#307](https://github.com/ghiscoding/slickgrid-universal/issues/307) ([e684d1a](https://github.com/ghiscoding/slickgrid-universal/commit/e684d1af1c078a8861c3c94fe5486cbe68d57b85))


### Features

* **editors:** add `compositeEditorFormOrder` option ([03f2d66](https://github.com/ghiscoding/slickgrid-universal/commit/03f2d662a69d71edf4b61cdda862fb4eef0f9b47))
* **editors:** add ways to preload date without closing date picker ([3088038](https://github.com/ghiscoding/slickgrid-universal/commit/30880380584b281c756e0ad437031631e6f607e0))
* **resizer:** add `resizeByContentOnlyOnFirstLoad` grid option ([ffe7dc4](https://github.com/ghiscoding/slickgrid-universal/commit/ffe7dc4c2a7ae778c8e731fd7637b154c10035f0))
* **resizer:** add single Column Resize by Content dblClick & headerMenu ([683389f](https://github.com/ghiscoding/slickgrid-universal/commit/683389fcc343ac5c0378a9e34b7f11dda97fc719))
* **styling:** add new marker material icons for project ([9b386fa](https://github.com/ghiscoding/slickgrid-universal/commit/9b386fa3e6af8e76cf4beb5aa0b5322db2f270af))
* add `titleFormatter` to Tree Data ([8bf32ca](https://github.com/ghiscoding/slickgrid-universal/commit/8bf32caa08a6c5a28c7114cb8abe33a5ed9bc4cb))
* add few pubsub events to help with big dataset ([360c62c](https://github.com/ghiscoding/slickgrid-universal/commit/360c62cb0979792dddef8fab39383266c0d855e3))
* add optional child value prefix to Tree Formatter ([9da9662](https://github.com/ghiscoding/slickgrid-universal/commit/9da966298120686929ab3dd2f276574d7f6c8c7e))
* **tree:** improve Tree Data speed considerably ([5487798](https://github.com/ghiscoding/slickgrid-universal/commit/548779801d06cc9ae7e319e72d351c8a868ed79f))






# [0.13.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.12.0...v0.13.0) (2021-04-27)


### Bug Fixes

* **demo:** call `scrollColumnIntoView` after changing view ([b751151](https://github.com/ghiscoding/slickgrid-universal/commit/b751151fb11dfaeb48ff1f4daf5ed32ad56122a0))
* **exports:** grid with colspan should be export accordingly ([#311](https://github.com/ghiscoding/slickgrid-universal/issues/311)) ([e899fbb](https://github.com/ghiscoding/slickgrid-universal/commit/e899fbba3daa41261dcaa57b0555e37e9bdfafb4))
* **footer:** add correct implemtation of locale usage in custom footer ([6e18bf9](https://github.com/ghiscoding/slickgrid-universal/commit/6e18bf9a8af070428bbb3cb429392df1eb19be54))


### Features

* **footer:** add row selection count to the footer component ([8ba146c](https://github.com/ghiscoding/slickgrid-universal/commit/8ba146cd4cbdccdb61f3441918065fad4561ff84))
* **resize:** add column resize by cell content ([#309](https://github.com/ghiscoding/slickgrid-universal/issues/309)) ([515a072](https://github.com/ghiscoding/slickgrid-universal/commit/515a072b3a16d3aca0f48e62c968ae89a1510669))
* **styling:** switch from node-sass to dart-sass (sass) ([81f8d9f](https://github.com/ghiscoding/slickgrid-universal/commit/81f8d9fbd1381b4c877eeeb4992bdcc90c1cd677))






# [0.12.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.11.2...v0.12.0) (2021-03-24)


### Bug Fixes

* **filters:** SearchTerms shouldn't come back after calling clearFilters ([04f3d12](https://github.com/ghiscoding/slickgrid-universal/commit/04f3d1267de493b9dc1e922dca3b433b9cb34fde))
* **filters:** string <> should be Not Contains instead of Not Equal ([#276](https://github.com/ghiscoding/slickgrid-universal/issues/276)) ([960884d](https://github.com/ghiscoding/slickgrid-universal/commit/960884ddf58b1e87ad5ef71e3713f8836e6190c0))
* **pinning:** reordering cols position freezing cols shouldn't affect ([#275](https://github.com/ghiscoding/slickgrid-universal/issues/275)) ([a30665d](https://github.com/ghiscoding/slickgrid-universal/commit/a30665d54da583c47b1f533002173af99e9ab20d))


### Features

* **editors:** add `onSelect` callback to Autocomplete Editor ([#286](https://github.com/ghiscoding/slickgrid-universal/issues/286)) ([2d106d4](https://github.com/ghiscoding/slickgrid-universal/commit/2d106d4df0a259d36bee3d910320706ddb7e8580))
* **filters:** display operator into input text filter from Grid Presets ([#288](https://github.com/ghiscoding/slickgrid-universal/issues/288)) ([3fad4fe](https://github.com/ghiscoding/slickgrid-universal/commit/3fad4fe9ef3bec290dabb860d7ea4baf8f182a4a))
* **resources:** add RxJS support into Slickgrid-Universal via external package ([#280](https://github.com/ghiscoding/slickgrid-universal/issues/280)) ([c10fc33](https://github.com/ghiscoding/slickgrid-universal/commit/c10fc339019c04ec0f7c4357ccdb3949a2358460))
* **state:** add Pinning (frozen) to Grid State & Presets ([#292](https://github.com/ghiscoding/slickgrid-universal/issues/292)) ([ba703d8](https://github.com/ghiscoding/slickgrid-universal/commit/ba703d8353a243ffed4d40804c0f977119424f6c))






## [0.11.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.11.1...v0.11.2) (2021-02-27)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.11.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.11.0...v0.11.1) (2021-02-27)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





# [0.11.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.10.2...v0.11.0) (2021-02-27)


### Bug Fixes

* **build:** enable tsconfig strict mode tsconfig ([#269](https://github.com/ghiscoding/slickgrid-universal/issues/269)) ([095fc71](https://github.com/ghiscoding/slickgrid-universal/commit/095fc71052c1f4e776544781da5fe762cfa16238))
* **filters:** use defaultFilterOperator in range when none provided ([#271](https://github.com/ghiscoding/slickgrid-universal/issues/271)) ([993675f](https://github.com/ghiscoding/slickgrid-universal/commit/993675f6b0d76e76010d5cadc6696134a73dad66))
* **plugin:** recreate header menu when adding column dynamically ([#257](https://github.com/ghiscoding/slickgrid-universal/issues/257)) ([16c4984](https://github.com/ghiscoding/slickgrid-universal/commit/16c49845c5d3388502811c15f0a23daa1a01f850))


### Features

* **demo:** add Example 13 Header Button Plugin ([f345cd1](https://github.com/ghiscoding/slickgrid-universal/commit/f345cd18b89f849f3f873538c214d3ac24ff12f8))
* **editors:** add a Clear (X) button to the Autocomplete Editor ([#270](https://github.com/ghiscoding/slickgrid-universal/issues/270)) ([ffbd188](https://github.com/ghiscoding/slickgrid-universal/commit/ffbd188534992c31848691154517deb64694f3b2))
* **filters:** add updateSingleFilter for a single external filter ([#265](https://github.com/ghiscoding/slickgrid-universal/issues/265)) ([20564a3](https://github.com/ghiscoding/slickgrid-universal/commit/20564a3096948626beada698460b72374a18ca7c))
* **perf:** huge filtering speed improvements ([a101ed1](https://github.com/ghiscoding/slickgrid-universal/commit/a101ed1b62c2fbfec2712f64e08192a4852bce9d))





## [0.10.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.10.1...v0.10.2) (2021-01-28)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.10.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.10.0...v0.10.1) (2021-01-28)

**Note:** Version bump only for package webpack-demo-vanilla-bundle






# [0.10.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.9.0...v0.10.0) (2021-01-28)


### Bug Fixes

* **editors:** add blank disabled fields in Composite Editor form values ([#233](https://github.com/ghiscoding/slickgrid-universal/issues/233)) ([b634902](https://github.com/ghiscoding/slickgrid-universal/commit/b6349029b705991b7ac2d1df99f5b330fe69ef36))
* **lint:** add eslint as a pre task when bundling & fix linting errors ([#246](https://github.com/ghiscoding/slickgrid-universal/issues/246)) ([6f7ccd8](https://github.com/ghiscoding/slickgrid-universal/commit/6f7ccd8ee4cc5e005034965a2c2dcc0499f06a73))


### Features

* **editors:** add Clone functionality to Composite Editor ([#236](https://github.com/ghiscoding/slickgrid-universal/issues/236)) ([df545e4](https://github.com/ghiscoding/slickgrid-universal/commit/df545e4ec64271307b1979feb5e786f449433639))
* **formatters:** add grid option to auto add custom editor formatter ([#248](https://github.com/ghiscoding/slickgrid-universal/issues/248)) ([db77d46](https://github.com/ghiscoding/slickgrid-universal/commit/db77d464ee37eda573351e89d4c5acc9b5648649))





# [0.9.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.8.0...v0.9.0) (2021-01-06)


### Bug Fixes

* **build:** import Flatpickr Locale on demand via regular imports ([#227](https://github.com/ghiscoding/slickgrid-universal/issues/227)) ([6644822](https://github.com/ghiscoding/slickgrid-universal/commit/664482210557fc1a7a178856e2641f71b9580c44))


### Features

* **build:** upgrade to WebPack 5 ([#225](https://github.com/ghiscoding/slickgrid-universal/issues/225)) ([c6b3ad3](https://github.com/ghiscoding/slickgrid-universal/commit/c6b3ad3eb6fb64306bfd8bd300fcc1e86b27e5a6))
* **editors:** add Column Editor collectionOverride option ([#228](https://github.com/ghiscoding/slickgrid-universal/issues/228)) ([91421fc](https://github.com/ghiscoding/slickgrid-universal/commit/91421fc0154e432874fb2211e430a79032b996b8))






# [0.8.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.7...v0.8.0) (2020-12-22)


### Features

* **filters:** add Autocomplete/Select Filters collection observers ([#208](https://github.com/ghiscoding/slickgrid-universal/issues/208)) ([3b3b463](https://github.com/ghiscoding/slickgrid-universal/commit/3b3b4631e5d878ba72d5f2579c5a6b05cc1a7028))





## [0.7.7](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.6...v0.7.7) (2020-12-20)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.7.6](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.5...v0.7.6) (2020-12-20)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.7.5](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.4...v0.7.5) (2020-12-20)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.7.4](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.3...v0.7.4) (2020-12-20)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.7.3](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.2...v0.7.3) (2020-12-20)


### Bug Fixes

* **exports:** should be able to change export file name ([#205](https://github.com/ghiscoding/slickgrid-universal/issues/205)) ([9d26213](https://github.com/ghiscoding/slickgrid-universal/commit/9d262134b12da46ef1fea970f092d96ce875ed78))






## [0.7.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.1...v0.7.2) (2020-12-17)

**Note:** Version bump only for package webpack-demo-vanilla-bundle






## [0.7.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.0...v0.7.1) (2020-12-17)

**Note:** Version bump only for package webpack-demo-vanilla-bundle






# [0.7.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.6.0...v0.7.0) (2020-12-16)


### Features

* **core:** methods to change column positions/visibilities dynamically ([#200](https://github.com/ghiscoding/slickgrid-universal/issues/200)) ([5048a4b](https://github.com/ghiscoding/slickgrid-universal/commit/5048a4b969f337f002dad552197d02f970590c73))





# [0.6.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.5.1...v0.6.0) (2020-12-14)


### Bug Fixes

* **demo:** changing page should remove unsaved cell styling ([17fa349](https://github.com/ghiscoding/slickgrid-universal/commit/17fa3499e298798fdeccf908feb0f0e5ee40436e))
* **stylings:** re-align the svg icons & single/multiple-select icon+text ([#194](https://github.com/ghiscoding/slickgrid-universal/issues/194)) ([b730be7](https://github.com/ghiscoding/slickgrid-universal/commit/b730be7a75b3035c01aa7ca8f48a88df447ad461))


### Features

* **core:** add registerExternalResources for Components/Services ([#196](https://github.com/ghiscoding/slickgrid-universal/issues/196)) ([ee02f1d](https://github.com/ghiscoding/slickgrid-universal/commit/ee02f1d62d1a0601421352e43d17bd8c89e4348c))





## [0.5.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.5.0...v0.5.1) (2020-12-10)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





# [0.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.4.2...v0.5.0) (2020-12-10)


### Bug Fixes

* **editors:** Select Editor option to return flat data w/complex object ([#189](https://github.com/ghiscoding/slickgrid-universal/issues/189)) ([4695cd3](https://github.com/ghiscoding/slickgrid-universal/commit/4695cd3b6871dc1ceca4036fd30935eca8011b7e))


### Features

* **components:** extract CompositeEditor & EmptyWarning Components ([#191](https://github.com/ghiscoding/slickgrid-universal/issues/191)) ([00cf9a2](https://github.com/ghiscoding/slickgrid-universal/commit/00cf9a22e1924a46ed637d52bba8efc02ef7eea1))





## [0.4.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.4.1...v0.4.2) (2020-12-07)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.4.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.4.0...v0.4.1) (2020-12-07)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





# [0.4.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.3.0...v0.4.0) (2020-12-07)


### Features

* **editors:** add few editor options to LongText (textarea) Editor ([a975882](https://github.com/ghiscoding/slickgrid-universal/commit/a975882ce0772728a7bcd2bc75131d650b093144))





# [0.3.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.2.15...v0.3.0) (2020-12-02)


### Bug Fixes

* **core:** showing/hiding column shouldn't affect its freezing position ([#185](https://github.com/ghiscoding/slickgrid-universal/issues/185)) ([2a812ed](https://github.com/ghiscoding/slickgrid-universal/commit/2a812edb82c8004ab43df224c67ede228ab72c00))





## [0.2.15](https://github.com/ghiscoding/slickgrid-universal/compare/v0.2.0...v0.2.15) (2020-11-30)


### Bug Fixes

* **core:** don't expose src folder on npm & update few npm package ([#168](https://github.com/ghiscoding/slickgrid-universal/issues/168)) ([3c05938](https://github.com/ghiscoding/slickgrid-universal/commit/3c059381b35bba88ea98d0206692c912c625f227))
* **core:** rename i18n to translater & fix few other issues ([#174](https://github.com/ghiscoding/slickgrid-universal/issues/174)) ([34c963a](https://github.com/ghiscoding/slickgrid-universal/commit/34c963a2bcef1b841d3c62ea405a4bc49be98a5c))
* **examples:** queued edit cells style should follow page it was edited ([#167](https://github.com/ghiscoding/slickgrid-universal/issues/167)) ([bf72139](https://github.com/ghiscoding/slickgrid-universal/commit/bf7213994151c148e878d703ea21d8f8ffb43ca8))
* **formatters:** date formatters should accept ISO input & output to US ([#172](https://github.com/ghiscoding/slickgrid-universal/issues/172)) ([85ce7cf](https://github.com/ghiscoding/slickgrid-universal/commit/85ce7cf3636d5bb43d3ef18ec6998bb0c423d218))





## [0.2.14](https://github.com/ghiscoding/slickgrid-universal/compare/webpack-demo-vanilla-bundle@0.2.13...webpack-demo-vanilla-bundle@0.2.14) (2020-11-26)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.2.13](https://github.com/ghiscoding/slickgrid-universal/compare/webpack-demo-vanilla-bundle@0.2.12...webpack-demo-vanilla-bundle@0.2.13) (2020-11-26)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.2.12](https://github.com/ghiscoding/slickgrid-universal/compare/webpack-demo-vanilla-bundle@0.2.11...webpack-demo-vanilla-bundle@0.2.12) (2020-11-25)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.2.11](https://github.com/ghiscoding/slickgrid-universal/compare/webpack-demo-vanilla-bundle@0.2.10...webpack-demo-vanilla-bundle@0.2.11) (2020-11-25)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.2.10](https://github.com/ghiscoding/slickgrid-universal/compare/webpack-demo-vanilla-bundle@0.2.9...webpack-demo-vanilla-bundle@0.2.10) (2020-11-25)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.2.9](https://github.com/ghiscoding/slickgrid-universal/compare/webpack-demo-vanilla-bundle@0.2.8...webpack-demo-vanilla-bundle@0.2.9) (2020-11-25)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.2.8](https://github.com/ghiscoding/slickgrid-universal/compare/webpack-demo-vanilla-bundle@0.2.7...webpack-demo-vanilla-bundle@0.2.8) (2020-11-25)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.2.7](https://github.com/ghiscoding/slickgrid-universal/compare/webpack-demo-vanilla-bundle@0.2.6...webpack-demo-vanilla-bundle@0.2.7) (2020-11-25)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.2.6](https://github.com/ghiscoding/slickgrid-universal/compare/webpack-demo-vanilla-bundle@0.2.5...webpack-demo-vanilla-bundle@0.2.6) (2020-11-25)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.2.5](https://github.com/ghiscoding/slickgrid-universal/compare/webpack-demo-vanilla-bundle@0.2.4...webpack-demo-vanilla-bundle@0.2.5) (2020-11-25)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.2.4](https://github.com/ghiscoding/slickgrid-universal/compare/webpack-demo-vanilla-bundle@0.2.3...webpack-demo-vanilla-bundle@0.2.4) (2020-11-25)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.2.3](https://github.com/ghiscoding/slickgrid-universal/compare/webpack-demo-vanilla-bundle@0.2.2...webpack-demo-vanilla-bundle@0.2.3) (2020-11-25)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.2.2](https://github.com/ghiscoding/slickgrid-universal/compare/webpack-demo-vanilla-bundle@0.2.1...webpack-demo-vanilla-bundle@0.2.2) (2020-11-25)

**Note:** Version bump only for package webpack-demo-vanilla-bundle





## [0.2.1](https://github.com/ghiscoding/slickgrid-universal/compare/webpack-demo-vanilla-bundle@0.2.0...webpack-demo-vanilla-bundle@0.2.1) (2020-11-25)


### Bug Fixes

* **core:** don't expose src folder on npm & update few npm package ([#168](https://github.com/ghiscoding/slickgrid-universal/issues/168)) ([3c05938](https://github.com/ghiscoding/slickgrid-universal/commit/3c059381b35bba88ea98d0206692c912c625f227))
* **examples:** queued edit cells style should follow page it was edited ([#167](https://github.com/ghiscoding/slickgrid-universal/issues/167)) ([bf72139](https://github.com/ghiscoding/slickgrid-universal/commit/bf7213994151c148e878d703ea21d8f8ffb43ca8))





# [0.2.0](https://github.com/ghiscoding/slickgrid-universal/compare/webpack-demo-vanilla-bundle@0.1.0...webpack-demo-vanilla-bundle@0.2.0) (2020-11-20)


### Bug Fixes

* **core:** clear dataset when disposing and fix few unsubscribed events to avoid leak ([#156](https://github.com/ghiscoding/slickgrid-universal/issues/156)) ([78c80b4](https://github.com/ghiscoding/slickgrid-universal/commit/78c80b43ca04fd4fff68791556f9d4ab37f06caa))
* **core:** empty warning message should work with multiple grids ([#158](https://github.com/ghiscoding/slickgrid-universal/issues/158)) ([9e7c023](https://github.com/ghiscoding/slickgrid-universal/commit/9e7c023f7d33313400f4e55ddffd838d290b83dd))
* **core:** fix some problems found with AutoComplete ([#74](https://github.com/ghiscoding/slickgrid-universal/issues/74)) ([00fb478](https://github.com/ghiscoding/slickgrid-universal/commit/00fb478263db832ec31d940ed19417d9fcbae04a))
* **core:** header columns grouping misbehave after hiding column ([#164](https://github.com/ghiscoding/slickgrid-universal/issues/164)) ([6b8232b](https://github.com/ghiscoding/slickgrid-universal/commit/6b8232b3b98d1b75412bebd6b4528ee5dea71d7a))
* **core:** mem leaks w/orphan DOM elements when disposing ([#153](https://github.com/ghiscoding/slickgrid-universal/issues/153)) ([faba5a6](https://github.com/ghiscoding/slickgrid-universal/commit/faba5a6652fa2cf5e78f64b6b2e27bf9b85936ba))
* **core:** properly remove event listeners when disposing ([#163](https://github.com/ghiscoding/slickgrid-universal/issues/163)) ([ecfb9a7](https://github.com/ghiscoding/slickgrid-universal/commit/ecfb9a7c623010504a7a2d312ffef185f16cec9e))
* **editor:** SingleSelect Editor should show pick false value ([#75](https://github.com/ghiscoding/slickgrid-universal/issues/75)) ([fdb2c84](https://github.com/ghiscoding/slickgrid-universal/commit/fdb2c8433d443dd8f4fdd86f714354424cfb9ea3))
* **editors:** autocomplete editor spinner aligned right in mass update ([#162](https://github.com/ghiscoding/slickgrid-universal/issues/162)) ([6ae5189](https://github.com/ghiscoding/slickgrid-universal/commit/6ae51897979d80f5639fb095406e83e182649252))
* **filters:** disregard time when filtering date only format ([#134](https://github.com/ghiscoding/slickgrid-universal/issues/134)) ([7bd2d19](https://github.com/ghiscoding/slickgrid-universal/commit/7bd2d1964de2e809d8b08c737231eec31d146fae))
* **translations:** HeaderMenu & Date Filters not translating ([#58](https://github.com/ghiscoding/slickgrid-universal/issues/58)) ([9416c4d](https://github.com/ghiscoding/slickgrid-universal/commit/9416c4d2642894c5660473419623cee9bebcac4b))


### Features

* **autocomplete:** add much more functionalities to the AutoComplete ([#69](https://github.com/ghiscoding/slickgrid-universal/issues/69)) ([93c3d0a](https://github.com/ghiscoding/slickgrid-universal/commit/93c3d0a9b8d5a30c7a933f95a4333937c95305a3))
* **core:** add "Empty Data" warning message when grid is empty ([#155](https://github.com/ghiscoding/slickgrid-universal/issues/155)) ([13875b4](https://github.com/ghiscoding/slickgrid-universal/commit/13875b455d60f44918d8524aa803374773276e90))
* **core:** rewrite "Empty Data" warning component to be in the canvas ([#157](https://github.com/ghiscoding/slickgrid-universal/issues/157)) ([78e2132](https://github.com/ghiscoding/slickgrid-universal/commit/78e213222d6058e1d1d768094801be42dbf4fb05))
* **core:** update few npm packages ([#123](https://github.com/ghiscoding/slickgrid-universal/issues/123)) ([1c25b87](https://github.com/ghiscoding/slickgrid-universal/commit/1c25b87fdd738616879298baeb52074e30e9bf14))
* **core:** update to latest SlickGrid version and update npm packages ([#140](https://github.com/ghiscoding/slickgrid-universal/issues/140)) ([d73a44e](https://github.com/ghiscoding/slickgrid-universal/commit/d73a44e338025da45e990a8a522fb0b9aa1c5279))
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
* **styling:** find way to add colors to SVGs used by the lib ([#73](https://github.com/ghiscoding/slickgrid-universal/issues/73)) ([8a07c16](https://github.com/ghiscoding/slickgrid-universal/commit/8a07c16ec3238533ab16fb22f8b748168cd5f18c))
* **tests:** add more Cypress E2E tests for grouping ([#125](https://github.com/ghiscoding/slickgrid-universal/issues/125)) ([814dec0](https://github.com/ghiscoding/slickgrid-universal/commit/814dec0dbad7cf59e98654a732dbf6d46de37a1a))






# 0.1.0 (2020-07-28)


### Bug Fixes

* **components:** both Footer/Pagination should always be 100% width ([#27](https://github.com/ghiscoding/slickgrid-universal/issues/27)) ([e587ef5](https://github.com/ghiscoding/slickgrid-universal/commit/e587ef5084d469c6342c84c5c2f6a0dc65ae4493))


### Features

* **core:** add Translation into demo with fetch locale from json file ([#23](https://github.com/ghiscoding/slickgrid-universal/issues/23)) ([b5608e9](https://github.com/ghiscoding/slickgrid-universal/commit/b5608e958f659b839a8460ffee4a555c66774893))
* **core:** expose all Extensions in new getter prop & fix draggable ([#29](https://github.com/ghiscoding/slickgrid-universal/issues/29)) ([07257b2](https://github.com/ghiscoding/slickgrid-universal/commit/07257b2564d86cbfad4f69bb4e910e04d7df5688))
* **core:** expose all services, slickgrid, dataview instances ([a33e387](https://github.com/ghiscoding/slickgrid-universal/commit/a33e3876b1134f6839aac10a67193448997ae7c5))
* **editors:** add min/max length options to text editors ([#30](https://github.com/ghiscoding/slickgrid-universal/issues/30)) ([318c70c](https://github.com/ghiscoding/slickgrid-universal/commit/318c70ccbf0f071e328457d6290b6b1e078a1564))
* **examples:** add new sample to showcase queued editing ([#28](https://github.com/ghiscoding/slickgrid-universal/issues/28)) ([3b8fec6](https://github.com/ghiscoding/slickgrid-universal/commit/3b8fec6e890fc0b8dc9754495c1022d898740b3e))
