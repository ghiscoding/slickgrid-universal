## Version 5 - Better UI and Dark Mode with Pure CSS SVG icons ✨
This new release brings a lot of changes oriented towards better UI/UX, our SVG icons are now pure CSS and can be colorized like any other text via the native CSS `color` property (which helps a lot improving the Dark Mode Theme).

Another noticeable UI change is the migration from [Flatpickr](https://flatpickr.js.org/) to [Vanilla-Calendar-Picker](https://github.com/ghiscoding/vanilla-calendar-picker) (which is in fact a fork of [Vanilla-Calendar-Pro](https://vanilla-calendar.pro/) and we'll hopefully drop the fork in the near future if possible), there are multiple reasons to migrate our date picker to another library:
- Flatpickr cons:
  - barely supported (lots of opened PR but nothing merged for the past 2 years)
  - not fully ESM ready (it's only partially ESM, for example it is detected as CJS in Angular-Slickgrid and requires to be added to `allowedCommonJsDependencies`)
  - styling could be a bit more modern (the use of native select/input to change year/month/time is a bit outdated and rudimentary)
  - date range selection is not very user friendly (UX)
- Vanilla-Calendar pros:
  - ESM ready
  - modern styling and also include Dark Mode theme
  - date range becomes a lot more easy by displaying a picker with 2 months
- Vanilla-Calendar (VC) cons:
  - build size is slightly larger but its UI/UX is awesome
  - settings are named differently and are not using flat config (complex object settings) and requires code change
    - for example Flatpickr `minDate: 'today'` is instead `range: { min: 'today' }` in VC
  - some settings were missing, like the `'today'` shortcut which is why I forked the VC project
    - I did open a few PRs on the main project, so the hope is to drop the fork in the future while being a totally transparent change to you when it happens.

With this release, I believe that I have achieved all goals and even more than I originally expected to accomplish (I'm not expecting to roll new major releases as often anymore). This release goal was to improve UI/UX but also to make it fully ESM ready and we improved towards that goal. Also, at this point, the project has a similar or smaller size in comparison to what it was in v2.x (that was when the user had to install jQuery/jQueryUI separately). So, considering that we're no longer using jQuery/jQueryUI in the project, and also considering that these 2 dependencies combined were well over a total of 200Kb, then our project build size is in fact a lot smaller than it was 2 years ago. This is really nice to see especially since we keep adding features (like Dark Mode and others) while still maintainging, or slightly decreasing, its size :)

For most breaking changes, a search & replace in your code editor should suffice. 

#### Major Changes - Quick Summary
- minimum requirements bump
  - Node 18 is required
  - Bootstrap 5 or higher (or any other UI framework)
  - SASS 1.35 or higher (dart-sass)
  - migrated from Flatpickr to Vanilla-Calendar (visit [Vanilla-Calendar-Pro](https://vanilla-calendar.pro/) for demos and docs)

> **Note** for the entire list of tasks & code changes applied in this release, you may want to take a look at the [Roadmap to 5.0](https://github.com/ghiscoding/slickgrid-universal/discussions/1482) Discussion.

> **NOTE:** if you come from an earlier version, please make sure to follow each migrations in their respected order (review previous migration guides)

## Changes

### Styling

#### CSS classes `.color-xx` are all removed (use `.text-color-xx` or native `color` instead)
> **Note** these extra colors are only available in the Material and Salesforce Themes (not in the Bootstrap Theme since Bootstrap has its own coloring utils).

Since the SVG icons are now pure CSS, we can now colorize any of them the same way that we would do for any other text via the `color` CSS property. For that reason, we no longer need any of the `.color-xx` CSS classes (which were created via CSS [filter](https://developer.mozilla.org/en-US/docs/Web/CSS/filter)). They were useful to override the SVG icon colors, but since we can now use the regular `color` property, the `color-xx` are no longer necessary and are all removed (just use `text-color-xx` instead or use plain colors).

```diff
<button class="button is-small">
- <span class="icon"><i class="mdi mdi-undo color-primary"></i></span>
+ <span class="icon"><i class="mdi mdi-undo text-color-primary"></i></span>
  <span class="text-color-primary">Undo Last Edit</span>
</button>
```
or move the class to the parent container and have both the icon & the text inherit the color :)
```diff
+ <button class="button is-small text-color-primary">
- <span class="icon"><i class="mdi mdi-undo color-primary"></i></span>
+ <span class="icon"><i class="mdi mdi-undo"></i></span>
- <span class="text-color-primary">Undo Last Edit</span>
</button>
```

#### SASS variables
A lot of SASS variables were changed, we recommend that you take a look at the [_variables.scss](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/_variables.scss) file to compare them with yours SASS overrides and fix any SASS build issues. For example a lot of the ms-select variables and all Flatpickr related variables were deleted. Also a lot of the icon related variables got updated (icons now have the suffix `-icon-svg-path` for the SVG vector path). If you want create your own SVGs in pure CSS, you can use the `generateSvgStyle()` function from our [`sass-utilities.scss`](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/sass-utilities.scss) (take a look at the [`slickgrid-icons.scss`](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/slickgrid-icons.scss) on its usage)

#### SASS (dart-sass) `math` polyfills are removed
When SASS (dart-sass) released their version 1.33 (~3 years ago), it caused a ton of console warnings (and a lot of unhappy users) in projects that were using `/` in their SASS files (for math division) instead of their new `math.div()` function. To avoid seeing all these warnings, I added a temporary polyfill at the time (that piece of code was actually copied from the Bootstrap project). That polyfill patch was put in place about 3 years ago, so I'm assuming that most users have already upgraded their SASS version and already fixed all of these warnings. So, I think it's time to remove this polyfill because it was really meant to be a temp patch. If you see these warnings coming back, then a suggestion would be to use the SASS option `--quiet-upstream`.

For reference, below is an example of these old Math warnings when we used to compile it with SASS CLI

```sh
Recommendation: math.div($m, $columns)
More info and automated migrator: https://sass-lang.com/d/slash-div
╷
94 │ margin-right: $m / $columns * 100%
│ ^^^^^^^^^^^^^^^^^^
```

#### Font-Awesome references are removed
Since this release introduces pure CSS SVG icons, I went ahead and deleted all Font-Awesome references (mostly in the Bootstrap Theme), that is because all the built-in icons are now all SVG icons (sort, grouping, row detail, row move, row selection). You can also change these icons via SASS (or CSS variables with a bit more work). However, there are a few plugins that use external icons via CSS classes (mostly all menu plugins like Header Menu, Grid Menu, Content Menu, ...) and for that reason **all Styling Themes** now include the Slickgrid-Universal Material subset icons by default (not just Material & Salesforce but now the Bootstrap Theme as well). In short, the grid now uses SVG icons by default and Font-Awesome icons will no longer be used (you can still use them in your project but it won't be used by the grid unless you set them the grid options).

If you no longer need Font-Awesome, then consider removing it completely

```diff
# package.json
{
  dependencies: {
-   "font-awesome": "^4.7.0"
  }
}
```

What if you don't want to use the Slickgrid-Universal icons subset and want to use a different font/SVG library? In that case, it's suggested to use the "lite" Theme(s) and then make sure to update all the menu plugins with the correct CSS classes, for example the global grid options of the Grid Menu is now configured with the following (notice that we no longer provide any Font-Awesome "fa" icon references in our global grid options). Also note that below is just 1 of the menu plugins to configure, make sure to review them all (you can review the [global-grid-options.ts](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/global-grid-options.ts) file).

```ts
// default global grid options
export const GlobalGridOptions = {
  gridMenu: {
    iconCssClass: 'mdi mdi-menu',
    iconClearAllFiltersCommand: 'mdi mdi-filter-remove-outline',
    iconClearAllSortingCommand: 'mdi mdi-sort-variant-off',
    iconClearFrozenColumnsCommand: 'mdi mdi-pin-off-outline',
    iconExportCsvCommand: 'mdi mdi-download',
    iconExportExcelCommand: 'mdi mdi-file-excel-outline',
    iconExportTextDelimitedCommand: 'mdi mdi-download',
    iconRefreshDatasetCommand: 'mdi mdi-sync',
    iconToggleDarkModeCommand: 'mdi mdi-brightness-4',
    iconToggleFilterCommand: 'mdi mdi-flip-vertical',
    iconTogglePreHeaderCommand: 'mdi mdi-flip-vertical',
  }
}
```

and here's the file size differences with the "lite" (without icons) version vs the default themes (with icons subset)

![image](https://github.com/ghiscoding/slickgrid-universal/assets/643976/0edc9962-d881-49d2-bc47-1f698213ad5e)

### Deprecated code removed/renamed
##### `getHTMLFromFragment()` removed
The function `getHTMLFromFragment()` was removed in favor of `getHtmlStringOutput()`, the new function will auto-detect if it's a DocumentFragment, an HTMLElement or an HTML string and will execute the appropriate action.

##### jQueryUI CSS classes leftovers
There were a few `.ui-state-default`, and any other jQueryUI classes, remaining in the core lib and they were all removed in this release. If you were querying any of them for styling purposes, you can simply rename them to `.slick-state-*`

```diff
- .ui-state-default, .ui-state-hover {
+ .slick-state-default, .slick-state-hover {
}
```

#### Formatters Cleanup & Removals

Since we now only use SVG and we got rid of any Font usage (no more Font-Awesome code anywhere), the `checkmark` Formatter no longer has any reason to exist and was removed. If you were using and still use Font-Awesome in your project, you'll have to either recreate the Formatter yourself or use alternatives. You could use the `Formatters.icon` or `Formatters.iconBoolean` which require the CSS classes to be provided via `params`. As a last alternative, and if you are importing the optional SVG icons `.mdi`, then we recommend you simply use the `checkmarkMaterial` Formatter.

```diff
this.columnDefinitions = [
  {
    id: 'isActive', name: 'Active', field: 'isActive',
-   formatter: Formatters.checkmark
+   formatter: Formatters.checkmarkMaterial
  },
];
```
or create a Custom Formatter

```ts
// create a custom Formatter and returning a string and/or an object of type FormatterResultObject
const myCheckmarkFormatter: Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
  const iconElm = document.createElement('i');
  iconElm.className = value ? 'mdi mdi-check' : '';
  return iconElm;

  // simple HTML string
  return value ? '<i class="mdi mdi-check"></i>' : '';
}
```

## Column Functionalities

### Native Select Filter (removed)
I would be very surprised if anyone have ever used the `Filters.select` and so it was removed in this release. You should simply use the `Filters.singleSelect` or `Filters.multipleSelect`

```diff
prepareGrid() {
  this.columnDefinitions = [{
    id: 'isActive', name: 'Active', field: 'isActive',
    filter: {
-      model: Filters.select,
+      model: Filters.singleSelect,
       collection: [ { value: '', label: '' }, { value: true, label: 'true' }, { value: false, label: 'false' } ],
    }
  }];
}
```

### Date Editor/Filter
We migrated from Flatpicker to Vanilla-Calendar and this require some changes since the option names are different. The changes are the same for both the Filter and the Editor.

The biggest change that you will have to do is the min/max date setting when using the `'today'` shortcut as shown below:

```diff
- import { type FlatpickrOption } from '@slickgrid-universal/common';
+ import { type VanillaCalendarOption } from '@slickgrid-universal/common';

prepareGrid() {
  this.columnDefinitions = [{
    id: 'finish', name: 'Finish', field: 'finish',
    editor: {
      model: Editors.date,
-      editorOptions: { minDate: 'today' } as FlatpickrOption,
+      editorOptions: { range: { min: 'today' } } as VanillaCalendarOption,
    }
  }];
}
```

> **Note** the `'today'` shortcut currently only exist in `Vanilla-Calendar-Picker` fork, however the rest of the settings should be similar, visit `Vanilla-Calendar-Pro` [settings](https://vanilla-calendar.pro/docs/reference/additionally/settings) website for all other options. The hope is to hopefully drop the fork whenever the original project receives all missing features.

### Multiple-Select
Please note that in previous versions we were simply re-exporting the `MultipleSelectOption` interface from the `Multiple-Select-Vanilla` library for convenience, however re-exporting is typically discouraged by the TypeScript team and so it was removed in this release. The change is quite simple, you simply need to import the `MultipleSelectOption` interface from the `multiple-select-vanilla` external library.

```diff
- import { MultipleSelectOption } from '@slickgrid-universal/common';
+ import { MultipleSelectOption } from 'multiple-select-vanilla';

prepareGrid() {
  this.columnDefinitions = [{
    id: 'isActive', name: 'Active', field: 'isActive',
    editor: {
      model: Editors.singleSelect,
      collection: [{ value: true, label: 'true' }, { value: false, label: 'false' }],
      editorOptions: { maxHeight: 400 } as MultipleSelectOption
    }
  }];
}
```

### `internalColumnEditor` is completely removed
The work on this subject started over a month ago in version [v4.6.0](https://github.com/ghiscoding/slickgrid-universal/releases/tag/v4.6.0) to progressively remove `internalColumnEditor` because it was confusing and it is now completely removed. This mean that the column `editor` property will remain untouch (in previous version the `editor` was moved to `internalColumnEditor` and then overriden with the `editor.model`)... in short, the `internalColumnEditor` is removed and the associated confusion is also gone with it.

An example of the previous `internalColumnEditor` usage was when you wanted to modify or push a new item to the editor collection array (see below). In the past, you could not simply push directly to `collection.editor.collection`, you really had to use `collection.internalColumnEditor.collection`... this is thankfully gone, you can now use `collection.editor.collection` 🎉

For example, previously, to add an item to the editor/filter collection 
```diff
this.columnDefinitions = [{ id: 'complexity', editor: { model: Editors.singleSelect, collection: [{ value: 1, label: 'Simple' }, /*...*/ ] } }];

// then adding an item would previously require to use `internalColumnEditor` 
// after grid init, our `editor` became `internalColumnEditor
- const complexityEditor = this.columnDefinitions[0].internalColumnEditor; 
complexityEditor.collection.push({ value: 9, label: 'Hard' });

// NOW with this new release, adding a new item to the collection is as simple as referencing the original object
+ const complexityEditor = this.columnDefinitions[0].editor; 
complexityEditor.collection.push({ value: 9, label: 'Hard' });
```

if you want to read the Editor class (e.g. `Editors.longText`), you can now reference it via `column.editor.model` or via `column.editorClass`