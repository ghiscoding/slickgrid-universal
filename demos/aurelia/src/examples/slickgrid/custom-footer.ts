import { customElement } from 'aurelia';

@customElement({
  name: 'custom-footer',
  template: `<button click.trigger="clickMe()">I'm a button from an Aurelia custom element (click me)</button>
  <div if.bind="clickedTimes">You've clicked me \${clickedTimes} time(s)</div>`
})
export class CustomFooter {
  clickedTimes = 0;

  clickMe() {
    this.clickedTimes++;
  }
}
