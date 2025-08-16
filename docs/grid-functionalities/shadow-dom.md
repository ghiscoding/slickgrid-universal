### Description

You can insert a grid in ShadowDOM by following certain rules as shown below.


```html
<div id="host"></div>
```

## Usage

##### Component
```ts
import { type Column, type GridOption } from '@slickgrid-universal/common';

interface ShadowContainer {
  shadow: ShadowRoot;
  gridContainer: HTMLDivElement;
}

export class Example {
  attached() {
    const shadowObj = this.createShadowElement();

    // define the grid options & columns and then create the grid itself
    this.defineGrid(shadowObj);

    // not sure why but ShadowDOM seems a little slower to render,
    // let's wrap the grid resize in a delay & show the grid only after the resize
    setTimeout(async () => {
      this.sgb = new Slicker.GridBundle(
        shadowObj.gridContainer as HTMLDivElement,
        this.columnDefinitions,
        this.gridOptions,
        this.dataset
      );
      await this.sgb.resizerService.resizeGrid(150);
      shadowObj.gridContainer.style.opacity = '1';
    }, 75);
  }

  createShadowElement(): ShadowContainer {
    const styleElms = document.querySelectorAll<HTMLStyleElement>('head > link[rel=stylesheet]');
    const styleClones = Array.from(styleElms).map((el) => el.cloneNode(true));

    const host = document.querySelector('#host') as HTMLDivElement;
    const shadow = host.attachShadow({ mode: 'open' });
    const gridContainer = document.createElement('div');
    gridContainer.style.opacity = '0';
    shadow.appendChild(gridContainer);
    if (styleElms.length) {
      shadow.prepend(...styleClones);
    } else {
      const linkElement = document.createElement('link');
      linkElement.type = 'text/css';
      linkElement.rel = 'stylesheet';
      linkElement.href = './src/styles.scss';
      shadow.appendChild(linkElement);
    }

    return { shadow, gridContainer };
  }

  /* Define grid Options and Columns */
  defineGrid(shadowObj) {
    this.columnDefinitions = [/* ... */];

    this.gridOptions = {
      // ...
      shadowRoot: shadowObj.shadow,
    };
  }
}
```