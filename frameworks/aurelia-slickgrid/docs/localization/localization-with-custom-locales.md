###### Requires version `2.13.0+`

## Description
Most of example that you will find across this library were made with `I18N` (dynamic translation) support. However a few users of the lib only use 1 locale (English or any other locale). Since not all users requires multiple translations, as of version `2.13.0`, it is now possible to use `Aurelia-Slickgrid` without `I18N`. What is the difference with/without `I18N`? Not much, the only difference is that `I18N` is now an optional dependency (thanks to Aurelia [Optional Dependency](https://aurelia.io/docs/fundamentals/cheat-sheet#dependency-injection), via `Optional.of(I18N)`), so if you don't provide `I18N`, it will simply try to use Custom Locales, you can provide your own locales (see instruction below), or if none are provided it will use English locales by default.
## Code Sample
[Demo Component](https://github.com/ghiscoding/aurelia-slickgrid-demos/blob/master/webpack-bs5-demo-with-locales)

## Installation
There are 2 ways of using and defining Custom Locales, see below on how to achieve that.

### 1. Define your Custom Locales
#### English Locale
English is the default, if that is the locale you want to use then there's nothing to do, move along...

#### Any other Locales (not English)
To use any other Locales, you will need to create a TypeScript (or JavaScript) of all the Locale Texts required for the library to work properly (if you forget to define a locale text, it will simply show up in English). For example, if we define a French Locale, it would look like this (for the complete list of required field take a look at the default [French Locale](https://github.com/ghiscoding/aurelia-slickgrid-demos/blob/master/webpack-bs5-demo/src/examples/locales/fr.ts))
```ts
// localeFrench.ts or fr.ts
export const localeFrench = {
  // texte requis
  TEXT_ALL_SELECTED: 'Tout sélectionnés',
  TEXT_CANCEL: 'Annuler',
  TEXT_CLEAR_ALL_FILTERS: 'Supprimer tous les filtres',
  TEXT_CLEAR_ALL_SORTING: 'Supprimer tous les tris',
  // ... the rest of the text
```

#### 2. Use the Custom Locales
##### Through the `main.ts` (globally)
This will literally configure Custom Locales for the entire project, so if you want to do it once, that is the place to do it.
```ts
// main.ts
import { localeFrench } from 'locales/fr';

export function configure(aurelia: Aurelia) {
  aurelia.use.standardConfiguration();

  aurelia.use.plugin(PLATFORM.moduleName('aurelia-slickgrid'), config => {
    // Provide a custom locales set
    config.options.locales = localeFrench;
  });
```
##### Through the Grid Option of any grid
You can alternatively provide Custom Locales through any grid declaration through the `locales` Grid Options (it's the same as the global one, except that it's per grid)

```ts
import { localeFrench } from 'locales/fr';

export class MyGrid {
  prepareGrid() {
    this.columnDefinitions = [ /* ... */ ];

    this.gridOptions = {
      enableAutoResize: true,

      // provide Custom Locale to this grid only
      locales: localeFrench
    };
  }
}
```

#### 3. Use the lib (without I18N)
There's nothing else to do, just use the library without defining or providing I18N and you're good to go. Read through the Wiki of the [HOWTO](../getting-started/quick-start.md) for basic grid samples.
