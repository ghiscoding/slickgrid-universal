## Installation Instructions for Salesforce
This document shows how to get this Slickgrid bundle working with Salesforce LWC (Lighning Web Component).

### Step 1. install dependencies (static resources) one time setup in your org
The first thing you'll need to do is to add the slickgrid bundle zip file as a new static resource, you can see below the name that we used in our Salesforce org (you can name then differently). The resource named `Sf_SlickGrid` comes from the zip file that gets created every time a new dist build is updated, the zip file can be downloaded [here](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/vanilla-force-bundle/dist-grid-bundle-zip).

#### Here are the 3 static resource files
Click on the `zip` link and then the `Download` button on the top right to download it locally, then upload it to your org.

**Note** Slickgrid-Universal 2.0 dropped jQueryUI requirement. If you come from Slickgrid-Universal version 1.x, then you will also need to follow the [Migration Guide 2.0](https://github.com/ghiscoding/slickgrid-universal/wiki/Migration-to-2.x) to upgrade to 2.x

**Note** Slickgrid-Universal 3.0 dropped jQuery requirement, now the only requirement left is really the slickgrid bundle itself (see static resource below). Also note that if you come from an earlier version then make sure to follow [Migration Guide 3.0](https://github.com/ghiscoding/slickgrid-universal/wiki/Migration-to-3.x) to upgrade to 3.x

| Static Resource Name | Zip | Notes |
| -------- | --- | ----------- |
| `Sf_SlickGrid` | [zip](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/vanilla-force-bundle/dist-grid-bundle-zip/slickgrid-vanilla-bundle.zip) | the file name is `slickgrid-vanilla-bundle.zip` and we named our static resource as **`Sf_SlickGrid`** but it could be any name really |

### Step 2. load Slickgrid

#### 2.1 First Approach
Create all the Static Resources that are required by Slickgrid-Universal as shown below (they could have different names in your org).


###### View
```html
<template>
    <!-- show a spinner -->
    <div if:false={isLoaded} class="slds-is-relative">
          <lightning-spinner alternative-text="Loading...">
          </lightning-spinner>
    </div>

    <!-- slickGrid container-->
    <div class="grid-container slds-p-horizontal">
          <div class="user-grid"></div>
    </div>
</template>
```

In the same file, load all external files with `connectedCallback` and get your data through a `@wire` method. Technically the `@wire` method will be processed before the `connectedCallback` and so you can assume that when calling the `initializeGrid` method we will already have the dataset ready.

Notice below that in the `gridOptions`, there is a flag `useSalesforceDefaultGridOptions` that was added specifically for Salesforce project, it will internally use these global [salesforce grid options](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/vanilla-force-bundle/src/salesforce-global-grid-options.ts) for Salesforce (these options are merged with the following default global [grid options](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/global-grid-options.ts)).

###### Component

_*Note* loading of static files could be handled by an external helper component (**also see [section 2.2](#22-second-approach-much-easier-implementation-recommended) below, which is our recommended approach**)_

```js
import { LightningElement, api, wire } from 'lwc';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// Static Resources (Slickgrid, and Icon Font)
import sf_slickGrid_bundle from '@salesforce/resourceUrl/Sf_SlickGrid'; // the zip described at step 1.1

import getSomeData from '@salesforce/apex/SomeService.getSomeData';

export default class YourComponent extends LightningElement {
  slickGridInitialized = false;
  sgb;
  isLoaded = false;
  dataset = []; // load your data through an Apex Controller with @wire

  @api recordId;

  @wire(getSomeData, { recordId: '$recordId' })
  wiredGetSomeData({ error, data }) {
    if (data) {
        this.dataset = data || [];

        if (window.Slicker && window.Slicker.Utilities && this.sgb) {
            this.sgb.dataset = this.dataset;
        }
    } else if (error) {}
    this.isLoaded = true; // stop the spinner
  }

  async connectedCallback() {
    if (this.slickGridInitialized) {
        return;
    }

    try {
        this.slickGridInitialized = true;

        // load all CSS Styles
        await loadStyle(this, `${sf_slickGrid_bundle}/styles/css/slickgrid-theme-salesforce.css`);

        // load all JS files
        await loadScript(this, `${sf_slickGrid_bundle}/slickgrid-vanilla-bundle.js`);

        // create the grid (column definitions, grid options & dataset)
        this.initializeGrid();
    } catch (error) {
        this.dispatchEvent(new ShowToastEvent({ title: 'Error loading SlickGrid', message: error && error.message || '', variant: 'error', }));
    }
  }

  initializeGrid() {
    this.columnDefinitions = [
      { id: 'firstName', name: 'First Name', field: 'firstName' },
      { id: 'lastName', name: 'Last Name', field: 'lastName' },
      // ...
   ];

    this.gridOptions = {
      useSalesforceDefaultGridOptions: true,  // enable this flag to use regular grid options used for SF project

      autoResize: {
        container: '.grid-container',
        minHeight: 250,
        rightPadding: 50,
        bottomPadding: 75,
      },

      // or use fixed size
      // gridHeight: 300,
      // gridWidth: 800,

      // datasetIdPropertyName: 'someOtherId', // default is "Id" (case sensitive)

      /** other options... */
    };

    // find your HTML slickGrid container & pass it to the Slicker.GridBundle instantiation
    const gridContainerElement = this.template.querySelector(`.user-grid`);
    this.sgb = new Slicker.GridBundle(gridContainerElement, this.columnDefinitions, this.gridOptions, this.dataset);
  }
}
```

#### 2.2 Second Approach for loading Static Resources (Recommended Approach)
**NOTE:** in our implementation, we moved all the common css/script imports into a `slickGridHelper` LWC component, this allowed us to have much simpler imports in our external components (see next paragraph below).

```javascript
import sf_slickGrid_bundle from '@salesforce/resourceUrl/Sf_SlickGrid';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';

// declare variables for all types, this will allow us to use `Formatters.bold` instead of `Slicker.Formatters.bold`
// all Wikis are written without the `Slicker` namespace, so doing this approach is better
export const Aggregators = {};
export const BindingService = {};
export const Editors = {};
export const Enums = {};
export const Filters = {};
export const Formatters = {};
export const GroupTotalFormatters = {};
export const SortComparers = {};
export const Utilities = {};
export const GridBundle = {};

/** Load all necessary SlickGrid resources (css/scripts) */
export async function loadResources(component) {
    await loadStyle(component, `${sf_slickGrid_bundle}/styles/css/slickgrid-theme-salesforce.css`);
    await loadScript(component, `${sf_slickGrid_bundle}/slickgrid-vanilla-bundle.js`);
    Aggregators = Slicker.Aggregators;
    BindingService = Slicker.BindingService;
    Editors = Slicker.Editors;
    Enums = Slicker.Enums;
    Filters = Slicker.Filters;
    Formatters = Slicker.Formatters;
    GroupTotalFormatters = Slicker.GroupTotalFormatters;
    SortComparers = Slicker.SortComparers;
    Utilities = Slicker.Utilities;
    GridBundle = Slicker.GridBundle;
}
```

and finally the setup of Slickgrid becomes a lot more simplified in our external component (the other advantage is that all Wikis are written with this approach, that is without the `Slicker` namespace and it is closer to what we could do with TypeScript since all Wikis are actually written with TypeScript code)

```javascript
import { Editors, Filters, Formatters, GridBundle, loadResources } from 'c/slickGridHelper';

export default class SlickGridDemo extends LightningElement {
  isResourceLoaded = false;

  async connectedCallback() {
    if (this.isResourceLoaded) {
      return; // load only once
    }
    await loadResources(this);
    this.initializeGrid();
    this.isResourceLoaded = true;
  }
}
```