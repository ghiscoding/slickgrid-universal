## Version 5 - Better Dark Mode with Pure CSS SVG icons 
This new release brings a lot of changes oriented towards better UI/UX, our SVG icons are now pure CSS and can be colorized like any other text via the `color` CSS property (which helps a lot for the Dark Mode Theme). However this change come with an important change to the user (you), that is if you were using any of the `.mdi` SVG icons, these icons were renamed to `.sgi` (SlickGrid Icons) because of how the SVG are created which is entirely different compare to previous `.mdi`

Another noticeable UI change is the migration from [Flatpickr](https://flatpickr.js.org/) to [Vanilla-Calendar-Picker](https://github.com/ghiscoding/vanilla-calendar-picker) (which is in fact a fork of [Vanilla-Calendar-Pro](https://vanilla-calendar.pro/) and maybe one day we'll drop the fork if possible), there are multiple reasons to migrate our date picker to another library:
- Flatpickr cons:
  - barely supported (lots of opened PR but nothing merged for the past 2 years)
  - not fully ESM ready (it's only partially ESM, for example it is detected as CJS in Angular-Slickgrid and requires to be added to `allowedCommonJsDependencies`)
  - styling could be a bit more modern (the use of native select/input to change year/month/time is a bit outdated and rudimentary)
  - date range selection is not very user friendly (UX)
- Vanilla-Calendar pros:
  - ESM ready
  - modern styling and also include Dark Mode theme
  - date range becomes a lot more easy by displaying a picker with 2 months
  - much smaller size (a decrease of 2.9% (17Kb) was found, expect even more decreate with gzip)
- Vanilla-Calendar cons:
  - settings are named differently and are not using flat config (complex object settings)
    - for example Flatpickr `minDate: 'today'` is instead `range: { min: 'today' }` 
  - some settings were missing, like the `'today'` shortcut which is why I forked the project 
    - I did open a few PRs on the main project, so the hope is to drop the fork in the future while being a totally transparent change to the user (you)

#### Major Changes - Quick Summary
- minimum requirements bump
  - Node 18 is now required
  - migrate to [Vanilla-Calendar-Picker](https://github.com/ghiscoding/vanilla-calendar-picker) (visit [Vanilla-Calendar-Pro](https://vanilla-calendar.pro/) for all docs)

> **Note** for the entire list of tasks & code changes applied in this release, you may want to take a look at the [Discussion - Roadmap to 5.0](https://github.com/ghiscoding/slickgrid-universal/discussions/1482)

---

**NOTE:** if you come from an earlier version, please make sure to follow each migration in their respected order (review other migration guides)

## Changes
### Styling
#### `.mdi` SVG icons were renamed to `.sgi`
The previous `.mdi` Material Design Icons were renamed to `.sgi` SlickGrid Icons mostly because the icons are now pure CSS and the way we create the icons is totally different in comparison to the `.mdi` icons. The `.sgi` icons can now be colorized like any other text via the `color` CSS property but that was not possible with the previous `.mdi` icons.


We recommend to do a search and replace in your editor (below is 1 of **many** changes you will have to do)

```diff
this.columnDefinitions = {
  id: 'action', name: 'Action', field: 'action',
  cellMenu: {
    hideCloseButton: false,
    commandTitle: 'Commands',
    commandItems: [
      {
        command: 'edit',
        title: 'Edit Row',
-       iconCssClass: 'mdi mdi-square-edit-outline',
+       iconCssClass: 'sgi sgi-square-edit-outline',
        positionOrder: 66,
        action: () => this.openCompositeModal('edit'),
      },
    ]
  }
}
```

#### `.color-xx` are removed (use `.text-color-xx` instead)
Since the SVG icons are now pure CSS, we can now colorize them the same way that we would do for any other text via the `color` CSS property. Because of that, we no longer need any of the `.color-xx` classes (which were created via CSS [filter](https://developer.mozilla.org/en-US/docs/Web/CSS/filter)). They were useful to override the SVG icon colors, but since we can now use regular `color` property, I decided to keep only the `text-color-xx` and remove all `color-xx`

```diff
<button class="button is-small">
- <span class="icon"><i class="mdi mdi-undo color-primary"></i></span>
+ <span class="icon"><i class="sgi sgi-undo text-color-primary"></i></span>
  <span>Undo Last Edit</span>
</button>
```

### Deprecated code removed/renamed

##### SASS variables
A lot of SASS variables changed, we recommend you take a look at the [_variables.scss](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/_variables.scss) file to compare with yours SASS overrides and fix any SASS build issues. 

##### SASS `math` polyfills are removed
When Dart-SASS released their version 1.33, it caused a lot of console warnings (and lot of unhappy users) in projects that were using `/` (for math division) instead of their new `math.div` function. To avoid seeing all these warnings, I had created a temporary polyfill (that piece of code was actually copied from Bootstrap project). This change happened 3 years ago, so I'm assuming that most users have already upgraded their SASS and fix these warnings and I think it's time to remove this polyfill since it was always meant to be a temp patch. If you see these warnings coming back, you can use the SASS option `--quiet-upstream`.

For reference, below is an example of these old Math warnings when we were compiling SASS

```sh
Recommendation: math.div($m, $columns)
More info and automated migrator: https://sass-lang.com/d/slash-div
╷
94 │ margin-right: $m / $columns * 100%
│ ^^^^^^^^^^^^^^^^^^
```

##### jQueryUI CSS class leftovers
There were a few `.ui-state-default` and other jQueryUI CSS classes leftovers in the core lib, they were all removed in this release. If you were using any of them for styling purposes, you can simply rename them to `.slick-state-`

```diff
- .ui-state-default, .ui-state-hover {
+ .slick-state-default, .slick-state-hover {
}
```

## Grid Functionalities
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

> **Note** the `'today'` shortcut currently only exist in `Vanilla-Calendar-Picker` fork, however the rest of the settings should be similar, visit `Vanilla-Calendar-Pro` [settings](https://vanilla-calendar.pro/docs/reference/additionally/settings) website for all other options.

