<script setup lang="ts">
defineProps<{ model: any }>();
</script>

<template>
  <span style="font-weight: bold" v-html="model.assignee.name"></span>
</template>
