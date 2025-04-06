import { bindable, customElement } from 'aurelia';

@customElement({
  name: 'custom-title-formatter',
  template: '<span style="font-weight: bold" innerhtml.bind="model.assignee.name"></span></template>',
})
export class CustomTitleFormatter {
  @bindable() model: any;
}
