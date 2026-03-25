# Quick start

> **NOTE** The Documentations shown on this website are meant for Angular-Slickgrid v7.x and higher, for older versions please refer to the project [Wikis](https://github.com/ghiscoding/Angular-Slickgrid/wiki).

### 1. Install NPM Package
Install the `Angular-Slickgrid`, and other external packages like `Bootstrap`
(or any other framework UI)

```sh
npm install angular-slickgrid
```

#### Optional `ngx-translate`

`ngx-translate` can be installed for instant locale translation (see [step 6](#id-6.-install-setup-ngx-translate-for-localization-optional)).

**NOTE** please note that even if `@ngx-translate` is in fact optional, it will be installed behind the scene nonetheless because of our use of `@Optional()` for DI (dependency injection). It's assumed to be removed by the tree shaking process after a production build.

Below is their `ngx-translate` version compatibility:

| Angular Version         | @ngx-translate/core |
|-------------------------|---------------------|
|  21+                    |        17.x         |
|  16 - 19+               |        16.x         |
|  16 - 17+               |        16.x (15.x)  |

### 2. Add Bootstrap script/css (or any other UI framework)
##### Modify the `angular.json` and `tsconfig.app.json` files

For Bootstrap users (or possibly other frameworks), modify your `angular.json` file with the necessary framework Styles and Scripts:

```js
// optional, install only when using Bootstrap
"styles": [
    "node_modules/bootstrap/dist/css/bootstrap.min.css",
    "styles.css"
],
"scripts": [
    "node_modules/bootstrap/dist/js/bootstrap.js",
],
```

### 3. CSS / SASS Styles
Load the default Bootstrap theme style and/or customize it to your taste (either by using SASS or CSS variables)

#### CSS
Angular-Slickgrid default CSS compiled (if you use the plain Bootstrap Theme CSS, just add it to your `angular.json` file and that's about it).

```json
"styles": [
    "node_modules/bootstrap/dist/css/bootstrap.css",
    "styles.css",
    "node_modules/@slickgrid-universal/common/dist/styles/css/slickgrid-theme-bootstrap.css"
]
```

> **Note** Bootstrap is optional, you can use any other UI framework, other themes are also available as CSS and SCSS file extensions.
> Import the `slickgrid-theme-bootstrap.css` **only** if you are actually using Bootstrap, otherwise you should prefer using the `slickgrid-theme-default.css` file which is the default theme.
> Available themes are: `slickgrid-theme-default.css`, `slickgrid-theme-bootstrap.css`, `slickgrid-theme-material.css`, `slickgrid-theme-salesforce.css`, `slickgrid-theme-fluent.css`

#### SASS (`.scss`)
You could also compile the SASS files with your own customization, for that, you can simply override any of the SASS [_variables.scss](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/_variables.scss) (use any of them without the `!default` flag) variable file and make sure to import whichever Theme you choose (like Bootstrap Theme) afterward. For example, you could modify your `style.scss` with the following changes:

```scss
/* for example, let's change the mouse hover color */
@use '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-default.scss' with (
  $cell-odd-background-color: lightyellow,
  $row-mouse-hover-color: lightgreen
);
```

### 4. for `Angular-Slickgrid` for version `>= 10.x` - Standalone Component
##### _for version `< 10` (with App Module), see step 5_

```ts
// App Setup - main.ts
import { AngularSlickgridComponent, GridOption } from 'angular-slickgrid';

// optional Grid Option
const gridOptionConfig: GridOption = {
  enableAutoResize: true,
  autoResize: {
    container: '#demo-container',
    rightPadding: 10,
  },
  sanitizer: (dirtyHtml) => DOMPurify.sanitize(dirtyHtml, { ADD_ATTR: ['level'], RETURN_TRUSTED_TYPE: true }),
};

bootstrapApplication(AppComponent, {
  providers: [
    AngularSlickgridComponent,
    { provide: 'defaultGridOption', useValue: gridOptionConfig },
    provideAppInitializer(() => {
      const initializerFn = appInitializerFactory(inject(TranslateService), inject(Injector));
      return initializerFn();
    }),
    provideTranslateService({
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    }),
    provideHttpClient(withInterceptorsFromDi()),
    provideZoneChangeDetection(),
  ],
}).catch((err) => console.log(err));
```

### 5. for `Angular-Slickgrid` version `< 10.0`
##### Include it in your App Module (or App Config for Standalone)

Below are 2 different setups (with App Module (legacy) or Standalone) which in both cases require the `AngularSlickgridModule.forRoot()`, so make sure to include it.

#### App Module (legacy)
##### This only works with version 9.0 and below, any newer version (v10.0 and above) is now purely Standalone
Include `AngularSlickgridModule` in your App Module (`app.module.ts`)

> **Note:** Make sure to add the `forRoot` since it will throw an error in the console when missing.

```typescript
import { AngularSlickgridModule } from 'angular-slickgrid';

@NgModule({
  declarations: [AppComponent],
  imports: [AngularSlickgridModule.forRoot()], // forRoot() is REQUIRED
  bootstrap: [AppComponent]
})
export class AppModule { }
```

#### Standalone (App Config)
> #### see this Stack Overflow [answer](https://stackoverflow.com/a/78527155/1212166) for more details and Stackblitz demo

If your app is using standalone style, go to `app.config.ts`

```ts
import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AngularSlickgridModule } from 'angular-slickgrid';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(AngularSlickgridModule.forRoot()), // <- notice!
  ],
};
```

Then import the `AngularSlickgridModule` to the `app.component.ts`

```ts
import { RouterOutlet } from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Column, GridOption, AngularSlickgridModule } from 'angular-slickgrid';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AngularSlickgridModule], // <- notice!
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
    // ...
}
```

##### `@dynamic` - "Lambda not supported" error
The new updated version of `ng-packagr` use strict metadata and you might get errors about `Lambda not supported`, to bypass this problem you can add the `@dynamic` comment over the `@NgModule` as shown below:
```ts
// @dynamic
@NgModule({
  // ...
})
```

### 6. Install/Setup `ngx-translate` for Localization (optional)
#### If you don't want to use any Translate Service and use only one Locale, then take a look at the (Single Locale) demo on the [Angular-Slickgrid-Demos](https://github.com/ghiscoding/angular-slickgrid-demos) repo.

To provide locales, other than, English (default locale), you have 2 options that you can go with. If you only use English, there is nothing to do (you can still change some of the texts in the grid via option 1 below)
1. Using [Custom Locale](../localization/localization-with-custom-locales.md), that is when you use a **single locale** (other than English)...
2. Using [Localization with I18N](../localization/localization-with-ngx-translate.md), that is when you want to use multiple locales dynamically.
3. **NOTE** `@ngx-translate` will be installed in any case (since it's an internal `@Optional` dependency), but it should be removed after doing a production build with tree shaking.

##### Translation Keys
Also note that every time you want to use a translation key, you simply have to use a property with the `Key` suffix. For example, if you wish to have a column definition `name` with a translation, just use the `nameKey: 'TRANSLATE_KEY'` instead of `name`. Below is a list of keys that can be used in the lib

| without Translate | with Translate |
| ----------------- | -------------- |
| name              | nameKey        |
| label             | labelKey       |
| title             | titleKey       |
| columnGroup       | columnGroupKey |
| optionTitle       | optionTitleKey |

### 7. Create a basic grid
And finally, you are now ready to use it in your project, for example let's create both html/ts files for a `grid-basic.component` example, configure the Column Definitions, Grid Options and pass a Dataset to the grid:
```ts
import { Column, GridOption } from 'angular-slickgrid';

export class GridBasicComponent {
  columns: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  constructor() {
    this.prepareGrid();
  }

  prepareGrid() {
    this.columns = [
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

  getData() {
    // fetch your data...
  }
}
```

define Angular-Slickgrid in your Component View
```html
<div class="container">
  <angular-slickgrid gridId="grid1"
            [columns]="columns"
            [options]="gridOptions"
            [dataset]="dataset">
  </angular-slickgrid>
</div>
```

### 8. Explore the Documentation
The last step is really to explore all the pages that are available in the documentation, everything you need to use the library should be available in here and so you should visit it often. For example a good starter is to look at the following

- for all the `Grid Options`, take a look at all the [Grid Options](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/gridOption.interface.ts) interface.
- [Formatters](../column-functionalities/formatters.md)
- [Editors](../column-functionalities/editors.md)
- [Filters](../column-functionalities/filters/select-filter.md)
- [Grid Menu](../grid-functionalities/grid-menu.md)
... and much more, just explore the Documentation through all the available pages.

### 9. How to load data with `HttpClient`?
You might notice that all demos are made with mocked dataset that are embedded in each examples, that is mainly for demo purposes, but you might be wondering how to connect this with an `HttpClient`? Easy... just replace the mocked data assignment to the `dataset` property with your `HttpClient` call and that's it. Basically, the `dataset` property can be changed at any time, which is why you can use local data and/or connect it to a `Promise` or an `Observable` with `HttpClient` (internally it's just a SETTER that refreshes the grid). See [Example 22](https://ghiscoding.github.io/angular-slickgrid-demos/#/example22) for a demo showing how to load a JSON file with `HttpClient`.

### 10. Live Demo - Clone the Examples
The best way to get started is to clone the [Angular-Slickgrid-demos](https://github.com/ghiscoding/angular-slickgrid-demos), it has multiple examples and it is also updated frequently since it is used for the GitHub Bootstrap 5 live demo page.

##### All Live Demo Examples have links to the actual code
If you would like to inspect the code from a particular Example, just click on the "see code" (top right) which is available in all live demo examples.

### 11. CSP Compliance
The project supports Content Security Policy (CSP) as long as you provide an optional `sanitizer` in your grid options (we recommend DOMPurify). Review the [CSP Compliance](../developer-guides/csp-compliance.md) documentation for more info.

### 12. Missing Features compared to SlickGrid?
What if `Angular-Slickgrid` is missing feature(s) versus the original `SlickGrid` library? Fear not and just use the `SlickGrid` and `DataView` objects directly, which are exposed through the `onAngularGridCreated` event. For more info continue reading on [Docs - SlickGrid & DataView objects](../slick-grid-dataview-objects)

### 13. Troubleshooting - Build Errors/Warnings
Visit the [Troubleshooting](troubleshooting.md) section for more common errors.

### 14. Having some issues?

After reading all this Getting Started guide, then what if you have an issue with the grid?
Please start by searching any related [issues](https://github.com/ghiscoding/slickgrid-universal/issues). If you can't find anything in the issues filder and you also made sure to also look through the multiple Documentation pages as well, then go ahead and fill in a [new issue](https://github.com/ghiscoding/slickgrid-universal/issues/new) and we'll try to help.

### Final word

This project is Open Source and is, for the most part, mainly done in my spare time. So please be respectful when creating issues (and fill in the issue template) and I will try to help you out. If you like my work, you can also [buy me a coffee](https://ko-fi.com/ghiscoding) ☕️, some part of the code happens when I'm at StarBucks so... That is it, thank you and don't forget to ⭐ the project if you like the lib 😉