# Slickgrid-Vue

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![NPM downloads](https://img.shields.io/npm/dy/slickgrid-vue)](https://npmjs.org/package/slickgrid-vue)
[![npm](https://img.shields.io/npm/v/slickgrid-vue.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/slickgrid-vue)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/slickgrid-vue?color=success&label=gzip)](https://bundlephobia.com/result?p=slickgrid-vue)
[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/actions/workflows/vue-cypress.yml/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions/workflows/vue-cypress.yml)

> [!WARNING]
> Please note that Slickgrid-Vue is still in active development and usage might change depending on the feedback provided by external users like you. However, I don't expect much changes, all examples seem to work as expected. Give it a try!

## Documentation
📘 [Documentation](https://ghiscoding.gitbook.io/slickgrid-vue/getting-started/quick-start) website powered by GitBook.

## Installation

```sh
npm install slickgrid-vue
```

#### Basic Usage

```vue
<script setup lang="ts">
import { type Column, type GridOption, SlickgridVue } from 'slickgrid-vue';

const gridOptions = ref<GridOption>({ /*...*/ });
const columnDefinitions = ref<Column[]>([
  { id: 'username', name: 'Username', field: 'username'},
  { id: 'age', name: 'Age', field: 'age' }
]);
const dataset = ref([
  { id: 1, username: 'John', age: 20 },
  { id: 2, username: 'Jane', age: 21 }
]);
</script>

<slickgrid-vue
    v-model:options="gridOptions"
    v-model:columns="columnDefinitions"
    v-model:data="dataset"
    grid-id="grid1"
></slickgrid-vue>
```

#### Requirements 
- Vue >=3.4
  
### Stackblitz

You can even play with the [Slickgrid-Vite-Demos](https://github.com/ghiscoding/slickgrid-vue-demos) Stackblitz live. It is recommended as a way provide a repro when opening a new bug/feature request.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/ghiscoding/slickgrid-vue-demos)

Refer to the **[Docs - Quick Start](https://ghiscoding.gitbook.io/slickgrid-vue/getting-started/quick-start)** and/or clone the [Slickgrid-Vue-Demos](https://github.com/ghiscoding/slickgrid-vue-demos) repository. Please make sure to read the documentation before opening any new issue and also consider asking installation and/or general questions on [Stack Overflow](https://stackoverflow.com/search?tab=newest&q=slickgrid) unless you think there's a bug with the library.

### Styling Themes

Multiple styling themes are available
- Bootstrap (see all Slickgrid-Vue [live demos](https://ghiscoding.github.io/slickgrid-vue-demos/))
- Material (see [Slickgrid-Universal](https://ghiscoding.github.io/slickgrid-universal/#/example07))
- Salesforce (see [Slickgrid-Universal](https://ghiscoding.github.io/slickgrid-universal/#/example16))

Also note that all of these themes also have **Dark Theme** equivalent and even though Bootstrap if often used as the default, it also works well with any other UI framework like Bulma, Material, ...

### Live Demo page
`Slickgrid-Vue` works with all `Bootstrap` versions, you can see a demo of each one below. It also works well with any other frameworks like Material or Bulma and there are also couple of extra styling themes based on Material & Salesforce which are also available. You can also use different SVG icons, you may want to look at the [Docs - SVG Icons](https://ghiscoding.gitbook.io/slickgrid-vue/styling/svg-icons)
- [Bootstrap 5 demo](https://ghiscoding.github.io/slickgrid-vue-demos) / [examples repo](https://github.com/ghiscoding/slickgrid-vue-demos)

#### Working Demos
For a complete set of working demos (40+ examples), we strongly suggest you to clone the [Slickgrid-Vue Demos](https://github.com/ghiscoding/slickgrid-vue-demos) repository (instructions are provided in the demo repo). The repo provides multiple demos and they are updated every time a new version is out, so it is updated frequently and is also used as the GitHub live demo page.

## License
[MIT License](LICENSE)

## Latest News & Releases
Check out the [Releases](https://github.com/ghiscoding/slickgrid-universal/releases) section for all latest News & Releases.

### Tested with [Cypress](https://www.cypress.io/) (E2E Tests)
Slickgrid-Universal has **100%** Unit Test Coverage and all Slickgrid-Vue Examples are tested with [Cypress](https://www.cypress.io/) as E2E tests and that is whenever a new PR is created.

### Like it? ⭐ it
You like **Slickgrid-Vue**? Be sure to upvote ⭐, and perhaps support me with caffeine [☕](https://ko-fi.com/ghiscoding) and feel free to contribute. 👷👷‍♀️

<a href='https://ko-fi.com/ghiscoding' target='_blank'><img height='32' style='border:0px;height:32px;' src='https://az743702.vo.msecnd.net/cdn/kofi3.png?v=0' border='0' alt='Buy Me a Coffee at ko-fi.com' />
