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
  div.setAttribute('popover', '');
  div.className = `notification is-light is-${type} is-small is-narrow toast`;
  div.style.display = 'block';
  div.style.position = 'absolute';
  div.style.zIndex = '999';
  div.textContent = msg;
  document.body.appendChild(div);

  // When popover is supported, use it to display the message.
  // Baseline 2024: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/showPopover
  if (typeof div.showPopover === 'function') {
    div.style.margin = '0 auto';
    div.style.marginTop = '20px';
    div.style.borderWidth = '0px';
    div.showPopover();
    setTimeout(() => {
      div.hidePopover();
      div.remove();
    }, time);
    return;
  }

  // @deprecated, remove fallback in next major release
  // otherwise, fallback (when popover is not supported): keep the div visible as regular HTML and remove after timeout.
  div.style.left = '50%';
  div.style.top = '20px';
  div.style.transform = 'translateX(-50%)';
  setTimeout(() => div.remove(), time);
}

export function zeroPadding(input: string | number) {
  const number = parseInt(input as string, 10);
  return number < 10 ? `0${number}` : number;
}
