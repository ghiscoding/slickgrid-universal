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
