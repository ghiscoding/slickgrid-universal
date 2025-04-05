## Bye Bye jQueryUI... 👋🏻 welcome [SortableJS](https://sortablejs.github.io/Sortable/) 🚀

This new release is rather small for the developer, but a lot have changed internally and SortableJS will improve performance and usability since it also works great with touch. The main change for the developer would be if you use the `Editors.autoComplete` that got changed to `Editors.autocompleter` (same for Filters), and that's about it since the rest of the changes are mostly removal of deprecated things. If you want to know more about the reason behind the removal of jQueryUI (internally), then read the "Why replace jQueryUI with SortableJS?" section below (hint, the next major version will probably remove jQuery as well).

#### Major Changes - Quick Summary
- minimum requirements
  - Aurelia-i18n `>=4.0.0`
- replaced jQueryUI with [SortableJS](https://sortablejs.github.io/Sortable/)
  - follow changes to [Kraaden Autocomplete](#replace-jqueryui-autocomplete-with-kraaden-autocomplete)
- [Why replace jQueryUI with SortableJS?](#why-replace-jqueryui-with-sortablejs)

---

**NOTE:** if you come from a version earlier than 4.x, it is very important that you follow the migrations in order

### Removed Code
~Since we dropped jQueryUI, and we were using jQueryUI Slider for the `Filters.SliderRange`, we had to remove the Slider Range and we don't currently have a replacement at the moment, though it might come in the future.~ Slider Range Filter is back in version **[v5.1.0](https://github.com/ghiscoding/aurelia-slickgrid/releases/tag/v5.1.0)** release (see [Example 23](https://ghiscoding.github.io/aurelia-slickgrid/#/slickgrid/example23)).

### @deprecated Code
##### Text Export Service (see [code change](#text-export-service) sample below)
- `enableExport` was renamed to `enableTextExport`
- `exportOptions` was renamed to `textExportOptions`

##### SASS - Autocomplete
Since we replaced the jQueryUI Autocomplete with the 3rd party lib [Kraaden Autocomplete](https://github.com/kraaden/autocomplete) (see below), there are a few SASS/CSS variables that we no longer need and were removed.

###### variables removed
- `$slick-autocomplete-box-shadow`
- `$slick-autocomplete-border-radius`
- `$slick-autocomplete-hover-color`
- `$slick-autocomplete-hover-border-color`
- `$slick-autocomplete-loading-input-bg-color`
- `$slick-autocomplete-min-width`
- `$slick-autocomplete-overflow-x`
- `$slick-autocomplete-overflow-y`
- `$slick-autocomplete-text-color`
- `$slick-autocomplete-text-overflow`
- `$slick-autocomplete-text-padding`

## Changes

### Aurelia-i18n
We now require latest [`aurelia-i18n`](https://github.com/aurelia/i18n) version `>=4.0.0`

```diff
  "dependencies": {
-   "aurelia-i18n": "^3.1.4",
+   "aurelia-i18n": "^4.0.3",
+   "i18next": "^21.8.10",
    "i18next-xhr-backend": "^3.2.2",
  },
  "devDependencies": {
+   "@types/i18next-xhr-backend": "^1.4.2"
  }
```

### Slickgrid-Universal
If you use any of the Slickgrid-Universal extra dependencies then make sure to upgrade them to `2.0.0` so that they work with Aurelia-Slickgrid `5.0.0`

```diff
  "dependencies": {
-   "@slickgrid-universal/excel-export": "^1.4.0",
+   "@slickgrid-universal/excel-export": "^2.0.0",
-   "aurelia-slickgrid": "^4.3.0",
+   "aurelia-slickgrid": "^5.0.0",
}
```
### Text Export Service

Here's an example of the code change that you need to do
```diff
this.gridOptions = {
- enableExport: true,
- exportOptions: {
+ enableTextExport: true,
+ textExportOptions: {
    sanitizeDataExport: true
  },
```

### Replaced JqueryUI Autocomplete with [Kraaden Autocomplete](https://github.com/kraaden/autocomplete)
Since we dropped jQueryUI, we had to find an alternative for the AutoComplete Editor/Filter and we settled on the 3rd party lib [Kraaden Autocomplete](https://github.com/kraaden/autocomplete) which does nearly everything that the jQueryUI one was providing. There are subtle changes requiring few line of code change (see below). We also have a new [Autocomplete Editor (Kraaden)](https://github.com/ghiscoding/Aurelia-Slickgrid/wiki/Autocomplete-Editor-(Kraaden-lib)) Wiki (and we kept a reference to the old jQueryUI AutoComplete Wiki for users of older Aurelia-Slickgrid versions).

You will notice that the Editor/Filter `model` name is quite similar, there are only 2 chars that are different to make it clear that there's a change for the developer (a lower `c` and a `r` at the end of the word which is forming the new name `model: Editors.autocompleter` and the same goes for `AutocompleterOption`)

If you were using the Autocomplete `onSelect` callback, it got renamed to `onSelectItem`. If you were using `openSearchListOnFocus`, then that is now simply `showOnFocus` with the Kraaden Autocomplete (refer to Kraaden Autocomplete [options](https://github.com/kraaden/autocomplete#options), to use them in `editorOptions` or `filterOptions`)

```diff
import {
-  AutocompleteOption,
+  AutocompleterOption,
} from '@slickgrid-universal/common';

prepareGrid() {
  this.columnDefinitions = [{
    id: 'cityOfOrigin', name: 'City of Origin', field: 'cityOfOrigin',
    filterable: true,
    editor: {
-     model: Editors.autoComplete,
+     model: Editors.autocompleter,
      editorOptions: {
        minLength: 3,
        forceUserInput: true,
-       source: (request, response) => {
+       fetch: (searchText, updateCallback) => {
          $.ajax({
            url: 'http://gd.geobytes.com/AutoCompleteCity',
            dataType: 'jsonp',
            data: {
-             q: request.term
+             q: searchText
            },
            success: (data) => {
-             response(data);
+             updateCallback(data);
            }
          });
        }
-     } as AutocompleteOption,
+     } as AutocompleterOption,
    filter: {
-     model: Filters.autoComplete,
+     model: Filters.autocompleter,
      filterOptions: {
        // ... the rest is the same as the Editor
      }
    }
  }
}
```

### Aurelia-CLI (RequireJS)
If you use Aurelia-CLI and RequireJS, you probably needed an entry in `aurelia.json` for jQueryUI, you can now safely remove it. Note that SortableJS should be detected by the Aurelia-CLI, but in case it doesn't then you might need to add it yourself, just pay a little attention to that.

```diff
# aurelia.json
"bundles": [
  "dependencies": [
      "aurelia-bootstrapper",
      "aurelia-loader-default",
      "aurelia-pal-browser",
      {
          "name": "aurelia-testing",
          "env": "dev"
       },
       "text",
       {
          "name": "multiple-select-modified",
          "path": "../node_modules/multiple-select-modified/src",
          "main": "multiple-select",
          "resources": ["multiple-select.css"]
        },
        {
          "name": "dequal-lite",
          "path": "../node_modules/dequal/dist",
          "main": "index.min"
        }
-       {
-          "name": "jquery-ui",
-          "path": "../node_modules/jquery-ui",
-          "main": "dist/jquery-ui",
-          "deps": ["jquery"],
-          "exports": "$"
-        },
   ]
]
```

### Why replace [jQueryUI](https://jqueryui.com/) with [SortableJS](https://sortablejs.github.io/Sortable/)?
Prior to this new version, jQueryUI had to be installed, that was even for a basic grid, but the fact was that the only jQueryUI feature we needed in SlickGrid was [jQueryUI - Sortable](https://jqueryui.com/sortable/) for column reordering. Considering that SlickGrid required jQueryUI at 281Kb (js+css) just to get column reordering, we figured it was a rather large request, don't you think? We did use jQueryUI Autocomplete & Slider as well but the jQueryUI lib is rather large, is barely maintained and is now quite outdated. [SortableJS](https://sortablejs.github.io/Sortable/) is now the dependency used by SlickGrid and is a lot smaller and more up to date in the JS world.

#### jQueryUI Cons
 - old and outdated, barely supported and rather large (probably because it was written when IE5 was a thing)
 - it does not support Touch that well (mobile devices)
 - it is rather large at 250Kb (min.js) + 31Kb (min.css)
#### SortableJS Pros
 - much smaller at 44Kb (`min.js` doesn't require any css)
 - touch friendly (mobile devices)
 - much smoother UX and better performance
 - written in pure JS without any dependencies
