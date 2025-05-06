# Slickgrid-Vue

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![NPM downloads](https://img.shields.io/npm/dy/slickgrid-vue)](https://npmjs.org/package/slickgrid-vue)
[![npm](https://img.shields.io/npm/v/slickgrid-vue.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/slickgrid-vue)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/slickgrid-vue?color=success&label=gzip)](https://bundlephobia.com/result?p=slickgrid-vue)
[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/actions/workflows/test-vue.yml/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions/workflows/test-vue.yml)

## Description
SlickGrid-Vue is a custom component created specifically for [VueJS](https://vuejs.org/) framework, it is a wrapper on top of Slickgrid-Universal library which contains the core functionalities. Slickgrid-Universal is written with TypeScript in browser native code, it is framework agnostic and is a monorepo that includes all Editors, Filters, Extensions and Services related to SlickGrid usage with also a few optional packages (like GraphQL, OData, Export to Excel, ...).

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

const columnDefinitions: Ref<Column[]> = ref([
  { id: 'firstName', name: 'First Name', field: 'firstName', sortable: true },
  { id: 'lastName', name: 'Last Name', field: 'lastName', sortable: true },
  { id: 'age', name: 'Age', field: 'age', type: 'number', sortable: true },
]);
const dataset = ref([
  { id: 1, firstName: 'John', lastName: 'Doe', age: 20 },
  { id: 2, firstName: 'Jane', lastName: 'Smith', age: 21 },
]);
const gridOptions = ref<GridOption>({ /*...*/ }); // optional grid options
</script>

<template>
  <slickgrid-vue
    grid-id="grid1"
    v-model:columns="columnDefinitions"
    v-model:data="dataset"
    v-model:options="gridOptions"
  ></slickgrid-vue>
</template>
```

#### Requirements
- Vue >=3.5

### Stackblitz

You can also play with the live Stackbliz [Slickgrid-Vue-Demos](https://github.com/ghiscoding/slickgrid-vue-demos).
Stackblitz is also the recommended way to provide a repro when opening a new bug or feature request.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/ghiscoding/slickgrid-vue-demos)

Visit the **[Docs - Quick Start](https://ghiscoding.gitbook.io/slickgrid-vue/getting-started/quick-start)** and/or clone the [Slickgrid-Vue-Demos](https://github.com/ghiscoding/slickgrid-vue-demos) repository for a fully working local demo. Please make sure to read the documentation before opening any new issue and also consider asking installation and/or general questions on [Stack Overflow](https://stackoverflow.com/search?tab=newest&q=slickgrid) unless you think there's a bug with the library.

### Styling Themes

Multiple styling themes are available
- Default (UI agnostic)
- Bootstrap (see all Slickgrid-Vue [live demos](https://ghiscoding.github.io/slickgrid-vue-demos/))
- Material (see [Slickgrid-Universal](https://ghiscoding.github.io/slickgrid-universal/#/example07))
- Salesforce (see [Slickgrid-Universal](https://ghiscoding.github.io/slickgrid-universal/#/example16))

Also note that all of these themes also include a **Dark Theme** equivalent and even though Bootstrap is often used in the live demos, it also works well with any other UI framework like Bulma, Material, Quasar...

### Live Demo page
`Slickgrid-Vue` works with Bootstrap or any other UI frameworks like Material, Bulma, Quasar... and there are also extra styling themes based on Material & Salesforce which are also available. You can also use different SVG icons, you may want to look at the [Docs - SVG Icons](https://ghiscoding.gitbook.io/slickgrid-vue/styling/svg-icons)
- [Bootstrap 5 demo](https://ghiscoding.github.io/slickgrid-vue-demos) / [examples repo](https://github.com/ghiscoding/slickgrid-vue-demos)

#### Working Demos
For a complete set of working demos (45+ examples), we strongly suggest you to clone the [Slickgrid-Vue Demos](https://github.com/ghiscoding/slickgrid-vue-demos) repository (instructions are provided in it). The repo comes with multiple examples and are updated frequently (basically every time a new version is out) and it is also used as the GitHub [live demo]([https://github.com/ghiscoding/slickgrid-vue-demos](https://ghiscoding.github.io/slickgrid-vue-demos/) page.

## License
[MIT License](LICENSE)

## Latest News & Releases
Check out the [Releases](https://github.com/ghiscoding/slickgrid-universal/releases) section for all latest News & Releases.

### Tested with [Cypress](https://www.cypress.io/) (E2E Tests)
Slickgrid-Universal has **100%** Unit Test Coverage and all Slickgrid-Vue Examples are tested with [Cypress](https://www.cypress.io/) for E2E testing and they are running on every new PR.

### Like it? ⭐ it
You like **Slickgrid-Vue**? Be sure to upvote ⭐ the project, and perhaps support me with caffeine [☕](https://ko-fi.com/ghiscoding) or sponsor me on GitHub. Any contributions are also very welcome. Thanks

<a href='https://ko-fi.com/ghiscoding' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi3.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
