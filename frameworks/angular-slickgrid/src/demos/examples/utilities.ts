export function randomNumber(min: number, max: number, floor = true) {
  const number = Math.random() * (max - min + 1) + min;
  return floor ? Math.floor(number) : number;
}

export function showToast(msg: string, type: 'danger' | 'warning', time = 2000) {
  const divContainer = document.createElement('div');
  divContainer.className = `toast align-items-center text-bg-${type} border-0`;
  divContainer.style.position = 'absolute';
  divContainer.style.left = '50%';
  divContainer.style.top = '20px';
  divContainer.style.transform = 'translate(-50%)';
  divContainer.style.zIndex = '9999';
  divContainer.style.display = 'block';

  const divFlex = document.createElement('div');
  divFlex.className = 'd-flex align-items-center';

  const divBody = document.createElement('div');
  divBody.className = 'toast-body';
  divBody.textContent = msg;

  divContainer.appendChild(divFlex);
  divFlex.appendChild(divBody);
  document.body.appendChild(divContainer);
  console.log('div toast', divContainer.outerHTML);

  setTimeout(() => divContainer.remove(), time);
}

export function zeroPadding(input: string | number) {
  const number = parseInt(input as string, 10);
  return number < 10 ? `0${number}` : number;
}
