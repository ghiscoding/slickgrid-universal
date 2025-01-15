# Slickgrid-Vue

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![NPM downloads](https://img.shields.io/npm/dy/slickgrid-vue)](https://npmjs.org/package/slickgrid-vue)
[![npm](https://img.shields.io/npm/v/slickgrid-vue.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/slickgrid-vue)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/slickgrid-vue?color=success&label=gzip)](https://bundlephobia.com/result?p=slickgrid-vue)
[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/actions/workflows/vue-cypress.yml/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions/workflows/vue-cypress.yml)

> [!WARNING]
> Please note that Slickgrid-Vue is still in active development and usage might change depending on feedback provided by external users like you. However, I don't expect much changes though since all examples are working as expected. Give it a try and ⭐ the project if you like it!

## Documentation
📘 [Documentation](https://ghiscoding.gitbook.io/slickgrid-vue/getting-started/quick-start) website is powered by GitBook.

## Installation

```sh
npm install slickgrid-vue
```

#### Basic Usage

```vue
<script setup lang="ts">
import { type Column, type GridOption, SlickgridVue } from 'slickgrid-vue';

const columnDefinitions = ref<Column[]>([
  { id: 'username', name: 'Username', field: 'username'},
  { id: 'age', name: 'Age', field: 'age' }
]);
const dataset = ref([
  { id: 1, username: 'John', age: 20 },
  { id: 2, username: 'Jane', age: 21 }
]);
const gridOptions = ref<GridOption>({ /*...*/ }); // optional
</script>

<slickgrid-vue
    grid-id="grid1"
    v-model:columns="columnDefinitions"
    v-model:data="dataset"
    v-model:options="gridOptions"    
></slickgrid-vue>
```

#### Requirements 
- Vue >=3.4
  
### Stackblitz

You can also play with the live Stackbliz [Slickgrid-Vite-Demos](https://github.com/ghiscoding/slickgrid-vue-demos). It is also the recommended way to provide a repro when opening a new bug/feature request.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/ghiscoding/slickgrid-vue-demos)

Refer to the **[Docs - Quick Start](https://ghiscoding.gitbook.io/slickgrid-vue/getting-started/quick-start)** and/or clone the [Slickgrid-Vue-Demos](https://github.com/ghiscoding/slickgrid-vue-demos) repository for a local demo. Please make sure to read the documentation before opening any new issue and also consider asking installation and/or general questions on [Stack Overflow](https://stackoverflow.com/search?tab=newest&q=slickgrid) unless you think there's a bug with the library.

### Styling Themes

Multiple styling themes are available
- Bootstrap (see all Slickgrid-Vue [live demos](https://ghiscoding.github.io/slickgrid-vue-demos/))
- Material (see [Slickgrid-Universal](https://ghiscoding.github.io/slickgrid-universal/#/example07))
- Salesforce (see [Slickgrid-Universal](https://ghiscoding.github.io/slickgrid-universal/#/example16))

Also note that all of these themes also have **Dark Theme** equivalent and even though Bootstrap is often used as the default, it does work as well with any other UI framework like Bulma, Material, Quasar...

### Live Demo page
`Slickgrid-Vue` works with all Bootstrap versions, you can see a demo of each one below. It also works well with any other frameworks like Material, Bulma, Quasar... and there are also extra styling themes based on Material & Salesforce which are also available. You can also use different SVG icons, you may want to look at the [Docs - SVG Icons](https://ghiscoding.gitbook.io/slickgrid-vue/styling/svg-icons)
- [Bootstrap 5 demo](https://ghiscoding.github.io/slickgrid-vue-demos) / [examples repo](https://github.com/ghiscoding/slickgrid-vue-demos)

#### Working Demos
For a complete set of working demos (40+ examples), we strongly suggest you to clone the [Slickgrid-Vue Demos](https://github.com/ghiscoding/slickgrid-vue-demos) repository (instructions are provided in it). The repo provides multiple examples which are updated frequently (basically every time a new version is out) and is also used as the GitHub live demo page.

## License
[MIT License](LICENSE)

## Latest News & Releases
Check out the [Releases](https://github.com/ghiscoding/slickgrid-universal/releases) section for all latest News & Releases.

### Tested with [Cypress](https://www.cypress.io/) (E2E Tests)
Slickgrid-Universal has **100%** Unit Test Coverage and all Slickgrid-Vue Examples are tested with [Cypress](https://www.cypress.io/) for E2E testing and they run anytime a new PR is created.

### Like it? ⭐ it
You like **Slickgrid-Vue**? Be sure to upvote ⭐, and perhaps support me with caffeine [☕](https://ko-fi.com/ghiscoding) and feel free to contribute. 👷👷‍♀️

<a href='https://ko-fi.com/ghiscoding' target='_blank'><img height='32' style='border:0px;height:32px;' src='https://az743702.vo.msecnd.net/cdn/kofi3.png?v=0' border='0' alt='Buy Me a Coffee at ko-fi.com' />
