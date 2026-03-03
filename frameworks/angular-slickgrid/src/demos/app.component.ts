import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
})
export class AppComponent implements OnInit {
  title = 'Angular-Slickgrid';

  ngOnInit() {
    // scroll to active link route, there's probably a better way to do this but couldn't find lifecycle for it
    setTimeout(() => {
      const linkElm = document.querySelector('.nav-link.active');
      linkElm?.scrollIntoView({ block: 'nearest' });
    }, 45);
  }
}
