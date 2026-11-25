<script lang="ts">
  import type { Assignee } from './data/assignee.model.js';

  let {
    collection = [],
    selectedItem = $bindable(),
    onSelectedItemChanged,
  }: { collection?: Assignee[]; selectedItem?: Assignee; onSelectedItemChanged?: (item: Assignee | undefined) => void } = $props();

  let selectElm: HTMLSelectElement;

  export function focus() {
    selectElm?.focus();
  }

  export function hide() {
    selectElm?.setAttribute('hidden', 'true');
  }

  export function show() {
    selectElm?.removeAttribute('hidden');
  }

  export function setValue(item: Assignee | undefined) {
    selectedItem = item;
    if (selectElm) {
      selectElm.value = item?.id ?? '';
    }
  }

  function handleChange() {
    selectedItem = collection.find((item) => item.id === selectElm.value);
    onSelectedItemChanged?.(selectedItem);
  }
</script>

<select bind:this={selectElm} class="form-control form-select" value={selectedItem?.id ?? ''} onchange={handleChange}>
  {#each collection as item (item.id)}
    <option value={item.id}>{item.name}</option>
  {/each}
</select>
