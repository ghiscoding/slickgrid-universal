import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { enableProdMode, importProvidersFrom, inject, Injector, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import DOMPurify from 'dompurify';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { routes } from './demos/app-routing.module';
import { AppComponent } from './demos/app.component';
import { appInitializerFactory } from './demos/app.initializer';
import { environment } from './demos/environments/environment';
import { AngularSlickgridComponent, GridOption } from './library';

if (environment.production) {
  enableProdMode();
}

// define Angular-Slickgrid default grid options that are common to all grids
const gridOptionConfig: GridOption = {
  enableAutoResize: true,
  autoResize: {
    container: '#demo-container',
    rightPadding: 10,
  },
  // we strongly suggest you add DOMPurify as a sanitizer for security reasons (XSS, etc.)
  // the "level" attribute is used by SlickGrid for Grouping & Tree Data level indentation
  sanitizer: (dirtyHtml) => DOMPurify.sanitize(dirtyHtml, { ADD_ATTR: ['level'], RETURN_TRUSTED_TYPE: true }),
};

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserModule, FormsModule, NgSelectModule, RouterModule.forRoot(routes, { useHash: true }), TabsModule.forRoot()),
    AngularSlickgridComponent,
    { provide: 'defaultGridOption', useValue: gridOptionConfig },
    provideAppInitializer(() => {
      const initializerFn = appInitializerFactory(inject(TranslateService), inject(Injector));
      return initializerFn();
    }),
    provideTranslateService({
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    }),
    provideHttpClient(withInterceptorsFromDi()),
    provideZoneChangeDetection(),
  ],
}).catch((err) => console.log(err));
