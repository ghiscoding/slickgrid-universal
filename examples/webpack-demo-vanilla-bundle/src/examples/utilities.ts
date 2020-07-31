import { Renderer } from '../renderer';

export function loadComponent<T = any>(containerElement: HTMLDivElement, componentModuleId: string, bindings?: any): T {
  if (containerElement) {
    const renderer = new Renderer(containerElement);
    const viewModel = renderer.loadViewModel(require(`${componentModuleId}.ts`));
    if (viewModel && viewModel.dispose) {
      window.onunload = viewModel.dispose; // dispose when leaving SPA
    }

    renderer.loadView(require(`${componentModuleId}.html`));
    if (viewModel && viewModel.attached && renderer.className) {
      const viewModelObj = {};
      viewModelObj[renderer.className] = viewModel;
      viewModel.attached();
      if (viewModel && viewModel.bind) {
        viewModel.bind(bindings);
      }
    }
    return viewModel;
  }
  return null;
}
