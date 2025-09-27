<script setup>
import Grid from "./components/Grid.vue";
import Loader from "./components/Loader.vue";
import Auth from "./components/AuthScreen/Auth.vue";
import Tree from "./components/App/Left/Tree.vue";
import GraphTree from "./components/App/Center/GraphTree/GraphTree.vue";
import { useFocusStore } from "../stores/focusStore";
import { computed, ref } from "vue";
import FilePreview from "./components/App/Right/FilePreview.vue"
const isLoading = ref(true);
// Обработчик завершения загрузки
const handleLoadingComplete = () => {
  isLoading.value = false; // Скрываем загрузочный экран
};
// Вычисляемое свойство для ключа
const graphKey = computed(() => {
  return `${useFocusStore().horizontalScroll}-${useFocusStore().refreshGraph}`;
});
</script>
<template>
  <Grid/>
  <!-- <Auth/> -->
  <!-- Загрузочный экран -->
  <Loader v-if="isLoading" />
  <GraphTree :key="graphKey" @loading-complete="handleLoadingComplete"/>
  <Transition>
    <FilePreview v-if="useFocusStore().isFilePreviewVisible"/>
  </Transition>
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
/* мы объясним, что делают эти классы дальше! */
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
