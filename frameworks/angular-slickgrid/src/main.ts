import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { enableProdMode, importProvidersFrom, inject, Injector, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { NgSelectModule } from '@ng-select/ng-select';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import DOMPurify from 'dompurify';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { AppRoutingRoutingModule } from './demos/app-routing.module';
import { AppComponent } from './demos/app.component';
import { appInitializerFactory } from './demos/app.module';
import { environment } from './demos/environments/environment';
import { AngularSlickgridModule } from './library/modules/angular-slickgrid.module';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    importProvidersFrom(
      AppRoutingRoutingModule,
      BrowserModule,
      FormsModule,
      NgSelectModule,
      TabsModule.forRoot(),
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
    provideTranslateService({
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    }),
    provideHttpClient(withInterceptorsFromDi()),
  ],
}) // preserveWhitespaces is now default to False since Angular 6
  .catch((err) => console.log(err));
