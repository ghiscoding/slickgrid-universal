## SlickGrid is now jQuery free 🌊

In our previous v5.0 release (see [Migration to v5.0](https://github.com/ghiscoding/aurelia-slickgrid/wiki/Migration-to-5.x)), we dropped jQueryUI and now in v6.0 we are going even further and are now dropping [jQuery](https://jquery.com/) entirely. You can still use jQuery but it's no longer a dependency. There are multiple benefits in dropping jQuery and go the vanilla route, the biggest advantages are:

1. it should provide better performance (browser native)
2. build size should be smaller (see table below)

#### Major Changes - Quick Summary
- we dropped jQuery requirement
  - it also required us to rewrite the `multiple-select` (jQuery based lib) into a brand new [`multiple-select-vanilla`](https://github.com/ghiscoding/multiple-select-vanilla) lib which is now native and has zero dependency

---

**NOTE:** if you come from an earlier version other than 5.x, please make sure to follow each migration in their respective order

## Changes
### Replaced `multiple-select` with [`multiple-select-vanilla`](https://github.com/ghiscoding/multiple-select-vanilla)
This change was required because the previous library was a jQuery based lib, so I rewrote the lib as a new native lib to drop jQuery. However with this change, there were a couple of options that were dropped and/or modified.

```diff
// you can load `MultipleSelectOption` from either the new Multiple-Select-Vanilla lib or from Aurelia-Slickgrid (which is a re-export)
  import { MultipleSelectOption } from 'aurelia-slickgrid';       // still works, but is a re-export of the import shown below
+ import { MultipleSelectOption } from 'multiple-select-vanilla'; // preferred

filterOptions: {
-  autoDropWidth: true, // removed and no longer required
} as MultipleSelectOption
```

The new lib also offers a bunch of new options as well, you can see the full interface at [MultipleSelectOption](https://github.com/ghiscoding/multiple-select-vanilla/blob/main/lib/src/interfaces/multipleSelectOption.interface.ts)

### Slickgrid-Universal
If you use any of the Slickgrid-Universal extra dependencies then make sure to upgrade them to the new major `3.0.0` version so that they work with Aurelia-Slickgrid `6.0.0`

```diff
  "dependencies": {
-   "@slickgrid-universal/excel-export": "^2.6.4",
+   "@slickgrid-universal/excel-export": "^3.0.0",
-   "aurelia-slickgrid": "^5.6.4",
+   "aurelia-slickgrid": "^6.0.0",
}
```

### Editor/Filter `params` should be using `editorOptions`/`filterOptions`
For better TypeScript support, we now recommend to use either `editorOptions` or `filterOptions` depending if it's an Editor or a Filter.

```diff
this.columnDefinitions = [{
  id: 'cost', name: 'Cost', field: 'cost',
  editor: {
    model: Editors.slider,
-    params: { hideSliderNumber: false }
+    editorOptions: { hideSliderNumber: false } as SliderOption
  },
  filter: {
    model: Filters.slider,
-    params: { hideSliderNumber: false }
+    filterOptions: { hideSliderNumber: false } as SliderOption
  },
```

### Final Note
and that's about it, the migration is relatively simple as you can see :)

---

### File Size Comparisons
While comparing with the folder properties with "size on disk" on Windows, we're averaging 4-5% smaller size in our new release by removing jQuery with this new release.
