import { ref, computed } from 'vue';
// Инициализация состояний
export const useGraphInteractions = () => {
  const width = ref(window.innerWidth);
  const height = ref(window.innerHeight);
  // Смещение графа
  const offset = ref({ x: 0, y: 0 });
  // Масштаб
  const scale = ref(1); // Начальный масштаб (1 = 100%)
  // Центр SVG
  const centerX = computed(() => (width.value / 2) - offset.value.x); // Центр по X
  const centerY = computed(() => (height.value / 2) - offset.value.y); // Центр по Y
  // Корректировка смещения графа
  const adjustOffsetToCenter = () => {
    offset.value = {
      x: centerX.value - width.value / 2,
      y: centerY.value, // Изменяйте здесь для настройки начального положения графа
    };
  };
  // Логика масштабирования
  const handleWheel = (event) => {
    event.preventDefault(); // Предотвращаем прокрутку страницы
    const zoomFactor = 0.1; // Базовый шаг изменения масштаба
    const minScale = 0.05; // Минимальный масштаб
    const maxScale = 5000; // Максимальный масштаб
    // Формула для логарифмического масштабирования
    const newScale =
      event.deltaY < 0
        ? scale.value * (1 + zoomFactor) // Увеличение масштаба
        : scale.value / (1 + zoomFactor); // Уменьшение масштаба
    // Ограничение масштаба в пределах допустимых значений
    scale.value = Math.min(Math.max(newScale, minScale), maxScale);
  };
  // Логика перетаскивания
  const dragStart = ref({ x: 0, y: 0 }); // Начальные координаты при зажатии ЛКМ
  const isDraggingForMove = ref(false);
  const handleMouseDown = (event) => {
    if (event.button === 0) {
      // Проверяем, что нажата ЛКМ
      isDraggingForMove.value = true;
      dragStart.value = { x: event.clientX, y: event.clientY };
    }
  };
  const handleMouseMove = (event) => {
    if (isDraggingForMove.value) {
      const deltaX = (event.clientX - dragStart.value.x) / scale.value;
      const deltaY = (event.clientY - dragStart.value.y) / scale.value;
      // Обновляем смещение графа
      offset.value = {
        x: offset.value.x + deltaX,
        y: offset.value.y + deltaY,
      };
      // Обновляем начальную точку для следующего шага
      dragStart.value = { x: event.clientX, y: event.clientY };
    }
  };
  const handleMouseUp = () => {
    isDraggingForMove.value = false;
  };
  return {
    width,
    height,
    offset,
    scale,
    centerX,
    centerY,
    adjustOffsetToCenter,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};