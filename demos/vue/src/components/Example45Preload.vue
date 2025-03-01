<script setup lang="ts">
import { onUnmounted } from 'vue';

onUnmounted(() => {
  console.log('unmounting preload');
});
</script>
<template>
  <div class="container-fluid d-flex align-items-center" style="margin-top: 10px">
    <i class="mdi mdi-sync mdi-spin mdi-50px"></i>
    <h4>Loading...</h4>
  </div>
</template>
<style lang="scss"></style>
