### Why use ngx-translate and not i18n?
We use `ngx-translate` because the `i18n` from Angular core is yet to support dynamic translation (without reloading the page) which is a must for our project. However it is ~~suppose to land in Angular `6.x`~~ (still postponed) as the `ngx-translate` author wrote [here](https://github.com/ngx-translate/core/issues/495#issuecomment-325570932), he is also 1 of the guy working on implementing it in the Angular core. When the `i18n` Service supports dynamic translation, I will revisit this implementation but in the mean time we will stick with `ngx-translate`.

### Demo
[Demo Page](https://ghiscoding.github.io/angular-slickgrid-demos/#/localization) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/frameworks/angular-slickgrid/src/demos/examples/grid-localization.component.ts) / [Translation Files](https://github.com/ghiscoding/slickgrid-universal/tree/master/frameworks/angular-slickgrid/src/assets/i18n)

#### ngx-translate setup
[Demo Component](https://github.com/ghiscoding/slickgrid-universal/tree/master/frameworks/angular-slickgrid/src/library)

### Angular Versions and `ngx-translate`

In order to use `ngx-translate`, you will have to use `@ngx-translate/core` and possibly `@ngx-translate/http-loader`. Check the table below to find the correct version to use and get more info from their website: https://ngx-translate.org/getting-started/installation/


| Angular Version         | @ngx-translate/core |
|-------------------------|---------------------|
|  21+                    |        17.x         |
|  16 - 19+               |        16.x         |
|  16 - 17+               |        16.x (15.x)  |
|  13 - 15 (**Ivy only**) |        14.x         |
|  10-12                  |        13.x         |
|  8-9                    |        12.x         |
|  7                      |        11.x         |

### 1. for `Angular-Slickgrid` <= 9.0

#### Minimal installation (~even if you are not using any other locales~)
If you use only 1 locale, you can now disregard `ngx-translate` installation completely, head over to the new [Wiki - Providing Custom Locale](localization-with-custom-locales.md) for more details. But if you still wish to install the minimum installation to get `ngx-translate` then continue reading.

##### Install NPM package

```typescript
npm install @ngx-translate/core
```

##### App Module

```typescript
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSlickgridModule } from 'angular-slickgrid';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    TranslateModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### Regular Installation
#### NPM
You need to make sure that you have `@ngx-translate/core` installed. Then optionally, you will need a loader, the most recommended one is `@ngx-translate/http-loader`. For more installation and usage information, you can visit the official [ngx-translate site](https://github.com/ngx-translate/core#installation)

```bash
npm install @ngx-translate/core @ngx-translate/http-loader
```

#### App initializer (optional)
If you use the recommended `http-loader`, you might encounter some async problem with `Angular-Slickgrid`. The reason is simple, `SlickGrid` is a `jQuery` lib and it's Formatters and everything else needs to return data instantly (not asynchronously) and `Angular-Slickgrid` uses the `.instant(key)` function and the data must be loaded prior to performing the `.instant()`. So to avoid such async problem, it is recommended to use an App Initializer as documented [here](https://github.com/ngx-translate/core/issues/517#issuecomment-299637956), this will make sure that you will start loading the page once all the translation data is ready.

#### App Module
As mentioned in previous paragraph, you can choose multiple type of loader. However, if you choose the recommended `http-loader` and the `App Initializer` describe earlier, then your App module should have something along these lines
```typescript
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Injector, APP_INITIALIZER, NgModule } from '@angular/core';
import { LOCATION_INITIALIZED } from '@angular/common';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

// for @ngx-translate <=16.0
// AoT requires an exported function for factories
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

// use an Initializer Factory as describe here: https://github.com/ngx-translate/core/issues/517#issuecomment-299637956
export function appInitializerFactory(translate: TranslateService, injector: Injector) {
  return () => new Promise<any>((resolve: any) => {
    const locationInitialized = injector.get(LOCATION_INITIALIZED, Promise.resolve(null));
    locationInitialized.then(() => {
      const langToSet = 'en';
      translate.setFallbackLang('en'); // OR `translate.setDefaultLang('en')` for ngx-translate<=16
      translate.use(langToSet).subscribe(() => {
        // console.info(`Successfully initialized '${langToSet}' language.'`);
      }, err => {
        console.error(`Problem with '${langToSet}' language initialization.'`);
      }, () => {
        resolve(null);
      });
    });
  });
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,

    // for @ngx-translate <=16.0 (ONLY)
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFactory,
      deps: [TranslateService, Injector],
      multi: true
    },
    // for @ngx-translate >=17.0
    provideTranslateService({
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    }),
    GridOdataService,
    ResizerService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

#### Angular 7+

The new updated version of `ng-packagr` use strict metadata and you might get errors about `Lambda not supported`, to bypass this problem you can add the `@dynamic` over the `@NgModule` as so:

```ts
// @dynamic
@NgModule({
  ...
})
```

### 2. for `Angular-Slickgrid` >= 10.0

#### App Initializer
The App initializer is useful to fetch all translactions locales asynchronously before any of the component loads. This step is important if you need to fetch translations from JSON assets in an asynchronous step before any other component loads.

You can move the App Initializer to a separate file or simply add it to your `main.ts`

```ts
// app-initializer.ts
import { LOCATION_INITIALIZED } from '@angular/common';
import { type Injector } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// use an Initializer Factory as describe here: https://github.com/ngx-translate/core/issues/517#issuecomment-299637956
export function appInitializerFactory(translate: TranslateService, injector: Injector) {
  return () =>
    new Promise<any>((resolve: any) => {
      const locationInitialized = injector.get(LOCATION_INITIALIZED, Promise.resolve(null));
      locationInitialized.then(() => {
        const langToSet = 'en';
        translate.setFallbackLang('en');
        translate.use(langToSet).subscribe({
          next: () => {
            // console.info(`Successfully initialized '${langToSet}' language.'`);
          },
          error: () => console.error(`Problem with '${langToSet}' language initialization.'`),
          complete: () => resolve(null),
        });
      });
    });
}
```

then use it in your App `main.ts`

```ts
// main.ts
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { enableProdMode, importProvidersFrom, inject, Injector, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppComponent } from './demos/app.component';
import { appInitializerFactory } from './demos/app.initializer';
import { AngularSlickgridComponent, GridOption } from 'angular-slickgrid';

