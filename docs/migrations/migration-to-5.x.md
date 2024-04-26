## Better Dark Mode with Pure CSS SVG icons 
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
  - date range is super easy by showing a picker with 2 months
  - much smaller size (a decrease of 17kb in the zip file, expect even smaller with gzip)
- Vanilla-Calendar cons:
  - settings are named differently and are not flat config
    - for example Flatpickr `minDate: 'today'` is a complex object setting in Vanilla-Calendar `range: { min: 'today' }`
  - some settings were missing, like the `'today'` shortcut which is why I forked the project 
    - I did open PRs on the main project, so the hope is to drop the fork in the future while staying totally transparent to the user

#### Major Changes - Quick Summary
- minimum requirements bump
  - Node 18 is now required
  - migrate to [Vanilla-Calendar-Picker](https://github.com/ghiscoding/vanilla-calendar-picker)

> **Note** for the full internal list of code changes applied in this release, you can take a look at the [Discussion - Roadmap to 4.0](https://github.com/ghiscoding/slickgrid-universal/discussions/1108)

---

**NOTE:** if you come from an earlier version, please make sure to follow each migration in their respected order (see Wiki index)

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

### Date Editor/Filter
We migrated from Flatpicker to Vanilla-Calendar and this require some changes since the option names are different. The changes are the same for both the Filter and the Editor.

The biggest change that you will have to do is the min/max date setting when using the `'today'` shortcut as shown below:

```diff
this.columnDefinitions = {
  id: 'finish', name: 'Finish', field: 'finish',
  editor: {
    model: Editors.date,
    editorOptions: {
-     minDate: 'today',
+     range: { min: 'today' },
    }
  }
}
```

> **Note** the `'today'` shortcut only exist in `Vanilla-Calendar-Picker` fork, however the rest of the settings should be similar, visit `Vanilla-Calendar-Pro` [settings](https://vanilla-calendar.pro/docs/reference/additionally/settings) website for all other options.

### Deprecated code removed/renamed

##### SASS variables
A lot of SASS variables changed, we recommend you take a look at the [_variables.scss](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/_variables.scss) file to compare with yours SASS overrides and fix any SASS build issues. 

##### Grid Options
