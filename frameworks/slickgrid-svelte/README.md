# <a href="https://svelte.dev/docs/svelte/"><img src="./assets/svelte.svg" height="80" alt="Svelte"/></a> Slickgrid Svelte

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![NPM downloads](https://img.shields.io/npm/dy/slickgrid-svelte)](https://npmjs.org/package/slickgrid-svelte)
[![npm](https://img.shields.io/npm/v/slickgrid-svelte.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/slickgrid-svelte)
[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/actions/workflows/test-svelte.yml/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions/workflows/test-svelte.yml)

## Description
SlickGrid-Svelte is a custom component created specifically for [Svelte](https://svelte.dev/) framework, it is a wrapper on top of Slickgrid-Universal library which contains the core functionalities. Slickgrid-Universal is written with TypeScript in browser native code, it is framework agnostic and is a monorepo that includes all Editors, Filters, Extensions and Services related to SlickGrid usage with also a few optional packages (like GraphQL, OData, Export to Excel, ...).

## Documentation
📘 [Documentation](https://ghiscoding.gitbook.io/slickgrid-svelte/getting-started/quick-start) website is powered by GitBook.

## Installation

You can also play with the live Stackbliz [Slickgrid-Svelte-Demos](https://github.com/ghiscoding/slickgrid-svelte-demos).
Stackblitz is also the recommended way to provide a repro when opening a new bug or feature request.

| Stackblitz | Description |
| ---------- | ----------- |
| [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/ghiscoding/slickgrid-svelte-demos) | with I18N Translate |
| [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/ghiscoding/slickgrid-svelte-demos/tree/main/single-locale-without-i18n) | Single Locale (_without i18n_) |

Visit the **[Docs - Quick Start](https://ghiscoding.gitbook.io/slickgrid-svelte/getting-started/quick-start)** and/or clone the [Slickgrid-Svelte-Demos](https://github.com/ghiscoding/slickgrid-svelte-demos) repository for a fully working local demo. Please make sure to read the documentation before opening any new issue and also consider asking installation and/or general questions on [Stack Overflow](https://stackoverflow.com/search?tab=newest&q=slickgrid) unless you think there's a bug with the library.

```sh
npm install slickgrid-svelte
```
Install any optional Slickgrid-Universal dependencies, for example Excel Export
```sh
npm install @slickgrid-universal/excel-export
```

### Requirements
- Svelte >=5.0

## License
[MIT License](../../LICENSE)

#### Basic Usage

```svelte
<script lang="ts">
  import { SlickgridSvelte, type Column, type GridOption } from 'slickgrid-svelte';
  import '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-bootstrap.scss';

  const columns: Column[] = [{ id: 'title', name: 'Title', field: 'title', sortable: true }];
  const options: GridOption = { enableAutoResize: false, gridWidth: 800, gridHeight: 300 };
  let dataset = $state.raw([{ id: 1, title: 'Task 1' }]);
</script>

<SlickgridSvelte gridId="grid1" {columns} {options} {dataset} />
```

### Versions Compatibility

> **Note** Please be aware that only the latest major version of Slickgrid-Svelte will be supported and receive bug fixes.

| Slickgrid-Svelte | Svelte     | Migration Guide | Notes | Date |
|:-------------:| ------- | --------------- | ----- | ---- |
| 11.x          | >=5.0 | initial release | Pinning rewrite | 2026-11-09 |

### Like it? ⭐ it
You like **Slickgrid-Svelte**? Be sure to upvote ⭐ the project, and perhaps support me with caffeine [☕](https://ko-fi.com/ghiscoding) or sponsor me on GitHub. Any contributions are also very welcome. Thanks

<a href='https://ko-fi.com/ghiscoding' target='_blank'><img height='36' width='140' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi3.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

## Latest News & Releases
Check out the [Releases](https://github.com/ghiscoding/slickgrid-universal/releases) section for all latest News & Releases.

### Tested with [Cypress](https://www.cypress.io/) (E2E Tests)
Slickgrid-Universal has **100%** Unit Test Coverage and all Slickgrid-Svelte Examples are tested with [Cypress](https://www.cypress.io/) for E2E testing and they are running on every new PR.
