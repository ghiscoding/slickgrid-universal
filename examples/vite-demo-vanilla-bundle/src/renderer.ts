import { BindingService } from '@slickgrid-universal/binding';

/**
 * This is a simple View/ViewModel Renderer (it will build the ViewModel and render the associated View)
 * It will also
 * 1- bind any delegate method(s) to their ViewModel method
 * 2- add observer(s) to any bindable element (must be an element that can trigger an event, e.g. input with value change)
 *    2.1 you can add the "innerhtml.bind" but only if the variable is associated to an element that can trigger a value change on the variable
 */
export class Renderer {
  private _className = '';
  private _viewModel: any;
  private _observers: BindingService[] = [];

  constructor(private viewTemplate: HTMLElement) {
    this.viewTemplate.textContent = `Loading...`;
  }

  get className(): string {
    return this._className;
  }

  dispose() {
    let observer = this._observers.pop();
    while (observer) {
      observer.dispose();
      observer = this._observers.pop();
    }
    this._observers = [];
  }

  getModuleClassName(module: any): string {
    let className = '';
    const modules = typeof module === 'object' && Object.keys(module);
    if (Array.isArray(modules) && modules.length > 0) {
      className = modules[0];
    } else if (module?.name) {
      className = module.name;
    }
    return className;
  }

  loadView(viewModule: string) {
    const bindedView = this.parseTemplate(viewModule);
    this.render(bindedView);
  }

  loadViewModel(module: any): any {
    this._className = this.getModuleClassName(module);
    this._viewModel = module?.name ? new module() : new module[this._className]();
    if (this._className) {
      (window as any)[this._className] = this._viewModel;
      return this._viewModel;
    }
    return null;
  }


  parseTemplate(viewTemplate: string) {
    return viewTemplate
      // .replace(/([a-z]*){1}.(delegate)="(.*?)(\(.*\))"/gi, this.parseMethodBinding.bind(this))
      .replace(/([a-z]*){1}.(delegate)="?(.*?)(\))"/gi, this.parseMethodBinding.bind(this))
      .replace(/([a-z]*){1}.(bind)="?([^">\s]*)"?/gi, this.parsePropertyBinding.bind(this))
      .replace(/\${(.*)}/gi, this.parseLogicExecution.bind(this));
  }

  parseLogicExecution(_match: string, code: string) {
    return (window as any)[this._className][code];
  }

  parseMethodBinding(_match: string, eventName: string, eventType: string, callbackFn: string, lastChar: string) {
    let output = '';

    // // wait a cycle so that the View is rendered before observing anything
    // setTimeout(() => {
    //   const elements = document.querySelectorAll<HTMLElement>(`[${eventName}\\\.${eventType}]`);
    //   let args: any = /\(\s*([^)]+?)\s*\)/.exec(fnArgs);
    //   if (args?.[1]) {
    //     args = args[1].split(/\s*,\s*/);
    //   }
    //   this._bindingEventService.bind(elements, eventName, window[this._className.trim()][fnName].bind(window[this._className.trim()], ...(args || [])));
    // });
    // return _match;

    switch (eventType) {
      case 'delegate':
        output = `${eventName.toLowerCase()}="window.${this._className.trim()}.${callbackFn.trim()}${lastChar}"`;
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
      const elements = document.querySelectorAll<HTMLElement>(`[${domAttribute}\\.${bindingType}=${variableName}]`);
      const attribute = domAttribute.toLowerCase();

      // before creating a new observer, first check if the variable already has an associated observer
      // if we can't find an observer then we'll create a new one for it
      let observer = this._observers.find((bind) => bind.property === variableName);
      if (!observer) {
        observer = new BindingService({ variable: (window as any)[this._className], property: variableName });
        this._observers.push(observer);
      }

      switch (attribute) {
        case 'class':
          observer.bind(elements, 'className');
          break;
        case 'innerhtml':
        case 'innerHTML':
          observer.bind(elements, 'innerHTML');
          break;
        case 'innertext':
        case 'innerText':
          observer.bind(elements, 'innerText');
          break;
        case 'style':
          observer.bind(elements, 'style');
          break;
        case 'textcontent':
        case 'textContent':
          observer.bind(elements, 'textContent');
          break;
        case 'value':
          // add 2 possible events (change/keyup) on a value binding
          observer.bind(elements, attribute, 'change').bind(elements, attribute, 'keyup');
          break;
        case 'checked':
        case 'min':
        case 'max':
        default:
          observer.bind(elements, attribute, 'change');
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
