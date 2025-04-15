<template>
  <div
    class="file-preview"
    :style="previewStyle"
    @mousedown="startDrag"
  >
    <!-- Загрузка файла -->
    <div v-if="loading" class="loading">Загрузка...</div>
    <!-- Ошибка загрузки -->
    <div v-else-if="error" class="error">{{ error }}</div>
    <!-- Прозрачный слой для перетаскивания/изменения размера -->
    <div
      v-show="isPdf && (isDragging || isResizing)"
      class="overlay"
      @mousedown="startDrag"
    ></div>
    <!-- Предварительный просмотр -->
    <div class="preview-content">
    <!-- Текстовые файлы -->
    <pre v-if="isTextFile">{{ textContent }}</pre>
    <!-- Изображения -->
    <img v-else-if="isImage" :src="imageViewerUrl" alt="Preview" />
    <!-- PDF -->
    <iframe
      v-else-if="isPdf"
      :src="pdfViewerUrl"
      frameborder="0"
      class="pdf-viewer"
      :type="`application/${fileType}`"
    ></iframe>
    <!-- Аудио -->
    <audio v-else-if="isAudio" controls>
      <source :src="audioViewerUrl" :type="`audio/${fileType}`" />
      Ваш браузер не поддерживает воспроизведение аудио.
    </audio>
    <!-- Видео -->
    <video v-else-if="isVideo" controls width="320" height="240">
      <source :src="videoViewerUrl" :type="`video/${fileType}`" />
      Ваш браузер не поддерживает воспроизведение видео.
    </video>
    <!-- Неподдерживаемый тип файла -->
    <div v-else class="unsupported">
      Файл не поддерживается для предварительного просмотра.
    </div>
  </div>
  <!-- Ручка для изменения размера -->
  <div class="resize-handle" @mousedown="startResize"></div>
  </div>
