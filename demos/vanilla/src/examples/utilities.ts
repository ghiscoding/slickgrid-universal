import { Renderer } from '../renderer.js';

export function loadComponent<T = any>(containerElement: HTMLDivElement, htmlView: string, vmModule: any, bindings?: any): T | null {
  if (containerElement) {
    const renderer = new Renderer(containerElement);
    const viewModel = renderer.loadViewModel(vmModule);
    if (viewModel?.dispose) {
      window.onunload = viewModel.dispose; // dispose when leaving SPA
    }

    renderer.loadView(htmlView);
    if (viewModel?.attached && renderer.className) {
      const viewModelObj = {};
      viewModelObj[renderer.className] = viewModel;
      viewModel.attached();
      if (viewModel?.bind) {
        viewModel.bind(bindings);
      }
    }
    return viewModel;
  }
  return null;
}

export function randomNumber(min: number, max: number, floor = true) {
  const number = Math.random() * (max - min + 1) + min;
  return floor ? Math.floor(number) : number;
}

export function showToast(msg: string, type: 'danger' | 'info' | 'warning', time = 2000) {
  const div = document.createElement('div');
  div.className = `notification is-light is-${type} is-small is-narrow toast`;
  div.style.position = 'absolute';
  div.style.left = '50%';
  div.style.top = '20px';
  div.style.transform = 'translate(-50%)';
  div.style.zIndex = '999';
  div.textContent = msg;
  document.body.appendChild(div);

  setTimeout(() => div.remove(), time);
}

export function zeroPadding(input: string | number) {
  const number = parseInt(input as string, 10);
  return number < 10 ? `0${number}` : number;
}
