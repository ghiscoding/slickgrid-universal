# Quick start

> **NOTE** The Documentations shown on this website are meant for Aurelia-Slickgrid v7.x and higher, for older versions please refer to the project [Wikis](https://github.com/ghiscoding/aurelia-slickgrid/wiki) for earlier versions of the project.

### Easiest Way to Get Started
The easiest is to simply clone the [Aurelia-Slickgrid-Demos](https://github.com/ghiscoding/aurelia-slickgrid-demos) project and run it from there... or if you really wish to start from scratch then follow the steps below.

### 1. Install NPM Package
Install the `Aurelia-Slickgrid` and optionally `Bootstrap`
```bash
npm install --save aurelia-slickgrid bootstrap # Bootstrap is optional
```
_Note: `Bootstrap` is optional, you can use any other lib that you want_

### 2. CSS / SASS Styles
Load the default Bootstrap theme style or scroll down for SASS customization.

#### CSS
Default compiled `css` (if you use the plain Bootstrap Theme CSS, you could simply add it to your `index.html` file and be done with it).

##### WebPack
```typescript
// Bootstrap is optional, you can use any framework
import 'bootstrap/dist/css/bootstrap.css';
import 'multiple-select-modified/src/multiple-select.css';

// if you use CSS instead of SASS
import '@slickgrid-universal/common/dist/styles/css/slickgrid-theme-default.css';
// or other available themes
import '@slickgrid-universal/common/dist/styles/css/slickgrid-theme-bootstrap.css';
import '@slickgrid-universal/common/dist/styles/css/slickgrid-theme-material.css';
import '@slickgrid-universal/common/dist/styles/css/slickgrid-theme-salesforce.css';
```

#### SASS (scss)
You could also compile the SASS files with your own customization, for that simply take any of the [_variables.scss](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/_variables.scss) (without the `!default` flag) variable from the file and make sure to import the Bootstrap Theme afterward. For example, you could modify your `style.scss` with the following changes:

```scss
@use '../node_modules/@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-default.scss' with (
  $cell-odd-background-color: lightyellow,
  $row-mouse-hover-color: lightgreen
);
```

### 3. Include it in your App
#### Aurelia `main.ts`
Make the plugin available globally in your `main.js` file.

##### WebPack (add the `PLATFORM.moduleName`)
```typescript
export function configure(aurelia) {
  aurelia.use.plugin(PLATFORM.moduleName('aurelia-slickgrid'));
  aurelia.start().then(() => aurelia.setRoot());
}
```

### 4. Install/Setup `I18N` for Localization (optional)
#### If you don't want to use any Translate Service and use only 1 Locale then take a look at this [demo](https://github.com/ghiscoding/aurelia-slickgrid-demos/tree/master/webpack-bs5-demo-with-locales)
To provide locales other than English (default locale), you have 2 options that you can go with. If you only use English, there is nothing to do (you can still change some of the texts in the grid via option 1.)
1. Using [Custom Locale](../localization/localization-with-custom-locales.md), that is when you use **only 1** locale (other than English)... this is a new feature starting from version `2.10.0` and up.
2. Using [Localization with I18N](../localization/localization.md), that is when you want to use multiple locales dynamically.

### 5. Create a basic grid
#### View
```html
<aurelia-slickgrid
    grid-id="grid1"
    columns.bind="columnDefinitions"
    options.bind="gridOptions"
    dataset.bind="dataset">
</aurelia-slickgrid>
```
#### ViewModel
```typescript
export class Example1 {
  gridOptions;
  columnDefinitions;
  dataset = [];

  constructor() {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();
  }

  attached() {
    // populate the dataset once the grid is ready
    this.getData();
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100 },
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100 },
      { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100 },
      { id: 'start', name: 'Start', field: 'start', minWidth: 100 },
      { id: 'finish', name: 'Finish', field: 'finish', minWidth: 100 },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100 }
    ];
    this.gridOptions = {
      enableAutoResize: false,
      gridHeight: 600,
      gridWidth: 800,
    };
  }

  getData() {
    // mock a dataset
    this.dataset = [];
    for (let i = 0; i < 1000; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor((Math.random() * 29));
      const randomPercent = Math.round(Math.random() * 100);

      this.dataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        start: `${randomMonth}/${randomDay}/${randomYear}`,
        finish: `${randomMonth}/${randomDay}/${randomYear}`,
        effortDriven: (i % 5 === 0)
      };
    }
  }
}
```


### 6. Client samples
There are multiple demos (WebPack, RequireJS, CLI, ...) that you can clone and refer to (2 of them are actually used to update the GitHub demo pages and are updated frequently). So to get you started, you can clone the [aurelia-slickgrid-demos](https://github.com/ghiscoding/aurelia-slickgrid-demos) repo.

### 7. Explore the Documentation page content
The last step is really to explore all the pages that are available in the documentation, everything you need to use the library should be available in here and so you should visit it often. For example a good starter is to look at the following

- for all the `Grid Options`, take a look at all the [Grid Options](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/gridOption.interface.ts) interface.
- [Formatters](../column-functionalities/formatters.md)
- [Editors](../column-functionalities/editors.md)
- [Filters](../column-functionalities/filters/select-filter.md)
- [Grid Menu](../grid-functionalities/grid-menu.md)
- ... and much more, just explorer all the Documentations available
  - it gets updated very frequently, we usually mention any new/updated documentation in any new version release

### 8. How to load data with `Fetch-Client` or `Http-Client`?
You might notice that all demos are made with mocked dataset that are embedded in each examples, that is mainly for demo purposes, but you might be wondering how to connect this with an `FetchClient`? Easy... just replace the mocked data, assigned to the `dataset` property, by your `FetchClient` call and that's it. The `dataset` property can be changed at any time, which is why you can use local data and/or connect it to a `Promise` or an async call with `FetchClient` (internally it's just a SETTER that refreshes the grid). See [Example 22](https://ghiscoding.github.io/aurelia-slickgrid-demos/#/slickgrid/example22) for a demo showing how to load a JSON file with `FetchClient`.

### 9. Get Started
The best way to get started is to clone the [Aurelia-Slickgrid-demos](https://github.com/ghiscoding/aurelia-slickgrid-demos), it has multiple examples and it is also updated frequently since it is used for the GitHub Bootstrap 5 demo page. `Aurelia-Slickgrid` has 2 `Bootstrap` themes, you can see a demo of each one below.
- [Bootstrap 5 demo](https://ghiscoding.github.io/aurelia-slickgrid) / [examples repo](https://github.com/ghiscoding/aurelia-slickgrid-demos/tree/master/vite-bs5-demo) (with `I18N` Service)
- [Bootstrap 5 - examples repo](https://github.com/ghiscoding/aurelia-slickgrid-demos/tree/master/webpack-bs5-demo-with-locales) (**without** `I18N` Service)

##### All Live Demo Examples have links to the actual code
Like to see the code to a particular Example? Just click on the "see code" that is available in every live examples.

### 10. CSP Compliance
The project supports Content Security Policy (CSP) as long as you provide an optional `sanitizer` in your grid options (we recommend DOMPurify). Review the [CSP Compliance](../developer-guides/csp-compliance.md) documentation for more info.

### 11. Add Optional Feature like Excel Export
Starting with version 3.0.0, the Excel Export is now an optional package and if you want to use it then you'll need to install it via npm from the monorepo library with `npm install @slickgrid-universal/excel-export`. Refer to the "Excel Export" from the documentations for more info.

Here's a quick list of some of these optional packages
- [@slickgrid-universal/excel-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/excel-export)
- [@slickgrid-universal/text-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/text-export)
- [@slickgrid-universal/graphql](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/graphql)
- [@slickgrid-universal/odata](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/odata)

### 12. Missing Features? (fear not)
What if `Aurelia-Slickgrid` is missing feature(s) versus the original `SlickGrid`? Fear not and directly use the `SlickGrid` and `DataView` objects that are expose from the start through Event Emitters. For more info continue reading on "SlickGrid & DataView objects" and "Grid & DataView Events"

### 13. Having some issues?
After reading all this HOW TO, what if you have an issue with the grid?
Please start by searching any related [issues](/ghiscoding/aurelia-slickgrid/issues). If you can't find anything in the issues log and you made sure to also look through the multiple documentation pages as well, then go ahead and fill in a [new issue](/ghiscoding/aurelia-slickgrid/issues/new) and we'll try to help.

### Final word
This project is Open Source and is, for the most part, mainly done in spare time. So please be respectful when creating issues (and fill in the issue template) and I will try to help you out. If you like my work, you can also [buy me a coffee](https://ko-fi.com/N4N679OT) ☕️, some part of the code happens when I'm at StarBucks... That is it, thank you and don't forget to ⭐ it if you like the lib 😉
