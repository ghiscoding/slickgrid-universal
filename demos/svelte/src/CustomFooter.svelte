<script lang="ts">
  let clickedTimes = 0;
</script>

<button class="btn btn-outline-secondary btn-sm" onclick={() => clickedTimes++}>I'm a button from a Svelte Component (click me)</button>
{#if clickedTimes}<div>You've clicked me {clickedTimes} time(s)</div>{/if}
