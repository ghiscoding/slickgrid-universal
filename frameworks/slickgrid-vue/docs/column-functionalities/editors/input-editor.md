### Introduction

An input editor is the most common editor, it could be any of these (text, integer, float, password)

#### Regular Text or Number Editor

For editing regular text, you can use `Editors.text` and for numbers then you can use `Editors.integer` or `Editors.float`

```vue
<script setup lang="ts">
function defineGrid() {
  columnDefinitions.value = [
    {
      id: 'firstName', name: 'First Name', field: 'firstName',
      editor: { model: Editors.text },
    },
    {
      id: 'lastName', name: 'Last Name', field: 'lastName',
      editor: { model: Editors.text },
    },
    {
      id: 'age', name: 'Age', field: 'age',
      editor: { model: Editors.integer },
    },
  ];
}
</script>
```

#### Demo with Float Editor and Dollar Currency Formatter

This is probably a common use case to have an editor for editing currency, below is an exampe of dollar currency format and editiing with 2 decimal places (using any other currency would work too).

```vue
<script setup lang="ts">
function defineGrid() {
  columnDefinitions.value = [
    {
      id: 'cost', name: 'Cost', field: 'cost',
      type: 'float',
      formatter: Formatters.dollar, // the Dollar Formatter will default to 2 decimals unless you provide a minDecimal/maxDecimal
      // params: { minDecimal: 2, maxDecimal: 4, }, // optionally provide different decimal places

      // the float editor has its own settings, `decimal` that will be used only in the editor
      // note: that it has nothing to do with the Dollar Formatter
      editor: { model: Editors.float, decimal: 2 },
    },
  ];
}
</script>
```