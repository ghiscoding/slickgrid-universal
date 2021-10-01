# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
