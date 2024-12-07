<script setup lang="ts">
import { ref } from 'vue';

const clickedTimes = ref(0);

function clickMe() {
  clickedTimes.value++;
}
</script>
<template>
  <button @click="clickMe()">I'm a button from a Vue Component (click me)</button>
  <div v-if="clickedTimes">You've clicked me {{ clickedTimes }} time(s)</div>
</template>
