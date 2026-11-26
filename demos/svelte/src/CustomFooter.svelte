<script lang="ts">
  let clickedTimes = $state(0);

  function clickMe() {
    clickedTimes++;
  }
</script>

<button class="btn btn-outline-secondary btn-sm" onclick={clickMe}>I'm a button from a Svelte Component (click me)</button>
{#if clickedTimes}<div>You've clicked me {clickedTimes} time(s)</div>{/if}
