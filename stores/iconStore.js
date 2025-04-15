import { defineStore } from "pinia";
import { useCacheStore } from "./cacheStore";
import { iconNameMapping } from "../src/constants/Maps";
export const useIconStore = defineStore("icons", {
  state: () => ({
    themeData: null, // Данные темы иконок
  }),
  actions: {
    async fetchThemeFile() {
      const cacheStore = useCacheStore(); // Используем хранилище кэша
      // Проверяем, есть ли данные в кэше
      if (cacheStore.hasInCache("themeCache", "vs-seti-icon-theme")) {
        console.log("Данные темы загружены из кэша");
        this.themeData = cacheStore.getFromCache("themeCache", "vs-seti-icon-theme");
        return;
      }
      // Если данных нет в кэше, выполняем запрос
      try {
        const response = await fetch('../src/components/App/vs-seti-icon-theme.json');
        if (!response.ok) {
          throw new Error(`Ошибка загрузки файла: ${response.status}`);
        }
        this.themeData = await response.json();
        // Сохраняем данные в кэш
        cacheStore.addToCache("themeCache", "vs-seti-icon-theme", this.themeData);
        console.log("Данные темы загружены и сохранены в кэш");
      } catch (error) {
        console.error("Ошибка при загрузке темы:", error);
      }
    },
    getIconData(input) {
      const mappedName = iconNameMapping[input] || input;
      const iconDefinitions = this.themeData?.iconDefinitions;
      const iconId = `_${mappedName}`;
      if (iconDefinitions && iconDefinitions[iconId]) {
        const { fontCharacter, fontColor } = iconDefinitions[iconId];
        return {
          name: mappedName,
          css: `.icon_${mappedName}:before { content: "${fontCharacter}"; color: ${fontColor}; }`,
        };
      }
      return null;
    },
  },
});