</template>
<script setup>
import { ref, computed, watch } from "vue";
import { useFocusStore } from "../../../../stores/focusStore";
import { useCacheStore } from "../../../../stores/cacheStore"; // Импортируем кэш-стор
// Состояния
const loading = ref(false);
const error = ref(null);
// Получаем доступ к кэшу
const cacheStore = useCacheStore();
// Позиция и размеры компонента
const position = ref(useFocusStore().filePreviewPosition);
const size = ref(useFocusStore().filePreviewSize);
// Переменные для перетаскивания
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
// Переменные для изменения размера
const isResizing = ref(false);
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 });
// Извлечение имени файла из хранилища
const currentFileNode = computed(() => useFocusStore().currentFileNode);
const isPdf = computed(() => fileType.value === "pdf");
const isAudio = computed(() => ["mp3", "wav"].includes(fileType.value));
const isVideo = computed(() => ["mp4", "webm"].includes(fileType.value));
// Получение типа файла
const fileType = computed(() => {
  if (!currentFileNode.value?.name) return null;
  const extension = currentFileNode.value.name.split(".").pop().toLowerCase();
  return extension;
});
// Определение типа контента
const isTextFile = computed(() =>
  ["txt", "json", "html", "css", "js"].includes(fileType.value)
);
const isImage = computed(() =>
  ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(fileType.value)
);
// Функция для получения URL файла
const fileUrl = (fileName) => {
  if (!fileName) return "";
  const extension = fileName.split(".").pop().toLowerCase();
  let subfolder = "other";
  if ([".jpg", ".jpeg", ".png", ".gif"].includes(`.${extension}`)) {
    subfolder = "jpg";
  } else if ([".mp3", ".wav", ".flac"].includes(`.${extension}`)) {
    subfolder = "mp3";
  } else if ([".mp4", ".avi", ".mkv"].includes(`.${extension}`)) {
    subfolder = "mp4";
  } else if ([".pdf"].includes(`.${extension}`)) {
    subfolder = "pdf";
  } else if ([".txt"].includes(`.${extension}`)) {
    subfolder = "txt";
  }
  return `/filesstorage/${subfolder}/${fileName}`;
};
// Загрузка текстового файла
const loadTextFile = async (fileName) => {
  try {
    const response = await fetch(fileUrl(fileName));
    if (!response.ok) throw new Error("Ошибка загрузки текстового файла");
    const content = await response.text();
    cacheStore.addToCache("textCache", fileName, content); // Сохраняем содержимое в кэш
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
// Содержимое текстового файла
const textContent = computed(() => {
  if (!currentFileNode.value?.name || !isTextFile.value) return "";
  const fileName = currentFileNode.value.name;
  // Проверяем, есть ли файл в кэше
  if (cacheStore.hasInCache("textCache", fileName)) {
    return cacheStore.getFromCache("textCache", fileName); // Возвращаем закэшированное содержимое
  }
  // Если файла нет в кэше, загружаем его
  loadTextFile(fileName);
  return "Загрузка текстового файла...";
});
// Стиль компонента
const previewStyle = computed(() => ({
  position: "absolute",
  top: `${position.value.y}px`,
  left: `${position.value.x}px`,
  width: `${size.value.width}px`,
  height: `${size.value.height}px`,
}));
// Начало перетаскивания
const startDrag = (event) => {
  // Проверяем, что событие не произошло на элементе .resize-handle
  if (event.target.classList.contains("resize-handle")) {
    return;
  }
  isDragging.value = true;
  // Блокируем выделение других узлов графа
  useFocusStore().setIsDragging(true);
  // Сохраняем начальные данные
  dragStart.value = {
    x: event.clientX - position.value.x,
    y: event.clientY - position.value.y,
  };
  // Добавляем обработчики событий для перетаскивания
  window.addEventListener("mousemove", handleDrag);
  window.addEventListener("mouseup", stopDrag);
};
// Обработка перетаскивания
const handleDrag = (event) => {
  if (isDragging.value) {
    position.value = {
      x: event.clientX - dragStart.value.x,
      y: event.clientY - dragStart.value.y,
    };
    // Сохраняем позицию в хранилище
    useFocusStore().setFilePreviewPosition(position.value);
  }
};
// Остановка перетаскивания
const stopDrag = () => {
  isDragging.value = false;
  // Разблокируем выделение узлов графа
  useFocusStore().setIsDragging(false);
  window.removeEventListener("mousemove", handleDrag);
  window.removeEventListener("mouseup", stopDrag);
};
// Начало изменения размера
const startResize = (event) => {
  isResizing.value = true;
  // Блокируем выделение других узлов графа
  useFocusStore().setIsDragging(true);
  // Сохраняем начальные данные
  resizeStart.value = {
    x: event.clientX,
    y: event.clientY,
    width: size.value.width,
    height: size.value.height,
  };
  // Добавляем обработчики событий для изменения размера
  window.addEventListener("mousemove", handleResize);
  window.addEventListener("mouseup", stopResize);
};
// Обработка изменения размера
const handleResize = (event) => {
  if (isResizing.value) {
    // Вычисляем разницу между текущей позицией мыши и начальной позицией
    const deltaX = event.clientX - resizeStart.value.x;
    const deltaY = event.clientY - resizeStart.value.y;
    // Обновляем размеры компонента
    size.value = {
      width: Math.max(200, resizeStart.value.width + deltaX), // Минимальная ширина 200px
      height: Math.max(200, resizeStart.value.height + deltaY), // Минимальная высота 200px
    };
    // Сохраняем размеры в хранилище
    useFocusStore().setFilePreviewSize(size.value);
  }
};
// Остановка изменения размера
const stopResize = () => {
  isResizing.value = false;
  // Разблокируем выделение узлов графа
  useFocusStore().setIsDragging(false);
  window.removeEventListener("mousemove", handleResize);
  window.removeEventListener("mouseup", stopResize);
};
// Загрузка медиафайла
const loadMedia = async (fileName) => {
  try {
    const response = await fetch(fileUrl(fileName));
    if (!response.ok) throw new Error("Ошибка загрузки медиафайла");
    // Генерируем уникальный URL для медиафайла
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    // Сохраняем URL в соответствующий кэш
    if (isPdf.value) {
      cacheStore.addToCache("pdfCache", fileName, url);
    } else if (isAudio.value) {
      cacheStore.addToCache("audioCache", fileName, url);
    } else if (isVideo.value) {
      cacheStore.addToCache("videoCache", fileName, url);
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
// URL для просмотра PDF
const pdfViewerUrl = computed(() => {
  if (!currentFileNode.value?.name || !isPdf.value) return "";
  const fileName = currentFileNode.value.name;
  return getViewerUrl("pdfCache", fileName, "PDF");
});
// URL для просмотра изображения
const imageViewerUrl = computed(() => {
  if (!currentFileNode.value?.name || !isImage.value) return "";
  const fileName = currentFileNode.value.name;
  return getViewerUrl("imageCache", fileName, "Изображение");
});
// URL для просмотра аудио
const audioViewerUrl = computed(() => {
  if (!currentFileNode.value?.name || !isAudio.value) return "";
  const fileName = currentFileNode.value.name;
  return getViewerUrl("audioCache", fileName, "Аудио");
});
// URL для просмотра видео
const videoViewerUrl = computed(() => {
  if (!currentFileNode.value?.name || !isVideo.value) return "";
  const fileName = currentFileNode.value.name;
  return getViewerUrl("videoCache", fileName, "Видео");
});
// Универсальная функция для получения URL
const getViewerUrl = (cacheName, fileName, fileType) => {
  // Проверяем, есть ли файл в кэше
  if (cacheStore.hasInCache(cacheName, fileName)) {
    return cacheStore.getFromCache(cacheName, fileName); // Возвращаем закэшированный URL
  }
  // Если файла нет в кэше, генерируем новый URL
  const url = `http://localhost:3000${fileUrl(fileName)}`;
  cacheStore.addToCache(cacheName, fileName, url); // Сохраняем URL в кэш
  return url;
};
// Отслеживаем изменения currentFileNode
watch(
  () => currentFileNode.value,
  (newNode) => {
    if (newNode?.name) {
      loading.value = true;
      error.value = null; // Очищаем ошибку
      // Проверяем, есть ли файл в соответствующем кэше
      if (
        (isPdf.value && cacheStore.hasInCache("pdfCache", newNode.name)) ||
        (isAudio.value && cacheStore.hasInCache("audioCache", newNode.name)) ||
        (isVideo.value && cacheStore.hasInCache("videoCache", newNode.name)) ||
        (isTextFile.value && cacheStore.hasInCache("textCache", newNode.name)) ||
        (isImage.value && cacheStore.hasInCache("imageCache", newNode.name))
      ) {
        loading.value = false;
        return;
      }
      // Если файла нет в кэше, загружаем его
      if (isTextFile.value) {
        loadTextFile(newNode.name);
      } else if (isImage.value) {
        // Для изображений не требуется дополнительная загрузка, так как используется URL
        loading.value = false;
      } else {
        loadMedia(newNode.name);
      }
    }
  },
  { immediate: true } // Запускаем обработчик сразу после монтирования
);
</script>
<style scoped>
.file-preview {
  border: 2px solid #ccc;
  padding: 10px;
  border-radius: 8px;
  background-color: #f9f9f9;
  max-width: 100%;
  max-height: 100%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: grab;
  position: relative; /* Для правильного позиционирования слоя */
}
.file-preview:active {
  cursor: grabbing;
}
.loading {
  text-align: center;
  font-style: italic;
  color: #666;
}
.error {
  color: red;
  text-align: center;
}
.preview-content {
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
.preview-content img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.preview-content * {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
}
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: auto;
  max-height: 300px;
}
.pdf-viewer {
  width: 100%;
  height: 100%;
}
.unsupported {
  text-align: center;
  color: #888;
}
.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  background-color: #ccc;
  cursor: nwse-resize;
}
/* Прозрачный слой */
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: transparent; /* Полностью прозрачный фон */
  z-index: 10; /* Чтобы быть поверх содержимого */
  cursor: grab;
}
</style>