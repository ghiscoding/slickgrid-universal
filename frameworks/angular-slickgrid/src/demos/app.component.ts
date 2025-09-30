import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [
        RouterLink,
        RouterLinkActive,
        RouterOutlet,
    ],
})
export class AppComponent {
  title = 'Angular-Slickgrid';
}
