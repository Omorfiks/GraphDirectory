<template>
<li :class="{ focused: isFocused, editing: isEditing }">
    <div @click="handleClick" 
    style="cursor: pointer; display: flex; align-items: center;"
    @mouseenter="setFocusOnHover"
    @mouseleave="clearFocusOnHover"
    @dblclick="toggleEdit(node.id)">
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
          <span v-if="isEditing">
          (Editing)
          </span>
      </span>
      <!-- Поле для редактирования текста -->
      <!-- <input
        v-if="isEditing"
        v-model="editedName"
        @keydown.enter="saveName"
        @blur="saveName"
        style="border: 2px solid green; padding: 4px; margin-left: 8px;"
      /> -->
    </div>
    <Transition name="test" defer>
      <ul v-if="isExpanded && node.children">
        <TreeNode
          v-for="(child, index) in node.children"
          :key="index"
          :node="child"
          :auto-expand="child.id === focusedNode"
        />
      </ul>
  </Transition>
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
  focusStore.setFocusedNode(props.node.id-1);
  // Если это файл — активируем редактирование
  if (props.node.type === "file") {
    focusStore.setEditingNode(props.node.id);
  }
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
// Функции для фокуса при наведении
const setFocusOnHover = () => {
  focusStore.setFocusedNode(props.node.id-1);
  focusStore.setHoveredNode(props.node.id-1);
  if (props.node.type != "folder") {
    focusStore.showFilePreview(props.node); // Показываем предпросмотр
  } else {
    focusStore.hideFilePreview(); // Скрываем предпросмотр
  }
};
const clearFocusOnHover = () => {
  // Если узел не активен и не фокусирован — снимаем фокус
  if (isNodeFocused) {
    focusStore.clearFocus();
  }
};
// Проверка, является ли узел редактируемым
const isEditing = computed(() => props.node.id === focusStore.editingNode);
// Проверка фокуса на узле
const isFocused = computed(() => props.node.id === focusStore.focusedNode);
// Обработка двойного клика
const toggleEdit = (nodeId) => {
  focusStore.isNodeFocused = isEditing.value;
  isEditing.value = !isEditing.value;
  focusStore.isEditingNode = props.node.id;
  focusStore.setEditingNode(nodeId);
};
// Обработка нажатия Enter для сохранения
const handleKeyDown = (event) => {
  if (event.key === "Enter") {
    console.log(123); 
  }
};
// В компоненте TreeNode.vue
const isNodeFocused = computed(() => props.node.id === focusStore.focusedNode);
// Загружаем иконку при монтировании компонента
onMounted(async () => {
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
  transition: all 0.5s ease;
}
li.focused {
  outline: 2px solid white;
  border-radius: 4px;
  padding: 0.2rem;
  transition: all 0.5s ease;
}
li.editing {
  outline: 2px solid green;
  border-radius: 4px;
  padding: 0.2rem;
}
ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}
.file-icon {
  margin-right: 8px; /* Отступ между иконкой и текстом */
  font-size: 1.2em; /* Размер иконки */
}
.file-icon-svg {
  width: 32px; /* Размер SVG-иконки */
  height: 32px;
}
/*
  Анимации появления и исчезновения могут иметь
  различные продолжительности и функции плавности.
*/
.test-enter-active {
  transition: all 0.2s ease;
}

.test-leave-active {
  transition: all 0.2s ease;
}

.test-enter-from,
.test-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>