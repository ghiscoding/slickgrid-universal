export function randomNumber(min: number, max: number, floor = true) {
  const number = Math.random() * (max - min + 1) + min;
  return floor ? Math.floor(number) : number;
}

export function showToast(msg: string, type: 'danger' | 'info' | 'warning', time = 2000) {
  const divContainer = document.createElement('div');
  divContainer.setAttribute('popover', '');
  divContainer.className = `toast align-items-center text-bg-${type} border-0`;
  divContainer.style.position = 'absolute';
  divContainer.style.zIndex = '9999';

  const divBody = document.createElement('div');
  divBody.className = 'toast-body';
  divBody.textContent = msg;
  divContainer.appendChild(divBody);
  document.body.appendChild(divContainer);

  // When popover is supported, use it to display the message.
  // Baseline 2024: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/showPopover
  if (typeof divContainer.showPopover === 'function') {
    divContainer.style.display = 'block';
    divContainer.style.margin = '0 auto';
    divContainer.style.marginTop = '20px';
    divContainer.style.borderWidth = '0px';
    divContainer.showPopover();
    setTimeout(() => {
      divContainer.hidePopover();
      divContainer.remove();
    }, time);
    return;
  }

  // @deprecated, remove fallback in next major release
  // otherwise, fallback (when popover is not supported): keep the div visible as regular HTML and remove after timeout.
  divContainer.style.left = '50%';
  divContainer.style.top = '20px';
  divContainer.style.transform = 'translateX(-50%)';
  setTimeout(() => divContainer.remove(), time);
}

export function zeroPadding(input: string | number) {
  const number = parseInt(input as string, 10);
  return number < 10 ? `0${number}` : number;
}
