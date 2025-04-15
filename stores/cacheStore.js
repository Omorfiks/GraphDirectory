import { defineStore } from "pinia";
export const useCacheStore = defineStore("cache", {
  state: () => ({
    pdfCache: new Map(), // Кэш для PDF
    audioCache: new Map(), // Кэш для аудио
    videoCache: new Map(), // Кэш для видео
    textCache: new Map(), // Кэш для текстовых файлов
    imageCache: new Map(), // Кэш для изображений
    themeCache: new Map(), // Кэш для темы иконок
    graphCache: new Map(), // Кэш для данных графа (узлы и рёбра)
  }),
  actions: {
    // Добавление элемента в кэш
    addToCache(cacheName, key, value) {
      if (!this[cacheName]) {
        console.warn(`Кэш "${cacheName}" не существует.`);
        return;
      }
      this[cacheName].set(key, value);
    },
    // Получение элемента из кэша
    getFromCache(cacheName, key) {
      if (!this[cacheName]) {
        console.warn(`Кэш "${cacheName}" не существует.`);
        return null;
      }
      return this[cacheName].get(key);
    },
    // Проверка наличия элемента в кэше
    hasInCache(cacheName, key) {
      if (!this[cacheName]) {
        console.warn(`Кэш "${cacheName}" не существует.`);
        return false;
      }
      return this[cacheName].has(key);
    },
    // Очистка кэша
    clearCache(cacheName) {
      if (!this[cacheName]) {
        console.warn(`Кэш "${cacheName}" не существует.`);
        return;
      }
      this[cacheName].clear();
    },
    // Сохранение данных графа в кэш
    saveGraphData(key, nodes, edges, treeData) {
      const graphData = {
        nodes,
        edges,
        treeData,
      };
      this.addToCache("graphCache", key, graphData);
    },
    // Получение данных графа из кэша
    loadGraphData(key) {
      return this.getFromCache("graphCache", key);
    },
    // Проверка наличия данных графа в кэше
    hasGraphData(key) {
      return this.hasInCache("graphCache", key);
    },
    // Очистка кэша данных графа
    clearGraphCache() {
      this.clearCache("graphCache");
    },
  },
});