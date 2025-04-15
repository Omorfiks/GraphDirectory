<script setup>
import Grid from "./components/Grid.vue";
import Auth from "./components/AuthScreen/Auth.vue";
import Tree from "./components/App/Left/Tree.vue";
import GraphTree from "./components/App/Center/GraphTree.vue";
import { useFocusStore } from "../stores/focusStore";
import { computed } from "vue";
import FilePreview from "./components/App/Right/FilePreview.vue"
// Вычисляемое свойство для ключа
const graphKey = computed(() => {
  return `${useFocusStore().horizontalScroll}-${useFocusStore().refreshGraph}`;
});
</script>
<template>
  <Grid/>
  <!-- <Auth/> -->
  <GraphTree :key="graphKey"/>
  <FilePreview v-if="useFocusStore().isFilePreviewVisible"
  :file="useFocusStore().currentFileNode"/>
  <Tree/>
</template>
<style>
html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  user-select: none; /* Отключаем выделение текста */
}
</style>
