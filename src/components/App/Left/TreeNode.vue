<template>
  <li :class="{ focused: isNodeFocused }">
    <div @click="handleClick" style="cursor: pointer; display: flex; align-items: center;">
      <!-- Иконка минуса или плюса для сворачивания/разворачивания -->
      <span v-if="node.type === 'folder'" @click.stop="toggleExpand">
        {{ isExpanded ? "[-]" : "[+]" }}
      </span>
      <!-- Основной контент узла -->
      <span v-if="node.type === 'folder'">
        {{ isExpanded ? "📂" : "📁" }} {{ node.name }}
      </span>
      <span v-else>
        <!-- Динамическая иконка для файла -->
        <span v-if="fileIconType === 'emoji'">
          <span :class="fileIconClass">{{ fileIcon }}</span> {{ node.name }}
        </span>
        <span v-else-if="fileIconType === 'svg'" style="display: flex; align-items: center;">
          <img
            v-if="fileIconUrl"
            :src="fileIconUrl"
            alt="File Icon"
            class="file-icon-svg"
          />
          {{ node.name }}
        </span>
      </span>
    </div>
    <ul v-if="isExpanded && node.children">
      <TreeNode
        v-for="(child, index) in node.children"
        :key="index"
        :node="child"
        :auto-expand="child.id === focusedNode"
      />
    </ul>
  </li>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useFocusStore } from "../../../../stores/focusStore";

const props = defineProps({
  node: {
    type: Object,
    required: true,
    validator: (node) => {
      return (
        typeof node.id === "number" &&
        typeof node.name === "string" &&
        ["folder", "file"].includes(node.type) &&
        (node.children === undefined || Array.isArray(node.children))
      );
    },
  },
  autoExpand: {
    type: Boolean,
    default: false,
  },
});

// Состояние раскрытия папки
const isExpanded = ref(false);

// Получение текущего выделенного узла из Pinia
const focusStore = useFocusStore();
const focusedNode = computed(() => focusStore.focusedNode);

// Вычисляемое свойство для проверки фокуса
const isNodeFocused = computed(() => props.node.id === focusedNode.value);

// Переключение состояния папки (развернуть/свернуть)
const toggleExpand = () => {
  if (props.node.type === "folder") {
    isExpanded.value = !isExpanded.value;
  }
};

// Обработчик клика по узлу
const handleClick = () => {
  if (props.node.type === "folder") {
    toggleExpand();
  }
  // Устанавливаем фокус на текущий узел
  focusStore.setFocusedNode(props.node.id);
};

// Функция для проверки существования файла
const fileExists = async (url) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok; // Возвращает true, если файл существует
  } catch (error) {
    return false; // Возвращает false, если произошла ошибка
  }
};

// URL иконки файла
const fileIconUrl = ref(null);

// Цвета из ui-variables.less
const colorsFromLess = ref({});

// Функция для загрузки и парсинга ui-variables.less
const loadColorsFromLess = async () => {
  const lessUrl =
    "https://raw.githubusercontent.com/jesseweed/seti-ui/master/styles/ui-variables.less";
  try {
    const response = await fetch(lessUrl);
    const lessContent = await response.text();

    // Парсим базовые цвета
    const baseColors = {};
    const baseColorRegex = /@(\w+):\s*#([0-9a-fA-F]{6});/g;
    
    let match;
    while ((match = baseColorRegex.exec(lessContent)) !== null) {
      const colorName = match[1];
      const colorValue = `#${match[2]}`;
      baseColors[colorName] = colorValue;
    }

    // Парсим правила .icon-set
    const iconSetRegex = /\.icon-set\("(\.\w+)",\s*"[\w-]+",\s*@(\w+)\);/g;
    const extensionColors = {};
    while ((match = iconSetRegex.exec(lessContent)) !== null) {
      const extension = match[1].substring(1); // Убираем точку (например, ".js" → "js")
      const colorName = match[2];
      const colorValue = baseColors[colorName] || "#000000"; // Черный (по умолчанию)
      extensionColors[extension] = colorValue;
    }

    colorsFromLess.value = extensionColors;
  } catch (error) {
    console.error("Ошибка загрузки ui-variables.less:", error);
  }
};

// Функция для получения цвета из ui-variables.less
const getColorForExtension = (extension) => {
  return colorsFromLess.value[extension] || "#000000"; // Черный (по умолчанию)
};

// Функция для получения URL иконки
const getIconUrl = (extension) => {
  const baseUrl = "https://raw.githubusercontent.com/jesseweed/seti-ui/1cac4f30f93cc898103c62dde41823a09b0d7b74/icons/";
  let iconFileName = `${extension.toLowerCase()}.svg`;
  switch (extension.toLowerCase()) {
    case 'js':
    iconFileName = `javascript.svg`;    
      break;
    default:
    iconFileName = `${extension.toLowerCase()}.svg`;
      break;
  }
  return `${baseUrl}${iconFileName}`;
};

// Загрузка иконки
const loadFileIcon = async () => {
  if (props.node.type === "file") {
    const extension = props.node.name.split(".").pop().toLowerCase();
    const iconUrl = getIconUrl(extension);

    if (await fileExists(iconUrl)) {
      try {
        // Загружаем SVG как текст
        const response = await fetch(iconUrl);
        const svgText = await response.text();

        // Получаем цвет из ui-variables.less
        const color = getColorForExtension(extension);

        // Применяем цвет к SVG
        const coloredSvg = svgText.replace(/fill="[^"]*"/g, `fill="${color}"`);
        fileIconUrl.value = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(coloredSvg)}`;
      } catch (error) {
        console.error("Ошибка загрузки SVG:", error);
        fileIconUrl.value = null;
      }
    } else {
      fileIconUrl.value = null; // Сбрасываем URL, если файл не найден
    }
  }
};

// Тип иконки (emoji или svg)
const fileIconType = computed(() => {
  if (props.node.type === "file") {
    return fileIconUrl.value ? "svg" : "emoji"; // Если есть URL, тип — SVG
  }
  return null;
});

// Класс для стилизации иконки
const fileIconClass = computed(() => {
  return props.node.type === "file" && fileIconType.value === "emoji" ? "file-icon" : "";
});

// Загружаем иконку и цвета при монтировании компонента
onMounted(async () => {
  await loadColorsFromLess(); // Загружаем цвета из ui-variables.less
  loadFileIcon(); // Загружаем иконку
});
// Автоматическое разворачивание при автофокусе
watch(
  () => props.autoExpand,
  (newVal) => {
    if (newVal) {
      isExpanded.value = true;
    }
  }
);

// Дополнительная проверка для корневого узла
watch(
  () => focusedNode.value,
  (newFocusedNode) => {
    if (props.node.id === newFocusedNode && props.node.type === "folder") {
      isExpanded.value = true;
    }
  }
);

// Добавляем слежение за изменениями в данных узла
watch(
  () => props.node.children,
  (newChildren) => {
    if (newChildren && newChildren.length === 0) {
      isExpanded.value = false; // Сворачиваем узел, если детей больше нет
    }
  },
  { deep: true } // Глубокое наблюдение за массивом children
);

</script>

<style scoped>
li {
  margin-left: 1rem;
  position: relative;
}

ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.focused {
  outline: 2px solid white; /* Белая обводка */
  border-radius: 4px;
  padding: 0.2rem;
}

.file-icon {
  margin-right: 8px; /* Отступ между иконкой и текстом */
  font-size: 1.2em; /* Размер иконки */
}

.file-icon-svg {
  width: 32px; /* Размер SVG-иконки */
  height: 32px;
}
</style>