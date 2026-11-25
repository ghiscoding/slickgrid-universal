# Svelte event handlers

Handle SlickGrid and wrapper lifecycle events with either the `events` prop or a direct callback prop. Event names use the same `on...` names as `SvelteGridEventHandlers`.

## Callback props

```svelte
<script lang="ts">
  function onCellClick(event: CustomEvent) {
    const { args } = event.detail;
    console.log('Clicked cell', args.row, args.cell);
  }

  function onGridCreated(event: CustomEvent) {
    console.log('Grid ready', event.detail);
  }
</script>

<SlickgridSvelte
  gridId="tasks"
  {columns}
  {options}
  {dataset}
  onClick={onCellClick}
  onGridCreated={onGridCreated}
/>
```

## The `events` prop

The `events` prop is useful when handlers are collected in an object or shared between components:

```svelte
<script lang="ts">
  const events = {
    onClick: (event: CustomEvent) => console.log(event.detail.args),
    onGridStateChanged: (event: CustomEvent) => console.log(event.detail),
  };
</script>

<SlickgridSvelte gridId="tasks" {columns} {options} {dataset} {events} />
```

You can combine direct callback props and the `events` object. When both provide the same event name, the `events` object callback takes precedence. Reassign the object to replace the registered handlers.

## Event payloads and cancellation

SlickGrid event callbacks receive a `CustomEvent` whose `detail` has the original event data and arguments:

```ts
const { eventData, args } = event.detail;
```

Lifecycle callbacks such as `onGridCreated` receive their value directly in `event.detail`. The `onSvelteGridCreated` callback prop is separate: it receives the full `SlickgridSvelteInstance` directly, not a `CustomEvent`.

For a cancellable SlickGrid event, call `event.preventDefault()` or return `false` from the handler. The wrapper registers callbacks before creating the grid and unsubscribes them when handlers change or the component is destroyed.

See [Available Events](available-events.md) for the full event list and payload types, and [Grid and DataView Events](grid-dataview-events.md) for the shared event flow.
