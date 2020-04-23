## Excel Export Service
#### @slickgrid-universal/file-export

Simple Export to Excel Service that allows to exporting as ".xls" or ".xlsx".

### Dependencies
This package requires [excel-builder-webpacker](https://www.npmjs.com/package/excel-builder-webpacker) which itself requires [jszip](https://www.npmjs.com/package/jszip) and [lodash](https://www.npmjs.com/package/lodash), the later not being a small lib, so make sure you are fine the bundle size. For our use case, the extra bundle size is totally worth the feature.

### Installation
Follow the instruction provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation), you can see a demo by looking at the [GitHub Demo](https://ghiscoding.github.io/slickgrid-universal) page and click on "Export to CSV" from the Grid Menu (aka hamburger menu).
