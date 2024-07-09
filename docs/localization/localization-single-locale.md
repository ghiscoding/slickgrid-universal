## Description
Most of example that you will find across this library were made with a Translation Service or `I18N` (dynamic translation) support. However a few users of the lib only use 1 single locale (English or any other locale). Since not all users requires multiple translations, it is now possible to use the project without any Translation Service at all. What is the difference with/without Translation Service or `I18N`? Not much, the only difference is that `I18N` is an optional dependency, it will simply try to use Custom Locales, you can provide your own locales (see instruction below), or if none are provided it will use the English locales by default.

## Installation
There are 2 ways of using and defining Custom Locales, see below on how to achieve that.

### 1. Define your Custom Locales
#### English Locale
English is the default, if that is the locale you want to use, then there's nothing to do, move along...

#### Any other Locales (not English)
To use any other Locales, you will need to create a TypeScript (or JavaScript) of all the Locale Texts required for the library to work properly (if you forget to define a locale text, it will simply show up in English). For example, if we define a French Locale, it would look like this (for the complete list of required field take a look at the default [English Locale](https://github.com/ghiscoding/angular-slickgrid-demos/blob/master/bootstrap5-demo-with-locales/src/app/locales/en.ts) of Angular-Slickgrid)

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
##### Through the Grid Option of any grid
You can alternatively provide Custom Locales through any grid declaration through the `locales` Grid Options (it's the same as the global one, except that it's per grid)

```ts
import { localeFrench } from 'locales/fr';

export class MyGrid {
  defineGrid() {
    const columnDefinitions = [ /* ... */ ];

    const gridOptions = {
      enableAutoResize: true,

      // provide Custom Locale to this grid only
      locales: localeFrench
    };
  }
}
```

#### 3. Use the lib (without I18N)
There's nothing else to do, just use the library without defining or providing I18N and you're good to go.