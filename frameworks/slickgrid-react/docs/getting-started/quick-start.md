# Quick start

> **NOTE** The Documentations shown on this website are meant for Slickgrid-React v4.x and higher, for older versions please refer to the project [Wikis](https://github.com/ghiscoding/slickgrid-react/wiki) for earlier versions of the project.

### Easiest Way to Get Started
The easiest is to simply clone the [Slickgrid-React-Demos](https://github.com/ghiscoding/slickgrid-react-demos) project and run it from there... or if you really wish to start from scratch then follow the steps below.

### 1. Install NPM Package
Install `React`, `Slickgrid-React`, `Bootstrap` (or other UI framework)
```bash
npm install --save slickgrid-react bootstrap
# or with yarn add
```
_Note: `Bootstrap` is optional, you can use any other framework_

### 2. Import all necessary dependencies in `main.ts`
```tsx
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import i18n from 'i18next';
import React from 'react';
```

<a name="step3"></a>
### 3. CSS / SASS Styles
Load the default Bootstrap theme style and/or customize it to your taste (customization requires SASS)

#### CSS
Default compiled `css`.

**Note:** If you are also using `Bootstrap-SASS`, then there is no need to include the `bootstrap.css` in the `styles: []` section.

```tsx
// Bootstrap is optional, you can use any other framework
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

import 'styles.css';
import 'node_modules/@slickgrid-universal/common/dist/styles/css/slickgrid-theme-bootstrap.css';
```

> **Note** Bootstrap is optional, you can use any other framework, other themes are also available as CSS and SCSS file extensions
> `slickgrid-theme-default.css`, `slickgrid-theme-bootstrap.css`, `slickgrid-theme-material.css`, `slickgrid-theme-salesforce.css`

#### SASS (scss)
You could also compile the SASS files with your own customization, for that simply take any of the [_variables.scss](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/_variables.scss) (without the `!default` flag) variable file and make sure to import the Bootstrap Theme afterward. For example, you could modify your `style.scss` with the following changes:

```scss
/* for example, let's change the mouse hover color */
@use '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-default.scss' with (
  $cell-odd-background-color: lightyellow,
  $row-mouse-hover-color: lightgreen
);
```

### 4. Install/Setup `I18N` for Localization (optional)
To provide locales other than English (default locale), you have 2 options that you can go with. If you only use English, there is nothing to do (you can still change some of the texts in the grid via option 1.)
1. Using [Custom Locale](../localization/localization-with-custom-locales.md), that is when you use **only 1** locale (other than English)... this is a new feature starting from version `2.10.0` and up.
2. Using [Localization with I18N](../localization/localization.md), that is when you want to use multiple locales dynamically.

### 5. Create a basic grid

```tsx
import {
  SlickgridReactInstance,
  Column,
  Formatter,
  Formatters,
  GridOption,
  SlickgridReact,
} from 'slickgrid-react';
import React from 'react';

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  /* Define grid Options and Columns */
  function defineGrid() {
    setColumns([
      { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100 },
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100 },
      { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100 },
      { id: 'start', name: 'Start', field: 'start', minWidth: 100 },
      { id: 'finish', name: 'Finish', field: 'finish', minWidth: 100 },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100 }
    ]);
    setOptions({
      enableAutoResize: false,
      gridHeight: 600,
      gridWidth: 800,
    });
  }

  function getData() {
    // mock some data, an array of objects
    const dataset = [];
    for (let i = 0; i < 1000; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor((Math.random() * 29));
      const randomPercent = Math.round(Math.random() * 100);

      dataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        start: `${randomMonth}/${randomDay}/${randomYear}`,
        finish: `${randomMonth}/${randomDay}/${randomYear}`,
        effortDriven: (i % 5 === 0)
      };
    }
    setDataset(dataset);
  }

  return !options ? '' : (
    <SlickgridReact gridId="grid1"
        columns={columns}
        options={options}
        dataset={dataset}
    />
  );
}
```

### 6. Explore the Documentation page content
The last step is really to explore all the pages that are available in the documentation, everything you need to use the library should be available in here and so you should visit it often. For example a good starter is to look at the following

- for all the `Grid Options`, take a look at all the [Grid Options](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/gridOption.interface.ts) interface.
- [Formatters](../column-functionalities/formatters.md)
- [Editors](../column-functionalities/editors.md)
- [Filters](../column-functionalities/filters/select-filter.md)
- [Grid Menu](../grid-functionalities/grid-menu.md)
- ... and much more, just explore the Documentations
  - it gets updated very frequently, we usually mention any new/updated documentations in any new version release

### 7. Get Started
The best way to get started is to clone the [Slickgrid-React-Demos](https://github.com/ghiscoding/slickgrid-react-demos), it has multiple examples and it is also updated frequently since it is used for the GitHub Bootstrap 5 demo page. `Slickgrid-React` has 2 `Bootstrap` themes, you can see a demo of each one below.
- [Bootstrap 5 demo](https://ghiscoding.github.io/slickgrid-react) / [examples repo](https://github.com/ghiscoding/slickgrid-react-demos) (with `I18N` Service)

##### All Live Demo Examples have links to the actual code
Like to see the code to a particular Example? Just click on the "see code" that is available in every live examples.

### 8. CSP Compliance
The project supports Content Security Policy (CSP) as long as you provide an optional `sanitizer` in your grid options (we recommend DOMPurify). Review the [CSP Compliance](../developer-guides/csp-compliance.md) documentation for more info.

### 9. Add Optional Feature like Excel Export
Starting with version 3.0.0, the Excel Export is now an optional package and if you want to use it then you'll need to install it via npm from the monorepo library with `npm install @slickgrid-universal/excel-export`. Refer to the [Excel Export - Docs](../grid-functionalities/export-to-excel.md) for more info.

Here's a quick list of some of these optional packages
- [@slickgrid-universal/excel-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/excel-export)
- [@slickgrid-universal/text-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/text-export)
- [@slickgrid-universal/graphql](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/graphql)
- [@slickgrid-universal/odata](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/odata)

### 10. Missing Features? (fear not)
What if `Slickgrid-React` is missing feature(s) versus the original `SlickGrid`? Fear not and directly use the `SlickGrid` and `DataView` objects that are expose from the start through Event Emitters. For more info continue reading on the Documentation "SlickGrid & DataView objects" and "Grid & DataView Events"

### 11. Having some issues?
After reading all this HOW TO, what if you have an issue with the grid?
Please start by searching any related [issues](/ghiscoding/slickgrid-react/issues). If you can't find anything in the issues log and you made sure to also look through the multiple documentation available, then go ahead and fill in a [new issue](/ghiscoding/slickgrid-react/issues/new) and we'll try to help.

### Final word
This project is Open Source and is, for the most part, mainly done in spare time. So please be respectful when creating issues (and fill in the issue template) and I will try to help you out. If you like my work, you can also [buy me a coffee](https://ko-fi.com/N4N679OT) ☕️, some part of the code happens when I'm at StarBucks... That is it, thank you and don't forget to ⭐ it if you like the lib 😉
