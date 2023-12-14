# Migration Guide to 2.x

### Bye Bye jQueryUI... 👋🏻 welcome [SortableJS](https://sortablejs.github.io/Sortable/) 🚀

This new release is rather small for the developer, but a lot have changed internally and SortableJS will improve performance and usability since it also works great with touch. The main change for the developer would be if you use the `Editors.autoComplete` which has changed to `Editors.autocompleter` (same for Filters), and that's about it since the rest of the changes are mostly removal of deprecated things. If you want to know more about the reason behind the removal of jQueryUI (internally), then read the "Why replace jQueryUI with SortableJS?" section below.

**Major Changes - Quick Summary**

* replaced jQueryUI with [SortableJS](https://sortablejs.github.io/Sortable/)
  * migrate to [Kraaden Autocomplete](migration-to-2.x.md#replace-jqueryui-autocomplete-with-kraaden-autocomplete) (instead of jQueryUI)
* [Why replace jQueryUI with SortableJS?](migration-to-2.x.md#why-replace-jqueryui-with-sortablejs)

***

**NOTE:** if you come from a version earlier than 1.x, it is very important that you follow the migrations in order

#### Removed Code

~~Since we dropped jQueryUI, and we were using jQueryUI Slider for the `Filters.SliderRange`, we had to remove the Slider Range and we don't currently have a replacement at the moment, though it might come in the future.~~ Slider Range Filter is back in version [**v2.1.0**](https://github.com/ghiscoding/slickgrid-universal/releases/tag/v2.1.0) release (see [Example 14](https://ghiscoding.github.io/slickgrid-universal/#/example14)).

#### @deprecated Code

**Text Export Service (see** [**code change**](migration-to-2.x.md#text-export-service) **sample below)**

* `enableExport` was renamed to `enableTextExport`
* `exportOptions` was renamed to `textExportOptions`

**SASS - Autocomplete**

Since we replaced the jQueryUI Autocomplete with the 3rd party lib [Kraaden Autocomplete](https://github.com/kraaden/autocomplete) (see below), there are a few SASS/CSS variables that we no longer need and were removed.

**variables removed**

* `$slick-autocomplete-box-shadow`
* `$slick-autocomplete-border-radius`
* `$slick-autocomplete-hover-color`
* `$slick-autocomplete-hover-border-color`
* `$slick-autocomplete-loading-input-bg-color`
* `$slick-autocomplete-min-width`
* `$slick-autocomplete-overflow-x`
* `$slick-autocomplete-overflow-y`
* `$slick-autocomplete-text-color`
* `$slick-autocomplete-text-overflow`
* `$slick-autocomplete-text-padding`

### Changes

#### Text Export Service

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

#### Replaced JqueryUI Autocomplete with [Kraaden Autocomplete](https://github.com/kraaden/autocomplete)

Since we dropped jQueryUI, we had to find an alternative for the AutoComplete Editor/Filter and we settled on the 3rd party lib [Kraaden Autocomplete](https://github.com/kraaden/autocomplete) which does nearly everything that the jQueryUI one was providing. There are subtle changes requiring few line of code change (see below). We also have a new [Autocomplete Editor (Kraaden)](https://github.com/ghiscoding/Angular-Slickgrid/wiki/Autocomplete-Editor-\(Kraaden-lib\)) Wiki (and we kept a reference to the old jQueryUI AutoComplete Wiki for users of older Angular-Slickgrid versions).

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

#### Why replace [jQueryUI](https://jqueryui.com/) with [SortableJS](https://sortablejs.github.io/Sortable/)?

Prior to this new version, jQueryUI had to be installed, that was even for a basic grid, but the fact was that the only jQueryUI feature we needed in SlickGrid was [jQueryUI - Sortable](https://jqueryui.com/sortable/) for column reordering. Considering that SlickGrid required jQueryUI at 281Kb (js+css) just to get column reordering, we figured it was a rather large request, don't you think? We did use jQueryUI Autocomplete & Slider as well but the jQueryUI lib is rather large, is barely maintained and is now quite outdated. [SortableJS](https://sortablejs.github.io/Sortable/) is now the dependency used by SlickGrid and is a lot smaller and more up to date in the JS world.

**jQueryUI Cons**

* old and outdated, barely supported and rather large (probably because it was written when IE5 was a thing)
* it does not support Touch that well (mobile devices)
* it is rather large at 250Kb (min.js) + 31Kb (min.css)

**SortableJS Pros**

* much smaller at 44Kb (`min.js` doesn't require any css)
* touch friendly (mobile devices)
* much smoother UX and better performance
* written in pure JS without any dependencies
