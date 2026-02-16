# <a href="https://vuejs.org/"><img src="https://play.vuejs.org/logo.svg" height="60" alt="VueJS"/></a> Slickgrid-Vue

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

You can also play with the live Stackbliz [Slickgrid-Vue-Demos](https://github.com/ghiscoding/slickgrid-vue-demos).
Stackblitz is also the recommended way to provide a repro when opening a new bug or feature request.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/ghiscoding/slickgrid-vue-demos)

Visit the **[Docs - Quick Start](https://ghiscoding.gitbook.io/slickgrid-vue/getting-started/quick-start)** and/or clone the [Slickgrid-Vue-Demos](https://github.com/ghiscoding/slickgrid-vue-demos) repository for a fully working local demo. Please make sure to read the documentation before opening any new issue and also consider asking installation and/or general questions on [Stack Overflow](https://stackoverflow.com/search?tab=newest&q=slickgrid) unless you think there's a bug with the library.

```sh
npm install slickgrid-vue
```
Install any optional Slickgrid-Universal dependencies, for example Excel Export
```sh
npm install @slickgrid-universal/excel-export
```

### Requirements
- Vue >=3.5

## License
[MIT License](../../LICENSE)

#### Basic Usage

```vue
<script setup lang="ts">
import { type Column, type GridOption, SlickgridVue } from 'slickgrid-vue';

interface User {
  firstName: string;
  lastName: string;
  age: number;
}

// it could also be `Column<User>[]`
const columnDefinitions: Ref<Column[]> = ref([
  { id: 'firstName', name: 'First Name', field: 'firstName', sortable: true },
  { id: 'lastName', name: 'Last Name', field: 'lastName', sortable: true },
  { id: 'age', name: 'Age', field: 'age', type: 'number', sortable: true },
]);
const dataset = ref<User[]>([
  { id: 1, firstName: 'John', lastName: 'Doe', age: 20 },
  { id: 2, firstName: 'Jane', lastName: 'Smith', age: 21 },
]);
const gridOptions = ref<GridOption>({ /*...*/ }); // optional grid options
</script>

<template>
  <slickgrid-vue
    grid-id="grid1"
    v-model:columns="columnDefinitions"
    v-model:dataset="dataset"
    v-model:options="gridOptions"
  ></slickgrid-vue>
</template>
```


### Versions Compatibility

> **Note** Please be aware that only the latest major version of Slickgrid-Vue will be supported and receive bug fixes.

| Slickgrid-Vue | Vue     | Migration Guide | Notes | Date |
|:---------------:| --------- | --------------- | ----- | ---- |
| 10.x            | Vue >=3.5.0 | [Migration 10.x](https://ghiscoding.gitbook.io/slickgrid-vue/migrations/migration-to-10.x)  | Smaller code, requires Slickgrid-Universal [10.x](https://github.com/ghiscoding/slickgrid-universal/releases/tag/v10.0.0) | 2026-02-28 |
| 9.x             | Vue >=3.5.0 | [Migration 9.x](https://ghiscoding.gitbook.io/slickgrid-vue/migrations/migration-to-9.x)  | ESM-Only, requires Slickgrid-Universal [9.x](https://github.com/ghiscoding/slickgrid-universal/releases/tag/v9.0.0) | 2025-05-10 |

### Like it? ⭐ it
You like **Slickgrid-Vue**? Be sure to upvote ⭐ the project, and perhaps support me with caffeine [☕](https://ko-fi.com/ghiscoding) or sponsor me on GitHub. Any contributions are also very welcome. Thanks

<a href='https://ko-fi.com/ghiscoding' target='_blank'><img height='36' width='140' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi3.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

## Latest News & Releases
Check out the [Releases](https://github.com/ghiscoding/slickgrid-universal/releases) section for all latest News & Releases.

### Tested with [Cypress](https://www.cypress.io/) (E2E Tests)
Slickgrid-Universal has **100%** Unit Test Coverage and all Slickgrid-Vue Examples are tested with [Cypress](https://www.cypress.io/) for E2E testing and they are running on every new PR.
