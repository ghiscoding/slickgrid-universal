import { provideHttpClient, withInterceptorsFromDi, HttpClient } from '@angular/common/http';
import { enableProdMode, provideAppInitializer, Injector, inject, importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateService, TranslateModule, TranslateLoader } from '@ngx-translate/core';
import DOMPurify from 'dompurify';

import { appInitializerFactory, createTranslateLoader } from './demos/app.module';
import { environment } from './demos/environments/environment';
import { AppRoutingRoutingModule } from './demos/app-routing.module';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { AngularSlickgridModule } from './library/modules/angular-slickgrid.module';
import { AppComponent } from './demos/app.component';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      AppRoutingRoutingModule,
      BrowserModule,
      FormsModule,
      NgSelectModule,
      TabsModule.forRoot(),
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient],
        },
      }),
      AngularSlickgridModule.forRoot({
        // add any Global Grid Options/Config you might want
        // to avoid passing the same options over and over in each grids of your App
        enableAutoResize: true,
        autoResize: {
          container: '#demo-container',
          rightPadding: 10,
        },
        // we strongly suggest you add DOMPurify as a sanitizer
        sanitizer: (dirtyHtml) => DOMPurify.sanitize(dirtyHtml, { ADD_ATTR: ['level'], RETURN_TRUSTED_TYPE: true }),
      })
    ),
    provideAppInitializer(() => {
      const initializerFn = appInitializerFactory(inject(TranslateService), inject(Injector));
      return initializerFn();
    }),
    provideHttpClient(withInterceptorsFromDi()),
  ],
}) // preserveWhitespaces is now default to False since Angular 6
  .catch((err) => console.log(err));
