# Quick start

### Easiest Way to Get Started

The easiest is to simply clone the [Slickgrid-Vue-Demos](https://github.com/ghiscoding/slickgrid-vue-demos) project and run it from there... or if you really wish to start from scratch then follow the steps shown below.

### 1. Install NPM Package

Install `Vue`, `Slickgrid-Vue` and any UI framework you wish to install and use, for example `Bootstrap`.

```sh
npm install slickgrid-vue
```

_Note: `Bootstrap` is totally optional, you can use any other framework (for example Quasar or Vuetify)_

### 2. Import all necessary dependencies in `main.ts`

```ts
// Bootstrap if installed which is again totally optional
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

createApp(App);
```

<a name="step3"></a>

### 3. CSS / SASS Styles

Load the default SlickGrid theme style and/or customize it to your taste (customization requires SASS).

> Note: the default CSS/SASS Theme name is `slickgrid-theme-default` and is framework agnostic as much as possible.
> It is the recommended Theme to get started, try this default theme first and tweak it if necessary.

#### CSS

Default compiled `css`.

```vue
<script setup lang="ts">
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

import 'styles.css';
import '@slickgrid-universal/common/dist/styles/css/slickgrid-theme-bootstrap.css';
</script>
```

> **Note** Bootstrap is optional, you can use any other UI framework, other themes are also available as CSS and SCSS file extensions.
> Import the `slickgrid-theme-bootstrap.css` **only** if you are actually using Bootstrap, otherwise you should prefer using the `slickgrid-theme-default.css` file which is the default theme.
> Available themes are: `slickgrid-theme-default.css`, `slickgrid-theme-bootstrap.css`, `slickgrid-theme-material.css`, `slickgrid-theme-salesforce.css`, `slickgrid-theme-fluent.css`

#### SASS (scss)

You could also compile the SASS files with your own customization, you can simply override any of the SASS [_variables.scss](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/_variables.scss) (without the `!default` flag) variable file and make sure to import the Bootstrap Theme afterward or use the new modern SASS approach with the `@use with()`. For example, you could modify your `style.scss` with the following changes:

```scss
/* for example, let's change the mouse hover color */
@use '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-default.scss' with (
  $cell-odd-background-color: lightyellow,
  $row-mouse-hover-color: lightgreen
);
```

### 4. Install/Setup `I18Next` for Localization (optional)

This step is totally optional and will can be used to provide multiple different locales, other than English (which is the default), in your project. You have 2 options to approach this use case. If you only use English, then there is nothing to do (you can still change some of the texts in the grid via option 1.). The 2 approach are as follow:

1. Using [Custom Locale](../localization/localization-with-custom-locales.md), that is when you use a **single locale** (other than English)...
2. Using [Localization with I18Next](../localization/localization.md), that is when you want to use multiple locales dynamically.

##### add `i18n` to your `main.ts`

```ts
import i18next from 'i18next';
import I18NextVue from 'i18next-vue';
import { createApp } from 'vue';

createApp(App).use(I18NextVue, { i18next });
```

##### then add it to your App

```vue
<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { provide } from 'vue';

provide('i18next', useTranslation().i18next);
</script>
```

> Currently only `i18next` (and `i18next-vue`) is implemented and supported. If anyone is interested in implementing `vue-i18n` then please reach out. Side note, `i18next` is easier to implement and is also being used in a few other SlickGrid framework wrappers which does help with consistency.

### 5. Create a basic grid

```vue
<script setup lang="ts">
import { Column, Formatter, Formatters, GridOption, SlickgridVue, SlickgridVueInstance } from 'slickgrid-vue';
import { onBeforeMount, ref, type Ref } from 'vue';

const gridOptions = ref<GridOption>();
const columns: Ref<Column[]> = ref([]); // to avoid type mismatch use `Ref<Column[]>` instead of `ref<Column[]>`
const dataset = ref<any[]>([]);

onBeforeMount(() => {
  defineGrid();
});

/* Define Grid Options and Columns */
function defineGrid() {
  columns.value = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100 },
    { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100 },
    { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100 },
    { id: 'start', name: 'Start', field: 'start', minWidth: 100 },
    { id: 'finish', name: 'Finish', field: 'finish', minWidth: 100 },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100 },
  ];

  gridOptions.value = {
    enableAutoResize: false,
    gridHeight: 600,
    gridWidth: 800,
  };

  dataset.value = getData(500);
}

function getData(count: number) {
  // fetch your data...
}
</script>

<template>
  <SlickgridVue
    grid-id="grid1"
    v-model:columns="columns"
    v-model:options="gridOptions"
    v-model:dataset="dataset" />
</template>
```

### 6. Explore the Documentation page content

The last step is really to explore all the pages that are available in the documentation, everything you need to use the library should be available in the docs and so you should visit it often. For example a good starter is to look at the following

- for all the `Grid Options`, take a look at all the [Grid Options](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/gridOption.interface.ts) interface.
- [Formatters](../column-functionalities/formatters.md)
- [Editors](../column-functionalities/editors.md)
- [Filters](../column-functionalities/filters/select-filter.md)
- [Grid Menu](../grid-functionalities/grid-menu.md)
- ... and much more, just explore through all the documentation available
  - it gets updated very frequently, we usually mention any new/updated documentations in any new version release

### 7. Get Started

The best way to get started is to clone the [Slickgrid-Vue-Demos](https://github.com/ghiscoding/slickgrid-vue-demos), it is updated frequently since it is used for the GitHub Bootstrap demo page. `Slickgrid-Vue` has 2 project demos available (with/without `i18n`).

- [Slickgrid-Vue-Demos](https://ghiscoding.github.io/slickgrid-vue-demos) / [examples repo](https://github.com/ghiscoding/slickgrid-vue-demos) (with `I18Next` Service)

##### All Live Demo Examples have links to the actual code

Like to see the code for a particular Example? Just click on the "see code" (top right) link which are available in every live examples.

### 8. CSP Compliance

The project supports Content Security Policy (CSP) as long as you provide an optional `sanitizer` in your grid options (we recommend [DOMPurify](https://github.com/cure53/DOMPurify)). Review the [CSP Compliance](../developer-guides/csp-compliance.md) documentation for more info.

### 9. Add Optional Feature like Excel Export

The Excel Export is an optional package and if you want to use it then you'll need to install it via npm from the monorepo library with `npm install @slickgrid-universal/excel-export`. Refer to the [Excel Export - Docs](../grid-functionalities/export-to-excel.md) for more info.

Here's a quick list of some of these optional packages

- [@slickgrid-universal/excel-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/excel-export)
- [@slickgrid-universal/text-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/text-export)
- [@slickgrid-universal/graphql](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/graphql)
- [@slickgrid-universal/odata](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/odata)

### 10. Missing Features? (fear not)

What if `Slickgrid-Vue` is missing feature(s) versus the original `SlickGrid`? Fear not and directly use the `SlickGrid` and `DataView` objects that are expose from the start through Event Emitters. For more info continue reading on [SlickGrid & DataView objects](../slick-grid-dataview-objects/slickgrid-dataview-objects.md) and [Grid & DataView Events](../events/grid-dataview-events.md)

### 11. Having some issues?

After reading all this Getting Started guide, then what if you have an issue with the grid?
Please start by searching any related [issues](https://github.com/ghiscoding/slickgrid-universal/issues). If you can't find anything in the issues filder and you also made sure to also look through the multiple Documentation pages as well, then go ahead and fill in a [new issue](https://github.com/ghiscoding/slickgrid-universal/issues/new) and I'll try to help.

### Final word

This project is Open Source and is, for the most part, mainly done in spare time. So please be respectful when creating issues (and fill in the issue template) and I will try to help you out. If you like my work, you can also [buy me a coffee](https://ko-fi.com/ghiscoding) ☕️, some part of the code happens when I'm at StarBucks... That is it, and please don't forget to upvote the project if you like and if it's useful to you ⭐ thank you 😉
