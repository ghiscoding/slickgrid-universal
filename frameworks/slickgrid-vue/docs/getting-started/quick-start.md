# Quick start

### Easiest Way to Get Started

The easiest is to simply clone the [Slickgrid-Vue-Demos](https://github.com/ghiscoding/slickgrid-vue-demos) project and run it from there... or if you really wish to start from scratch then follow the steps shown below.

### 1. Install NPM Package

Install `Vue`, `Slickgrid-Vue` and any UI framework you wish to install and use, for example `Bootstrap`.

```bash
npm install --save slickgrid-vue bootstrap
# or with yarn add
```

_Note: `Bootstrap` is totally optional, you can use any other framework_

### 2. Import all necessary dependencies in `main.ts`

```ts
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

createApp(App);
```

<a name="step3"></a>
### 3. CSS / SASS Styles
Load the default Bootstrap theme style and/or customize it to your taste (customization requires SASS)

#### CSS
Default compiled `css`.

**Note:** If you are also using `Bootstrap-SASS`, then there is no need to include the `bootstrap.css` in the `styles: []` section.

```vue
<script setup lang="ts">
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

import 'styles.css';
import 'node_modules/@slickgrid-universal/common/dist/styles/css/slickgrid-theme-bootstrap.css';
</script>
```

#### SASS (scss)
You could also compile the SASS files with your own customization, for that simply take any of the [_variables.scss](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/_variables.scss) (without the `!default` flag) variable file and make sure to import the Bootstrap Theme afterward or use the new modern SASS approach with the `@use with()`. For example, you could modify your `style.scss` with the following changes:

```scss
/* for example, let's change the mouse hover color */
@use '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-bootstrap.scss' with (
  $cell-odd-background-color: lightyellow,
  $row-mouse-hover-color: lightgreen
);
```

### 4. Install/Setup `I18Next` for Localization (optional)
This step is totally optional and will allow you to provide different locales, other than English (which is the default), in your project. You have 2 options to approach this use case. If you only use English, then there is nothing to do (you can still change some of the texts in the grid via option 1.). The 2 approach are as follow:
1. Using [Custom Locale](../localization/localization-with-custom-locales.md), that is when you use **only 1** locale (other than English)...
2. Using [Localization with I18Next](../localization/localization.md), that is when you want to use multiple locales dynamically.

##### add it to your `main.ts`
```ts
import i18next from 'i18next';
import I18NextVue from 'i18next-vue';
import { createApp } from 'vue';

createApp(App).use(I18NextVue, { i18next })
```

##### then add it to your App
```vue
<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { provide } from 'vue';

provide('i18next', useTranslation().i18next);
</script>
```

> Currently only `i18next` (and `i18next-vue`) is implemented and supported. If anyone is interested in implementing `vue-i18n` then please reach out. Side note, `i18next` is easier to implement and is also being used in a couple of SlickGrid framework ports which help in consistency.

### 5. Create a basic grid

```vue
<script setup lang="ts">
import {
  Column,
  FieldType,
  Formatter,
  Formatters,
  GridOption,
  SlickgridVue,
  SlickgridVueInstance,
} from 'slickgrid-vue';
import { onBeforeMount } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions = ref<Column[]>([]);
const dataset = ref<any[]>([]);

onBeforeMount(() => {
  defineGrid();
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100 },
    { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100 },
    { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100 },
    { id: 'start', name: 'Start', field: 'start', minWidth: 100 },
    { id: 'finish', name: 'Finish', field: 'finish', minWidth: 100 },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100 }
  ];

  gridOptions.value = {
    enableAutoResize: false,
    gridHeight: 600,
    gridWidth: 800,
  };

  dataset.value = getData();
}

function getData(count: number) {
  // mock some data, an array of objects
  const tmpData = [];
  for (let i = 0; i < count; i++) {
    const randomYear = 2000 + Math.floor(Math.random() * 10);
    const randomMonth = Math.floor(Math.random() * 11);
    const randomDay = Math.floor((Math.random() * 29));
    const randomPercent = Math.round(Math.random() * 100);

    tmpData[i] = {
      id: i,
      title: 'Task ' + i,
      duration: Math.round(Math.random() * 100) + '',
      percentComplete: randomPercent,
      start: `${randomMonth}/${randomDay}/${randomYear}`,
      finish: `${randomMonth}/${randomDay}/${randomYear + 1}`,
      effortDriven: (i % 5 === 0)
    };
  }

  return tmpData;
}
</script>

<template>
  <SlickgridVue
    grid-id="grid1"
    v-model:columns="columnDefinitions"
    v-model:options="gridOptions"
    v-model:data="dataset"
  />
</template>
```

### 6. Explore the Wiki page content
The last step is really to explore all the pages that are available in this Wiki, all the documentation will be place in here and so you should visit it often. For example a good starter is to look at the following

- for all the `Grid Options`, take a look at [Wiki - Grid Options](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/gridOption.interface.ts)
- [Formatters](../column-functionalities/formatters.md)
- [Editors](../column-functionalities/editors.md)
- [Filters](../column-functionalities/filters/select-filter.md)
- [Grid Menu](../grid-functionalities/grid-menu.md)
- ... and much more, just explorer the Wikis through the sidebar index (on your right)
  - it gets updated very frequently, we usually mention any new/updated wikis in any new version release

### 7. Get Started
The best way to get started is to clone the [Slickgrid-Vue-Demos](https://github.com/ghiscoding/slickgrid-vue-demos), it is updated frequently since it is used for the GitHub Bootstrap 4 demo page. `Slickgrid-Vue` has 2 `Bootstrap` themes, you can see a demo of each one below.
- [Bootstrap 5 demo](https://ghiscoding.github.io/slickgrid-vue-demos) / [examples repo](https://github.com/ghiscoding/slickgrid-vue-demos) (with `I18Next` Service)

##### All Live Demo Examples have links to the actual code
Like to see the code to a particular Example? Just click on the "see code" that is available in every live examples.

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
What if `Slickgrid-Vue` is missing feature(s) versus the original `SlickGrid`? Fear not and directly use the `SlickGrid` and `DataView` objects that are expose from the start through Event Emitters. For more info continue reading on [Wiki - SlickGrid & DataView objects](../slick-grid-dataview-objects/slickgrid-dataview-objects.md) and [Wiki - Grid & DataView Events](../events/grid-dataview-events.md)

### 11. Having some issues?
After reading all this HOW TO, what if you have an issue with the grid?
Please start by searching any related [issues](/ghiscoding/slickgrid-vue/issues). If you can't find anything in the issues log and you made sure to also look through the multiple [wiki](/ghiscoding/slickgrid-vue/wiki) pages as well, then go ahead and fill in a [new issue](/ghiscoding/slickgrid-vue/issues/new) and we'll try to help.

### Final word
This project is Open Source and is, for the most part, mainly done in my spare time. So please be respectful when creating issues (and fill in the issue template) and I will try to help you out. If you like my work, you can also [buy me a coffee](https://ko-fi.com/N4N679OT) ☕️, some part of the code happens when I'm at StarBucks so... That is it, thank you and don't forget to ⭐ the project if you like the lib 😉
