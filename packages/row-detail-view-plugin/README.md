[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/ghiscoding/lerna-lite)
[![npm](https://img.shields.io/npm/v/@slickgrid-universal/row-detail-view-plugin.svg)](https://www.npmjs.com/package/@slickgrid-universal/row-detail-view-plugin)
[![npm](https://img.shields.io/npm/dy/@slickgrid-universal/row-detail-view-plugin)](https://www.npmjs.com/package/@slickgrid-universal/row-detail-view-plugin)

## Slick Row Detail View (plugin)
#### @slickgrid-universal/row-detail-view-plugin

A plugin to add Row Detail View Panel that can be expanded/collapsed, the plugin was created from a proof of concept that came out from this StackOverflow question & article which has full details on it was made possible (thanks to @violet313 for making it happen).
 * [Can SlickGrid's row height be dynamically altered? - on Stack Overflow](https://stackoverflow.com/questions/10535164/can-slickgrids-row-height-be-dynamically-altered#29399927)
 * [a responsive slickgrid with dynamic row-heights by violet313](https://violet313.github.io)

### Installation
Follow the instruction provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation)


### Styling (v11+)
Import the package styles after your grid theme, in the same SCSS entry file:

```scss
@use '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-bootstrap.scss';
@use '@slickgrid-universal/row-detail-view-plugin/dist/styles/sass/slick-row-detail-view.scss';
```

For plain CSS, import `@slickgrid-universal/row-detail-view-plugin/dist/styles/css/slick-row-detail-view-bootstrap.css` after the theme CSS. Replace `bootstrap` with your theme name (`default`, `bootstrap`, `fluent`, `material`, or `salesforce`); lite themes use the same package stylesheet.

These styles also support the Angular, Aurelia, React, and Vue Row Detail plugins. Add this base package as a direct dependency when importing its styles.
