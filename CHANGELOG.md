# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.10.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.10.1...v0.10.2) (2021-01-28)


### Bug Fixes

* **filter:** filter service not returning correct operator ([bd30697](https://github.com/ghiscoding/slickgrid-universal/commit/bd30697e1f3b6bf0e0d8b18b1c2ff30416ed022d))





## [0.10.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.10.0...v0.10.1) (2021-01-28)


### Bug Fixes

* **build:** decrease tsc target to es2017 instead of es2020 ([2f2e5f4](https://github.com/ghiscoding/slickgrid-universal/commit/2f2e5f46a3b25897f1a4a59daa1346b5d577ddb8))






# [0.10.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.9.0...v0.10.0) (2021-01-28)


### Bug Fixes

* **comp:** empty data warning should work with autoheight grid ([#240](https://github.com/ghiscoding/slickgrid-universal/issues/240)) ([8c9cb84](https://github.com/ghiscoding/slickgrid-universal/commit/8c9cb84847bfd08a678d333a8555ae6fc9295670))
* **component:** Composite Editor sometime shows empty mass update form ([#244](https://github.com/ghiscoding/slickgrid-universal/issues/244)) ([d3ad4db](https://github.com/ghiscoding/slickgrid-universal/commit/d3ad4db45d259fa8ab977cd45c830a7d3bd342d8))
* **components:** empty data warning should work with autoheight grid ([#234](https://github.com/ghiscoding/slickgrid-universal/issues/234)) ([16daa36](https://github.com/ghiscoding/slickgrid-universal/commit/16daa368f0e46112fc1d1dd0b1a944ec2b60ced0))
* **core:** fix types index.d.ts url ([a76b3a3](https://github.com/ghiscoding/slickgrid-universal/commit/a76b3a3d97a6d211ec2e7e8d9060fd8dd0719f58))
* **editors:** add blank disabled fields in Composite Editor form values ([#233](https://github.com/ghiscoding/slickgrid-universal/issues/233)) ([b634902](https://github.com/ghiscoding/slickgrid-universal/commit/b6349029b705991b7ac2d1df99f5b330fe69ef36))
* **editors:** add option to skip missing composite editor ([#232](https://github.com/ghiscoding/slickgrid-universal/issues/232)) ([925dba8](https://github.com/ghiscoding/slickgrid-universal/commit/925dba86aca57825ab04d0cdc01484d52bf99265))
* **editors:** fix clear date & blank disabled field w/Composite Editor ([#235](https://github.com/ghiscoding/slickgrid-universal/issues/235)) ([9aac97d](https://github.com/ghiscoding/slickgrid-universal/commit/9aac97d2d433c809facc8d7092467780d55ca01a))
* **exports:** Excel Export custom width applies the width to next column ([#242](https://github.com/ghiscoding/slickgrid-universal/issues/242)) ([146f64f](https://github.com/ghiscoding/slickgrid-universal/commit/146f64f1b89005e6bb5e982721b5c7e43ecf5ac4))
* **filters:** Grid State filters should always include an operator ([#238](https://github.com/ghiscoding/slickgrid-universal/issues/238)) ([f64ed37](https://github.com/ghiscoding/slickgrid-universal/commit/f64ed37f7ffe01346c8f68d4bd170ffdce54839d))
* **frozen:** hiding multiple columns when using pinning gets out of sync ([#243](https://github.com/ghiscoding/slickgrid-universal/issues/243)) ([b255220](https://github.com/ghiscoding/slickgrid-universal/commit/b255220ec37dbdc9df4f3ecccb4397656cf9f2a6))
* **lint:** add eslint as a pre task when bundling & fix linting errors ([#246](https://github.com/ghiscoding/slickgrid-universal/issues/246)) ([6f7ccd8](https://github.com/ghiscoding/slickgrid-universal/commit/6f7ccd8ee4cc5e005034965a2c2dcc0499f06a73))
* **pinning:** recalculate frozen idx properly when column shown changes ([#241](https://github.com/ghiscoding/slickgrid-universal/issues/241)) ([3b55972](https://github.com/ghiscoding/slickgrid-universal/commit/3b559726acdff96970c68c10c8d256d0403d6c4f))
* **plugins:** add missing Row Detail filtering code ([#239](https://github.com/ghiscoding/slickgrid-universal/issues/239)) ([d9cad63](https://github.com/ghiscoding/slickgrid-universal/commit/d9cad635840650d2b2dd91444ffa0121147f4140))
* **plugins:** throw error when Tree Data used with Pagination ([#229](https://github.com/ghiscoding/slickgrid-universal/issues/229)) ([85718e1](https://github.com/ghiscoding/slickgrid-universal/commit/85718e18cd181734df3ba1a2440ead4368741c53))
* **tsc:** running dev watch was overriding commonjs folder ([#249](https://github.com/ghiscoding/slickgrid-universal/issues/249)) ([e466f62](https://github.com/ghiscoding/slickgrid-universal/commit/e466f6214d9450b593daecfdee6682f1f7c9ed19))


### Features

* **editors:** add Clone functionality to Composite Editor ([#236](https://github.com/ghiscoding/slickgrid-universal/issues/236)) ([df545e4](https://github.com/ghiscoding/slickgrid-universal/commit/df545e4ec64271307b1979feb5e786f449433639))
* **editors:** add Column Editor collectionOverride option ([0efb18f](https://github.com/ghiscoding/slickgrid-universal/commit/0efb18f916ecd407ec1589bc18f076907fa356c7))
* **editors:** change all private keyword to protected for extensability ([#247](https://github.com/ghiscoding/slickgrid-universal/issues/247)) ([089b6cb](https://github.com/ghiscoding/slickgrid-universal/commit/089b6cbbdd6284d94f765fdad08642e0d0d81ff0))
* **filters:** change all private keyword to protected for extensability ([#245](https://github.com/ghiscoding/slickgrid-universal/issues/245)) ([52cc702](https://github.com/ghiscoding/slickgrid-universal/commit/52cc7022c4b847566d89e91a80c423373538a15a))
* **formatters:** add grid option to auto add custom editor formatter ([#248](https://github.com/ghiscoding/slickgrid-universal/issues/248)) ([db77d46](https://github.com/ghiscoding/slickgrid-universal/commit/db77d464ee37eda573351e89d4c5acc9b5648649))
* add nameCompositeEditor override to be used by Composite Editor ([fcdb2e9](https://github.com/ghiscoding/slickgrid-universal/commit/fcdb2e92ed736b09e947cdbcf39ee157afc4acab))





# [0.9.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.8.0...v0.9.0) (2021-01-06)


### Bug Fixes

* **backend:** GraphQL queries with input filter ([#217](https://github.com/ghiscoding/slickgrid-universal/issues/217)) ([ff7f1e5](https://github.com/ghiscoding/slickgrid-universal/commit/ff7f1e5e8733d25a1fd7869e4de2b1bc700b8a7b))
* **backend:** OData queries with input filter ([#224](https://github.com/ghiscoding/slickgrid-universal/issues/224)) ([fec1ce8](https://github.com/ghiscoding/slickgrid-universal/commit/fec1ce879507998a04088bf494cfd5a595e90160))
* **build:** import Flatpickr Locale on demand via regular imports ([#227](https://github.com/ghiscoding/slickgrid-universal/issues/227)) ([6644822](https://github.com/ghiscoding/slickgrid-universal/commit/664482210557fc1a7a178856e2641f71b9580c44))
* **core:** adjust vscode debugger path overrides for WebPack 5 debugging ([a45b3d2](https://github.com/ghiscoding/slickgrid-universal/commit/a45b3d2aa318012366c98fa5b4b3c95cc647120d))


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

**Note:** Version bump only for package slickgrid-universal





## [0.7.6](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.5...v0.7.6) (2020-12-20)

**Note:** Version bump only for package slickgrid-universal





## [0.7.5](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.4...v0.7.5) (2020-12-20)

**Note:** Version bump only for package slickgrid-universal





## [0.7.4](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.3...v0.7.4) (2020-12-20)

**Note:** Version bump only for package slickgrid-universal





## [0.7.3](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.2...v0.7.3) (2020-12-20)


### Bug Fixes

* **components:** don't instantiate composite editor twice ([#207](https://github.com/ghiscoding/slickgrid-universal/issues/207)) ([8548393](https://github.com/ghiscoding/slickgrid-universal/commit/854839358bf276432169447bebefe736de02f57d))
* **editors:** fix BS3,BS4 styles & slider value not shown with undefined ([#204](https://github.com/ghiscoding/slickgrid-universal/issues/204)) ([3aca8f9](https://github.com/ghiscoding/slickgrid-universal/commit/3aca8f9053365c1987f6c5abc43f8ce5eca015fb))
* **exports:** should be able to change export file name ([#205](https://github.com/ghiscoding/slickgrid-universal/issues/205)) ([9d26213](https://github.com/ghiscoding/slickgrid-universal/commit/9d262134b12da46ef1fea970f092d96ce875ed78))






## [0.7.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.1...v0.7.2) (2020-12-17)


### Bug Fixes

* **core:** range default should be inclusive instead of exclusive ([#203](https://github.com/ghiscoding/slickgrid-universal/issues/203)) ([b7f74ad](https://github.com/ghiscoding/slickgrid-universal/commit/b7f74ad8a1539aed32ac643b4fe395fbdecf4459))
* **sorting:** add cellValueCouldBeUndefined in grid option for sorting ([#202](https://github.com/ghiscoding/slickgrid-universal/issues/202)) ([865256e](https://github.com/ghiscoding/slickgrid-universal/commit/865256efe927a5715840963cb2945f16a402789b))
* **stylings:** small alignment issue with the slider value elm height ([5a453b8](https://github.com/ghiscoding/slickgrid-universal/commit/5a453b8739c07e07f835e111d7d3ca5d627a0c2f))






## [0.7.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.7.0...v0.7.1) (2020-12-17)

**Note:** Version bump only for package slickgrid-universal






# [0.7.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.6.0...v0.7.0) (2020-12-16)


### Bug Fixes

* **components:** refactor to use registerExternalResources grid option ([#199](https://github.com/ghiscoding/slickgrid-universal/issues/199)) ([7ca42f4](https://github.com/ghiscoding/slickgrid-universal/commit/7ca42f4242bfddd4dd746d7f3f37dbe1e3f7368b))


### Features

* **core:** methods to change column positions/visibilities dynamically ([#200](https://github.com/ghiscoding/slickgrid-universal/issues/200)) ([5048a4b](https://github.com/ghiscoding/slickgrid-universal/commit/5048a4b969f337f002dad552197d02f970590c73))





# [0.6.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.5.1...v0.6.0) (2020-12-14)


### Bug Fixes

* **core:** add console error if any of column def id includes dot ([#198](https://github.com/ghiscoding/slickgrid-universal/issues/198)) ([6ee40af](https://github.com/ghiscoding/slickgrid-universal/commit/6ee40af507b066602c39e057349b5ead6e7952f3))
* **demo:** changing page should remove unsaved cell styling ([17fa349](https://github.com/ghiscoding/slickgrid-universal/commit/17fa3499e298798fdeccf908feb0f0e5ee40436e))
* **stylings:** composite editor styling fixes for BS4 ([#195](https://github.com/ghiscoding/slickgrid-universal/issues/195)) ([305eb90](https://github.com/ghiscoding/slickgrid-universal/commit/305eb90c75e6a4aa076c62b5364b904dc5c6518e))
* **stylings:** re-align the svg icons & single/multiple-select icon+text ([#194](https://github.com/ghiscoding/slickgrid-universal/issues/194)) ([b730be7](https://github.com/ghiscoding/slickgrid-universal/commit/b730be7a75b3035c01aa7ca8f48a88df447ad461))


### Features

* **core:** add registerExternalResources for Components/Services ([#196](https://github.com/ghiscoding/slickgrid-universal/issues/196)) ([ee02f1d](https://github.com/ghiscoding/slickgrid-universal/commit/ee02f1d62d1a0601421352e43d17bd8c89e4348c))
* **core:** refactor code using the container service everywhere ([#197](https://github.com/ghiscoding/slickgrid-universal/issues/197)) ([96ce9bd](https://github.com/ghiscoding/slickgrid-universal/commit/96ce9bdbf18330e522dad0cbb0eda09c41f6a3df))
* **formatters:** add numberPrefix & Suffix to Decimal Formatter ([#193](https://github.com/ghiscoding/slickgrid-universal/issues/193)) ([0e4d30c](https://github.com/ghiscoding/slickgrid-universal/commit/0e4d30c0ee23bc598206fbba4e5ed406e4aeecfe))





## [0.5.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.5.0...v0.5.1) (2020-12-10)

**Note:** Version bump only for package slickgrid-universal





# [0.5.0](https://github.com/ghiscoding/slickgrid-universal/compare/v0.4.2...v0.5.0) (2020-12-10)


### Bug Fixes

* **editors:** make sure select editor is defined before reading a prop ([763f981](https://github.com/ghiscoding/slickgrid-universal/commit/763f98111d03652b0ad903ba487a3b8c83a5ef5d))
* **editors:** only translate button texts when enableTranslate is true ([b698c6b](https://github.com/ghiscoding/slickgrid-universal/commit/b698c6bd3f13af017c7f3c0113b8407269ba1e0d))
* **editors:** Select Editor option to return flat data w/complex object ([#189](https://github.com/ghiscoding/slickgrid-universal/issues/189)) ([4695cd3](https://github.com/ghiscoding/slickgrid-universal/commit/4695cd3b6871dc1ceca4036fd30935eca8011b7e))
* **exports:** when cell value is empty object return empty string ([#190](https://github.com/ghiscoding/slickgrid-universal/issues/190)) ([cd34901](https://github.com/ghiscoding/slickgrid-universal/commit/cd349012c82a8bdff113fb9f8ef23ea18c6e3035))


### Features

* **components:** extract CompositeEditor & EmptyWarning Components ([#191](https://github.com/ghiscoding/slickgrid-universal/issues/191)) ([00cf9a2](https://github.com/ghiscoding/slickgrid-universal/commit/00cf9a22e1924a46ed637d52bba8efc02ef7eea1))





## [0.4.2](https://github.com/ghiscoding/slickgrid-universal/compare/v0.4.1...v0.4.2) (2020-12-07)


### Bug Fixes

* **exports:** deprecated exportOptions should still be working ([19145b2](https://github.com/ghiscoding/slickgrid-universal/commit/19145b26274859b7ba24cf1196262deb74fdb389))





## [0.4.1](https://github.com/ghiscoding/slickgrid-universal/compare/v0.4.0...v0.4.1) (2020-12-07)


### Bug Fixes

* **exports:** remove unsupported browser IE6-10 code ([25411e5](https://github.com/ghiscoding/slickgrid-universal/commit/25411e5e88cb2922d7fdeb40fe29541437acd9a6))





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
* **examples:** queued edit cells style should follow page it was edited ([#167](https://github.com/ghiscoding/slickgrid-universal/issues/167)) ([bf72139](https://github.com/ghiscoding/slickgrid-universal/commit/bf7213994151c148e878d703ea21d8f8ffb43ca8))
* **extensions:** draggable grouping style change to look better ([#171](https://github.com/ghiscoding/slickgrid-universal/issues/171)) ([d00be88](https://github.com/ghiscoding/slickgrid-universal/commit/d00be8868370f3679555b8f52ef4ad85916c93ac))
* **formatters:** date formatters should accept ISO input & output to US ([#172](https://github.com/ghiscoding/slickgrid-universal/issues/172)) ([85ce7cf](https://github.com/ghiscoding/slickgrid-universal/commit/85ce7cf3636d5bb43d3ef18ec6998bb0c423d218))
