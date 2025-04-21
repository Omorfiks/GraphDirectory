import { ref } from 'vue';
import { useIconStore } from '../../../../../stores/iconStore'; // Импортируем хранилище иконок
import { iconNameMapping } from "../../../../constants/Maps";
// Реактивное свойство для хранения данных об иконке
const fileIconData = ref(null);
/**
 * Функция для загрузки иконки.
 * @param {Array} visibleNodesResult - Массив видимых узлов (значение из .value реактивной переменной).
 */
const loadFileIcon = async (visibleNodesResult) => {
  if (!Array.isArray(visibleNodesResult)) {
    console.error("visibleNodesResult должен быть массивом, но получен:", visibleNodesResult);
    return;
  }
  visibleNodesResult.forEach((node) => {
    if (!node) return; // Пропускаем пустые узлы
    const extension = getFileExtension(node.name); // Получаем расширение файла
    if (!extension) {
      fileIconData.value = null; // Если расширение отсутствует, очищаем данные об иконке
      return;
    }
    const iconData = useIconStore().getIconData(extension); // Получаем данные об иконке
    if (iconData) {
      const style = document.createElement("style");
      style.innerHTML = iconData.css;
      document.head.appendChild(style);
      fileIconData.value = iconData; // Сохраняем данные об иконке
    } else {
      fileIconData.value = null; // Если иконка не найдена, очищаем данные
    }
  });
};
/**
 * Возвращает CSS-класс для стилизации иконки на основе расширения файла.
 * @param {string} ext - Расширение файла.
 * @returns {string} - CSS-класс для иконки.
 */
const fileIconClass = (ext) => {
  if (!ext) {
    return `icon icon_folder`; // Если расширение отсутствует, возвращаем класс для папки
  }
  // Проверяем, есть ли расширение в iconNameMapping
  const emoji = iconNameMapping[ext];
  if (emoji) {
    return `icon icon_${emoji}`; // Если расширение найдено, возвращаем соответствующий класс
  }
  // Специальные случаи для известных расширений
  switch (ext) {
    case "jpg":
      return `codicon codicon-device-camera`;
    case "mp3":
      return `codicon codicon-unmute`;
    case "mp4":
      return `codicon codicon-play-circle`;
    case "txt":
      return `codicon codicon-list-flat`;
    default:
      return `icon icon_${ext}`; // Значение по умолчанию
  }
};
/**
 * Возвращает расширение файла из имени.
 * @param {string} fileName - Имя файла.
 * @returns {string|null} - Расширение файла или null, если оно отсутствует.
 */
const getFileExtension = (fileName) => {
  if (!fileName || !fileName.includes(".")) return null;
  return fileName.split(".").pop().toLowerCase();
};
// Экспортируем функции и переменные
export const useIconHandler = () => {
  // Создаем реактивную переменную для хранения результата visibleNodes
  const visibleNodesResult = ref([]);
  return {
    fileIconData,
    loadFileIcon,
    fileIconClass,
    visibleNodesResult,
  };
};