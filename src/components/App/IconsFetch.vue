<template>
  <!-- <div>
    <input
      v-model="iconName"
      placeholder="Введите имя иконки (например, R)"
      @input="fetchIconCSS"
    />
    <div v-if="iconCSS">
      <pre>{{ iconCSS }}</pre>
      <div style="display: flex; align-items: center; margin-top: 10px;">
        <span :class="`icon icon_${mappedIconName}`" style="font-size: 24px; margin-right: 10px;"></span>
        <span>Сама иконка</span>
      </div>
    </div>
    <div v-else-if="iconName && !iconCSS">
      Иконка не найдена.
    </div>
  </div> -->
</template>
<script setup>
import { ref } from "vue";
import { iconNameMapping } from "../../constants/Maps";
// Состояние для хранения данных темы
const themeData = ref(null);
// Состояние для текущего CSS-правила
const iconCSS = ref("");
const iconName = ref("");
const mappedIconName = ref(""); // Преобразованное имя иконки
// Функция для получения CSS-правила для конкретной иконки
const getIconCSS = (name) => {
  if (!themeData.value) return null;
  const iconDefinitions = themeData.value.iconDefinitions;
  const iconId = `_${name}`;

  if (iconDefinitions[iconId]) {    
    const { fontCharacter, fontColor } = iconDefinitions[iconId];
    return `.icon_${name}:before { content: "${fontCharacter}"; color: ${fontColor}; }`;
  }

  return null;
};
// Метод для обработки запроса на иконку
const fetchIconCSS = () => {
    // Получаем ввод пользователя и преобразуем его через маппинг
const input = iconName.value.trim();
const mappedName = iconNameMapping[input] || input; // Если маппинга нет, используем введенное имя
mappedIconName.value = mappedName;
console.log(mappedIconName.value);

  const css = getIconCSS(mappedIconName.value);
if (css) {
  // Добавляем CSS-правило в DOM
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);

  // Сохраняем CSS-правило для отображения в <pre>
  iconCSS.value = css;
} else {
  iconCSS.value = "";
}
};
</script>
<style>
  /* Стиль для иконок */
  .icon {
    font-family: "seti" !important;
    font-style: normal;
    font-weight: normal;
    font-size: 24px; /* Размер иконки */
    vertical-align: middle;
  }
</style>