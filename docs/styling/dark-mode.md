## Dark Mode
When enabled (defaults to false), it will show the grid in Dark Mode by add `slick-dark-mode` CSS class to the grid. Note that it is defined as a grid option because the grid uses a few elements that could be appended to the DOM `body` (e.g. ColumnPicker, GridMenu, LongTextEditor, CompositeEditorModal, ...) and when Dark Mode is enabled, it needs to advise these features that we're using Dark Mode (or Light Mode by default). So whenever any of these features are in play, and before it is appended to the `body`, it will add a `slick-dark-mode` (or `ms-dark-mode` for ms-select) CSS class to that element to let it know that we're in Dark Mode. 


### Composite Editor Modal (for Bootstrap users)
For `Bootstrap` users, it will also require the developer to add a `data-bs-theme="dark"` attribute which is also another reason why we added `darkMode` as a grid option. So for Bootstrap users, you will have to add this required attribute by yourself for the Dark Mode to display properly. If you forget to add this attribute, you might see some of the filter inputs and other sections displayed with a white background instead of an expected dark gray backgroud. 

> **Note** the `onRendered` is a new lifecycle callback of Composite Editor Modal that was added specifically for this Bootstrap use case

```ts
this.compositeEditorInstance?.openDetails({
  // ...
  onRendered: (modalElm) => modalElm.dataset.bsTheme = 'dark',
});
```

### Toggle Light/Dark Mode
You can easily toggle light/dark mode by using `grid.setOptions()`

```ts
export class MyDemo {
  isDarkModeEnabled = false;
  gridOptions: GridOption;

  prepareGrid() {
    this.gridOptions = {
      // ...
      darkMode: this.isDarkModeEnabled;
    }
  }

  toggleDarkMode() {
    this.isDarkModeEnabled = !this.isDarkModeEnabled;
    this.sgb.slickGrid?.setOptions({ darkMode: this.isDarkModeEnabled });

    // optionally update your local grid options as well
    this.gridOptions = { ...this.gridOptions, darkMode: this.isDarkModeEnabled };
  }
}
```

### How to Auto-Detect Dark Mode?
By default the grid will **not** auto-detect/auto-switch the browser's Dark Mode (the reason are mentioned in the description above). However, you could implement your own code to detect the color scheme (for modern browser only) when loading your browser and set it in your grid options.

```ts
export class MyDemo {
  gridOptions: GridOption;

  // auto-detect browser's color scheme function
  isBrowserDarkModeEnabled() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  prepareGrid() {
    this.gridOptions = {
      // ...
      darkMode: this.isBrowserDarkModeEnabled();
    }
  }
}
```