# Svelte localization with i18next

Slickgrid-Svelte supports i18next. Provide the instance through the grid's `i18n` prop, `options.i18n`, or Svelte context under the key `i18next`. The wrapper connects language changes to SlickGrid and removes its listener when the grid is disposed.

## Pass i18next directly

```ts
// i18n.ts
import { createInstance } from 'i18next';

export const i18n = createInstance();
void i18n.init({
  resources: {
    en: { translation: { TITLE: 'Title', DURATION: 'Duration' } },
    fr: { translation: { TITLE: 'Titre', DURATION: 'Durée' } },
  },
  lng: 'en',
  fallbackLng: 'en',
  initAsync: false,
  interpolation: { escapeValue: false },
});
```

```svelte
<script lang="ts">
  import { SlickgridSvelte, type GridOption } from 'slickgrid-svelte';
  import { i18n } from './i18n.js';

  const options: GridOption = { enableTranslate: true };
  const columns = [
    { id: 'title', name: 'Title', field: 'title', headerKey: 'TITLE' },
    { id: 'duration', name: 'Duration', field: 'duration', headerKey: 'DURATION' },
  ];
</script>

<SlickgridSvelte gridId="tasks" {columns} {options} {dataset} {i18n} />
```

Changing the language on the same instance updates grid translations:

```ts
await i18n.changeLanguage('fr');
```

## Use Svelte context

If the application already provides i18next through Svelte context, set the `i18next` key in a parent component before rendering the grid:

```svelte
<script lang="ts">
  import { setContext } from 'svelte';
  import { i18n } from './i18n.js';

  setContext('i18next', i18n);
</script>

<SlickgridSvelte gridId="tasks" {columns} {options} {dataset} />
```

The explicit `i18n` prop takes precedence over `options.i18n`, which takes precedence over context.

## Custom translate service

You can provide a SlickGrid `TranslaterService` through `options.translater` instead of i18next. If `enableTranslate` is true and neither an i18next instance nor a translater service is available, the wrapper throws an error during grid setup.

For shared translation keys, custom locales, and translate formatters, see [i18next Localization](localization-i18n.md), [Single Locale](localization-single-locale.md), and [Custom Translate Service](localization-translate-service.md).
