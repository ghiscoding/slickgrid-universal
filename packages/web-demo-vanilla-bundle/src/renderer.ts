import { BindingService } from '@slickgrid-universal/vanilla-bundle';

/**
 * This is a simple View/ViewModel Renderer (it will build the ViewModel and render the associated View)
 * It will also
 * 1- bind any delegate method(s) to their ViewModel method
 * 2- add observer(s) to any bindable element (must be an element that can trigger an event, e.g. input with value change)
 *    2.1 you can add the "innerhtml.bind" but only if the variable is associated to an element that can trigger a value change on the variable
 */
export class Renderer {
  view: any;
  viewModel: any;
  className: string;
  observers: BindingService[] = [];

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
        return this.viewModel;
      }
    }
    return null;
  }


  parseTemplate(viewTemplate: string) {
    return viewTemplate
      .replace(/([a-z]*){1}.(delegate)="?(.*?)(\))/gi, this.parseMethodBinding.bind(this))
      .replace(/([a-z]*){1}.(bind)="?([^">\s]*)"?/gi, this.parsePropertyBinding.bind(this))
      .replace(/\${(.*)}/gi, this.parseLogicExecution.bind(this));
  }

  parseLogicExecution(match: string, code: string) {
    return window[this.className][code];
  }

  parseMethodBinding(match: string, eventName: string, eventType: string, callbackFn: string, lastChar: string) {
    let output = '';

    switch (eventType) {
      case 'delegate':
        output = `${eventName.toLowerCase()}="window.${this.className.trim()}.${callbackFn.trim()}${lastChar}"`;
        break;
    }
    return (output || '');
  }

  /**
   * When doing Property Binding, for most of the cases we want to do 2-way binding with the variable in the class
   * For example, if we have value.bind on an input, we want its associated variable to reflect the value in both the View & ViewModel
   */
  parsePropertyBinding(match: string, domAttribute: string, bindingType: string, variableName: string) {
    // wait a cycle so that the View is rendered before observing anything
    setTimeout(() => {
      const elm = document.querySelector(`[${domAttribute}\\\.${bindingType}=${variableName}]`);
      const attribute = domAttribute.toLowerCase();

      // before creating a new observer, first check if the variable already has an associated observer
      // if so then use it and add extra binding to it
      // else create a new observer
      let observer = this.observers.find((bind) => bind.property === variableName);
      if (!observer) {
        observer = new BindingService({ variable: window[this.className], property: variableName });
        this.observers.push(observer);
      }

      switch (attribute) {
        case 'innerhtml':
          observer.bind(elm, 'innerHTML');
          break;
        case 'innertext':
          observer.bind(elm, 'innerText');
          break;
        case 'value':
          observer.bind(elm, attribute, 'change').bind(elm, attribute, 'keyup');
          break;
        case 'checked':
        default:
          observer.bind(elm, attribute, 'change');
          break;
      }
    }, 0);

    // there's nothing to replace in this case, so we can return the original string
    return match;
  }

  render(html: string) {
    this.viewTemplate.innerHTML = html;
    return this.viewTemplate;
  }

  renderError(message: string) {
    this.viewTemplate.innerHTML += `<br /><br /><div class="alert alert-danger">${message}</div>`;
  }
}
