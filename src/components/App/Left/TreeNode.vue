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
        <span v-if="fileIconType === 'emoji'" :class="fileIconClass"></span>
        <span v-else-if="fileIconType === 'css'" :class="fileIconClass"></span>
          {{ node.name }}
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
import { useIconStore } from "../../../../stores/iconStore";
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
  isFocused: {
    type: Boolean,
    default: false,
  }, // Добавляем prop isFocused
});
// Состояние раскрытия папки
const isExpanded = ref(false);
// Получение текущего выделенного узла из Pinia
const focusStore = useFocusStore();
const focusedNode = computed(() => focusStore.focusedNode);
// Вычисляемое свойство для проверки фокуса
const isNodeFocused = computed(() => props.node.id === focusedNode.value);
// Переключение состояния папки (развернуть/сворачивание)
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
// Реактивное свойство для хранения данных об иконке
const fileIconData = ref(null);
// Тип иконки (emoji или css)
const fileIconType = computed(() => {
  if (props.node.type === "file") {
    return fileIconData.value ? "css" : "emoji";
  }
  return null;
});
// Класс для стилизации иконки
const fileIconClass = computed(() => {
  if (props.node.type === "file") {
    const extension = props.node.name.split(".").pop().toLowerCase();
  if (extension=="jpg") {
    return `codicon codicon-device-camera`; // Если расширение найдено, возвращаем соответствующий класс
  } else if (extension=="mp3") {
    return `codicon codicon-unmute`; // Если расширение найдено, возвращаем соответствующий класс
  } else if (extension=="mp4") {
    return `codicon codicon-play-circle`; // Если расширение найдено, возвращаем соответствующий класс
  } else if (extension=="txt") {
    return `codicon codicon-list-flat`; // Если расширение найдено, возвращаем соответствующий класс
  } else {
  return props.node.type === "file" && fileIconType.value === "css"
    ? `icon icon_${fileIconData.value?.name}`
    : "";
  }
  }
});
// Функция для загрузки иконки
const loadFileIcon = async () => {
  if (props.node.type === "file") {
    const extension = props.node.name.split(".").pop().toLowerCase();
    const iconData = useIconStore().getIconData(extension); // Получаем данные об иконке    
    if (iconData) {
      const style = document.createElement("style");
    style.innerHTML = iconData.css;
    document.head.appendChild(style);
      fileIconData.value = iconData; // Сохраняем данные об иконке
    } else {
      fileIconData.value = null; // Если иконка не найдена
    }
  }
};
// Загружаем иконку при монтировании компонента
onMounted(async () => {
  // Загрузка данных темы
  await useIconStore().fetchThemeFile();
  await loadFileIcon();
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