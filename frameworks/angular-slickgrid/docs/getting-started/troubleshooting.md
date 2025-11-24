## Troubleshooting

### `ngcc` Build Warnings (Angular >=8.0 && <16.0)
You might get warnings about SlickGrid while doing a production build, most of them are fine and the best way to fix them, is to simply remove/ignore the warnings, all you have to do is to add a file named `ngcc.config.js` in your project root (same location as the `angular.json` file) with the following content (you can also see this [commit](https://github.com/ghiscoding/angular-slickgrid-demos/commit/1fe8092bcd2e99ede5ab048f4a7ebe6254e4bee0) which fixes the Angular-Slickgrid-Demos prod build):
```js
module.exports = {
  packages: {
    'angular-slickgrid': {
      ignorableDeepImportMatchers: [
        /assign-deep/,
        /dequal/,
        /slickgrid\//,
        /flatpickr/,
      ]
    },
  }
};
```

### Angular 12 with WebPack 5 - how to fix polyfill error
Since Angular 12 switched to WebPack 5, you might get some new errors and you will need to add some polyfills manually to get the Excel Builder (Excel Export) to work.

#### The error you might get

```text
BREAKING CHANGE: webpack < 5 used to include polyfills for node.js core modules by default.
This is no longer the case. Verify if you need this module and configure a polyfill for it.
```

#### Steps to fix it
1. `npm install stream-browserify`
2. Add a path mapping in `tsconfig.json`:
```ts
{
  ...
  "compilerOptions": {
    "paths": {
      "stream": [ "./node_modules/stream-browserify" ]
    },
  }
}
```
3. Add `stream` (and any other CJS deps) to `allowedCommonJsDependencies` in your `angular.json` config:
```ts
"options": {
  "allowedCommonJsDependencies": [
    "stream"
  ],
},
```
