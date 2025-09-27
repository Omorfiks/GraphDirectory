<template>
  <div
    class="file-preview"
    :style="previewStyle"
    @mousedown.stop="handleMouseDown"
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
      <pre v-if="isTextFile" class="textContent" :style="previewStyleText">{{ textContent }}</pre>
      <!-- Изображения -->
      <img v-else-if="isImage" :src="viewerUrls.image" alt="Preview" />
      <!-- PDF -->
      <iframe
        v-else-if="isPdf"
        :src="viewerUrls.pdf"
        frameborder="0"
        class="pdf-viewer"
        :type="`application/${fileType}`"
      ></iframe>
      <!-- Аудио -->
      <audio v-else-if="viewerUrls.audio" controls>
        <source :src="viewerUrls.audio" :type="`audio/${fileType}`" />
        Ваш браузер не поддерживает воспроизведение аудио.
      </audio>
      <!-- Видео -->
      <video v-else-if="viewerUrls.video" controls width="320" height="240">
        <source :src="viewerUrls.video" :type="`video/${fileType}`" />
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
import { ref, computed, watch, onMounted } from "vue";
import { useFocusStore } from "../../../../stores/focusStore";
import { useCacheStore } from "../../../../stores/cacheStore"; // Импортируем кэш-стор
import APIfunctions from "../services/APIfunctions";
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
const isTextFile = computed(() => ["txt", "json", "html", "css", "js", "vue"].includes(fileType.value));
const isImage = computed(() => ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(fileType.value));
const isPdf = computed(() => ["pdf"].includes(fileType.value));
const isAudio = computed(() => ["mp3", "wav", "flac"].includes(fileType.value));
const isVideo = computed(() => ["mp4", "webm", "avi"].includes(fileType.value));
const fileName = computed(() => currentFileNode.value?.name || "");
const fileType = computed(() => {
  if (!fileName.value) return "";
  const ext = fileName.value.split(".").pop().toLowerCase();
  return ext;
});
const viewerUrls = ref({
  pdf: '',
  image: '',
  audio: '',
  video: '',
});
// Универсальная функция для получения URL
const getViewerUrl = async (cacheName, fileName) => {
  try {
    // Проверяем кэш
    if (cacheStore.hasInCache(cacheName, fileName)) {
      const cachedUrl = cacheStore.getFromCache(cacheName, fileName);
      if (cachedUrl) {
        return cachedUrl;
      }
    }
    // Если нет в кэше — загружаем
    loading.value = true;
    const url = await loadMedia(fileName); // ← должна вернуть реальный URL
    cacheStore.addToCache(cacheName, fileName, url);
    return url;
  } catch (error) {
    console.error('Ошибка при получении URL:', error);
    return '';
  } finally {
    loading.value = false;
  }
};
// Загрузка текстового файла
const loadTextFile = async (fileName) => {
  try {
    const content = ref('');
    const response = await fetch(await APIfunctions.fileUrl(fileName));
    if (!response.ok) throw new Error("Ошибка загрузки текстового файла");
    if (response.url == "http://localhost:5173/") {
      content.value = "Ошибка при получении пути";
    } else {
      content.value = await response.text();
    }
    cacheStore.addToCache("textCache", fileName, content.value); // Сохраняем содержимое в кэш
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
// Загрузка медиафайла
const loadMedia = async (fileName) => {
  if (!fileName) return;
  loading.value = true;
  error.value = null;
  try {
    const url = await APIfunctions.fileUrl(fileName);
    if (!url) throw new Error("Файл не найден");
    const response = await fetch(url);
    if (!response.ok) throw new Error("Ошибка загрузки файла");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    if (isPdf.value) {
      cacheStore.addToCache("pdfCache", fileName, objectUrl);
    } else if (isAudio.value) {
      cacheStore.addToCache("audioCache", fileName, objectUrl);
    } else if (isVideo.value) {
      cacheStore.addToCache("videoCache", fileName, objectUrl);
    } else if (isImage.value) {
      cacheStore.addToCache("imageCache", fileName, objectUrl);
    }
    return url;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
// Содержимое текстового файла
const textContent = computed(() => {
  if (!fileName.value || !isTextFile.value) return "";
  const cachedContent = cacheStore.getFromCache("textCache", fileName.value);
  if (cachedContent) return cachedContent;
  loadTextFile(fileName.value);
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
// Стиль компонента
const previewStyleText = computed(() => ({
  position: "absolute",
  width: `${size.value.width}px`,
  height: `${size.value.height}px`,
}));
// Начало перетаскивания
const startDrag = (event) => {
  if (event.target.classList.contains("resize-handle")) return;
  isDragging.value = true;
  useFocusStore().setIsDragging(true);
  dragStart.value = {
    x: event.clientX - position.value.x,
    y: event.clientY - position.value.y,
  };
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
    useFocusStore().setFilePreviewPosition(position.value);
  }
};
// Остановка перетаскивания
const stopDrag = () => {
  isDragging.value = false;
  useFocusStore().setIsDragging(false);
  window.removeEventListener("mousemove", handleDrag);
  window.removeEventListener("mouseup", stopDrag);
};
// Начало изменения размера
const startResize = (event) => {
  isResizing.value = true;
  useFocusStore().setIsDragging(true);
  resizeStart.value = {
    x: event.clientX,
    y: event.clientY,
    width: size.value.width,
    height: size.value.height,
  };
  window.addEventListener("mousemove", handleResize);
  window.addEventListener("mouseup", stopResize);
};
// Обработка изменения размера
const handleResize = (event) => {
  if (isResizing.value) {
    const deltaX = event.clientX - resizeStart.value.x;
    const deltaY = event.clientY - resizeStart.value.y;
    size.value = {
      width: Math.max(200, resizeStart.value.width + deltaX),
      height: Math.max(200, resizeStart.value.height + deltaY),
    };
    useFocusStore().setFilePreviewSize(size.value);
  }
};
// Остановка изменения размера
const stopResize = () => {
  isResizing.value = false;
  useFocusStore().setIsDragging(false);
  window.removeEventListener("mousemove", handleResize);
  window.removeEventListener("mouseup", stopResize);
};
const handleMouseDown = (event) => {
  // Проверяем, нажата ли левая кнопка мыши
  if (event.button === 0) {
    startDrag(event);
  }
};
watch(
  () => fileName.value,
  async (newFileName) => {
    if (!newFileName) return;
    // Определяем тип файла
    const isPdf = newFileName.endsWith('.pdf');
    const isImage = /\.(png|jpe?g|gif|svg)$/i.test(newFileName);
    const isAudio = /\.(mp3|wav|ogg)$/i.test(newFileName);
    const isVideo = /\.(mp4|webm|ogg)$/i.test(newFileName);
    // Очищаем старые URL
    viewerUrls.value = {
      pdf: '',
      image: '',
      audio: '',
      video: '',
    };
    // Загружаем нужные по типу
    if (isPdf) {
      viewerUrls.value.pdf = await getViewerUrl('pdfCache', newFileName);
    }
    if (isImage) {
      viewerUrls.value.image = await getViewerUrl('imageCache', newFileName);
    }
    if (isAudio) {
      viewerUrls.value.audio = await getViewerUrl('audioCache', newFileName);
    }
    if (isVideo) {
      viewerUrls.value.video = await getViewerUrl('videoCache', newFileName);
    }
  },
  { immediate: true }
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
  transition: all 0.1s ease-out;
}
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  color: #333;
}
.error {
  color: red;
  font-weight: bold;
}
.pdf-viewer {
  width: 100%;
  height: 100%;
  border: none;
}
.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background: #ccc;
  cursor: se-resize;
  z-index: 2;
}
.textContent{
  overflow-y: auto;
  max-height: 100%;
}
/* Только для Firefox */
.textContent {
  scrollbar-width: thin;
  scrollbar-color: #888 #f1f1f1;
}
.preview-content {
  width: 100%;         /* занимает всю ширину родителя */
  height: 100%;        /* занимает всю высоту родителя */
  overflow: hidden;    /* обрезаем всё, что выходит за рамки */
  display: flex;
  align-items: center; /* вертикальное центрирование */
  justify-content: center; /* горизонтальное центрирование */
  position: relative;
  background-color: #f0f0f0;
}
.preview-content img,
.preview-content video,
.preview-content audio {
  max-width: 100%;     /* не больше ширины контейнера */
  max-height: 100%;    /* не больше высоты контейнера */
  width: auto;
  height: auto;
  object-fit: contain; /* сохраняет пропорции и помещается полностью */
}

</style>