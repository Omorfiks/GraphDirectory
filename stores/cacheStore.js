import { defineStore } from "pinia";

export const useCacheStore = defineStore("cache", {
  state: () => ({
    pdfCache: new Map(), // Кэш для PDF
    audioCache: new Map(), // Кэш для аудио
    videoCache: new Map(), // Кэш для видео
    textCache: new Map(), // Кэш для текстовых файлов
    imageCache: new Map(), // Кэш для изображений
  }),
  actions: {
    // Добавление элемента в кэш
    addToCache(cacheName, key, value) {
      this[cacheName].set(key, value);
    },

    // Получение элемента из кэша
    getFromCache(cacheName, key) {
      return this[cacheName].get(key);
    },

    // Проверка наличия элемента в кэше
    hasInCache(cacheName, key) {
      return this[cacheName].has(key);
    },

    // Очистка кэша
    clearCache(cacheName) {
      this[cacheName].clear();
    },
  },
});