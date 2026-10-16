[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/ghiscoding/lerna-lite)
[![npm](https://img.shields.io/npm/v/@slickgrid-universal/composite-editor-component.svg)](https://www.npmjs.com/package/@slickgrid-universal/composite-editor-component)
[![npm](https://img.shields.io/npm/dy/@slickgrid-universal/composite-editor-component)](https://www.npmjs.com/package/@slickgrid-universal/composite-editor-component)

## Composite Editor Component
#### @slickgrid-universal/composite-editor-component

Vanilla Bundle implementation of a Composite Editor Modal Window which can do the following
- Create
- Clone (allows you to clone & edit a row, it's like a copy+edit in a single action)
- Edit / Update
- Mass Update Changes
- Mass Selection Changes (similar to Mass Update but only for the selected items/rows)

### Installation
Follow the instruction provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation).

### Styling (v11+)
Import the Composite Editor stylesheet after your SlickGrid theme in your application's global SCSS entry file:

```scss
@use '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-bootstrap.scss';
@use '@slickgrid-universal/composite-editor-component/dist/styles/sass/slick-composite-editor.scss';
```

For plain CSS, import `@slickgrid-universal/common/dist/styles/css/slickgrid-theme-bootstrap.css` first, followed by `@slickgrid-universal/composite-editor-component/dist/styles/css/slick-composite-editor-bootstrap.css`. Replace `bootstrap` with your theme name (`default`, `fluent`, `material`, or `salesforce`); lite themes use the same package stylesheet.
