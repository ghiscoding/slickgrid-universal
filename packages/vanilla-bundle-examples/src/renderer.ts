import * as DOMPurify from 'dompurify';

export class Renderer {
  view: any;
  viewModel: any;
  className: string;

  constructor(private viewTemplate: HTMLDivElement) {
    this.viewTemplate.innerHTML = `Loading`;
  }

  loadView(viewModule: any) {
    const bindedView = this.parseTemplate(viewModule);
    const view = this.render(bindedView);
  }

  loadViewModel(module: any): any {
    const modules = typeof module === 'object' && Object.keys(module);
    if (Array.isArray(modules)) {
      this.className = modules[0];
      if (module.hasOwnProperty(this.className)) {
        this.viewModel = new module[this.className]();
        window[this.className] = this.viewModel;
        return this.viewModel
      }
    }
    return null;
  }

  parseTemplate(viewTemplate: string) {
    return viewTemplate.replace(/([a-z]*){1}.(delegate)="(.*)"/gi, this.parseEventBinding.bind(this));
  }

  parseEventBinding(match: string, eventName: string, eventType: string, callbackFn: Function) {
    let output = '';

    switch (eventType) {
      case 'delegate':
        output = `${eventName.toLowerCase()}="window.${this.className}.${callbackFn}"`;
        break;
    }
    return DOMPurify.sanitize(output || '');
  }

  render(html: string) {
    this.viewTemplate.innerHTML = html;
    return this.viewTemplate;
  }

  renderError(message: string) {
    this.viewTemplate.innerHTML += `<br /><br /><div class="alert alert-danger">${message}</div>`;
  }
}
