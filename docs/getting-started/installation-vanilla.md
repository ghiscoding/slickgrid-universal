# Quick start

> **NOTE** these instructions are for the latest v5.x and might differ from earlier versions of the lib.

### 1. Install NPM Package
Install the `Angular-Slickgrid`, and other external packages like `Bootstrap` and `Font-Awesome`
(Bootstrap, Font-Awesome are optional, you can choose other lib if you wish)
```bash
npm install --save @slickgrid-universal/common

# install whichever UI framework you want to use like Bootstrap, Bulma, ...
npm install bootstrap
```

### 2. Create a basic grid
And finally, you are now ready to use it in your project, for example let's create both html/ts files for a basic example.

##### 1. define a grid container in your View
```html
<h1>My First Grid</h1>

<div class="grid1">
</div>
```

##### 2. configure the Column Definitions, Grid Options and pass a Dataset to the grid
below we use `mounted`, but it could be totally different dependending on what framework you use (it could be `mounted`, `attached`, `onRender`, ...)

```ts
import { Column, GridOption, Slicker } from '@slickgrid-universal/common';

export class GridBasicComponent {
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};

  constructor() {
    this.prepareGrid();
  }

  mounted() {
    const container = document.querySelector(`.grid1`) as HTMLDivElement;
    this.sgb = new Slicker.GridBundle(container, this.columnDefinitions, this.getData());
  }

  getData() {
    // ...
  }

  prepareGrid() {
    this.columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title', sortable: true },
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true },
      { id: '%', name: '% Complete', field: 'percentComplete', sortable: true },
      { id: 'start', name: 'Start', field: 'start' },
      { id: 'finish', name: 'Finish', field: 'finish' },
    ];

    this.gridOptions = {
      enableAutoResize: true,
      enableSorting: true
    };

    // fill the dataset with your data (or read it from the DB)
    this.dataset = [
      { id: 0, title: 'Task 1', duration: 45, percentComplete: 5, start: '2001-01-01', finish: '2001-01-31' },
      { id: 1, title: 'Task 2', duration: 33, percentComplete: 34, start: '2001-01-11', finish: '2001-02-04' },
    ];
  }
}
```

### 3. CSS / SASS Styles
Load your prefered theme, choose between Bootstrap (default), Material or Salesforce themes. You can also customize them to your taste (either by using SASS or CSS variables). 

#### CSS
Default compiled `css`, you can load it through HTML or import it in your JS code depending on your project.

```html
# Bootstrap Theme
<link rel="stylesheet" href="@slickgrid-universal/common/dist/styles/css/slickgrid-theme-bootstrap.css">
```

> **Note** to use a different theme, simply replace the theme suffix, for example `"slickgrid-theme-material.css"` for the Material Theme.

#### SASS (scss)
You could also compile the SASS files with your own customization, for that simply take any of the [_variables.scss](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/_variables.scss) (without the `!default` flag) variable file and make sure to import the Bootstrap Theme afterward. For example, you could modify your `style.scss` with the following changes:

```scss
/* for example, let's change the mouse hover color */
$cell-odd-background-color: lightyellow;
$row-mouse-hover-color: lightgreen;

/* make sure to add the @import the SlickGrid Theme AFTER the variables changes */
@import '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-bootstrap.scss';
```

### 4. Explore the Documentation
The last step is really to explore all the pages that are available on the documentation website which are often updated. For example a good starter is to look at the following
- all the `Grid Options` you can take a look at, [Slickgrid-Universal - Grid Options](https://github.com/ghiscoding/angular-slickgrid/blob/master/src/app/modules/angular-slickgrid/models/gridOption.interface.ts) interface
- [Formatters](../column-functionalities/Formatters.md)
- [Editors](../column-functionalities/Editors.md)
- [Filters](../column-functionalities/filters/Select-Filter.md)
- [Grid Menu](../grid-functionalities/Grid-Menu.md)
... and much more, just explorer the Documentation through the table of content (on your left)

### 5. Get Started
The best way to get started is to clone either the [Slickgrid-Universal Vite Demo](https://github.com/ghiscoding/slickgrid-universal-vite-demo) or [Slickgrid-Universal WebPack Demo](https://github.com/ghiscoding/slickgrid-universal-webpack-demo). 

### 6. CSP Compliance
The project supports Content Security Policy (CSP) as long as you provide an optional `sanitizer` in your grid options (we recommend DOMPurify). Review the [CSP Compliance](../developer-guides/csp-compliance.md) documentation for more info.

##### All Live Demo Examples have links to the actual code
If you would like to see the code to a particular Example. Just click on the "see code" that is available in every live examples.

... and that should cover it, now let's code!