// define Angular-Slickgrid default grid options that are common to all grids
const gridOptionConfig: GridOption = {
  enableAutoResize: true,
  // ...
};

bootstrapApplication(AppComponent, {
  providers: [
    AngularSlickgridComponent,
    { provide: 'defaultGridOption', useValue: gridOptionConfig },

    // load your App Initializer to pre-fetch your translations
    provideAppInitializer(() => {
      const initializerFn = appInitializerFactory(inject(TranslateService), inject(Injector));
      return initializerFn();
    }),

    // configure ngx-translate
    provideTranslateService({
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    }),
    provideHttpClient(withInterceptorsFromDi()),
  ],
}).catch((err) => console.log(err));
```

### 3. Locales

The final step is that you need the actual translations. Note that `ngx-translate` does not support multiple files, with that in mind see below for the following options that you have.

1. Manually copy the translation keys/values
2. Manually copy the JSON files to your `src/assets` folder
3. Modify `angular-cli.json` to copy the JSON files to your `src/assets` folder.
   - I tried following these [instructions](https://github.com/angular/angular-cli/issues/3555#issuecomment-351772402) but that didn't work
4. Modify your `package.json` and add a script to copy the JSON files to your `src/assets` folder
   - install NPM packages `native-copyfiles` (`npm install native-copyfiles`)
   - add a new script in your `package.json`
   - run the below script **once** with `npm run copy:i18n` and you should now have the JSON files in your `src/assets` folder

```typescript
"copy:i18n": "copyfiles -f node_modules/angular-slickgrid/i18n/*.json src/assets/i18n"
```

If you want to manually re-create the translation in your own files, the list of translations that you will need are displayed in the [asset i18n](https://github.com/ghiscoding/slickgrid-universal/tree/master/frameworks/angular-slickgrid/src/assets/i18n) translation folder (from that file, you need all translations shown before the 'BILLING', the next few ones are for the demo page only)
