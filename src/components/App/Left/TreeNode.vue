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
        📄 {{ node.name }}
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
import { ref, watch, computed } from "vue";
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
  () => focusStore.treeData,
  (newTreeData) => {
    // Если данные дерева изменились, обновляем состояние
    if (newTreeData) {
      console.log("Дерево обновлено:", newTreeData);
    }
  },
  { deep: true } // Глубокое наблюдение
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
</style>