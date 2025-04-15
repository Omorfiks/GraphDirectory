<template>
    <div
      v-if="showMenu"
      class="node-manager"
      :style="{ top: menuPosition.y + 'px', left: menuPosition.x + 'px' }"
    >
      <!-- Кнопка для удаления текущего узла -->
      <button @click="deleteNode" class="delete-node-button">
        Удалить узел
      </button>
    </div>
  </template>
  <script setup>
  import axios from "axios";
  import { useFocusStore } from "../../../../stores/focusStore";
  // Props
  const props = defineProps({
    currentNodeId: {
      type: Number,
      default: null,
    },
    showMenu: {
      type: Boolean,
      default: false,
    },
    menuPosition: {
      type: Object,
      default: () => ({ x: 0, y: 0 }),
    },
  });
  // Emits
  const emit = defineEmits(["nodeDeleted", "closeMenu", "refreshTree"]);
  // Удаление текущего узла
  const deleteNode = async () => {
    if (!props.currentNodeId) return;
  console.log(props);
    try {
      await axios.delete(`http://localhost:3000/api/delete-node/${props.currentNodeId}`);
      // useFocusStore().horizontalScroll = 0
      // Уведомляем родителя об удалении узла
      emit("nodeDeleted", props.currentNodeId);
      // Закрываем меню
      emit("closeMenu");
      // Уведомляем родителя о необходимости обновления дерева
      emit("refreshTree");
      // Обновляем выпадающий список
      useFocusStore().refreshDropdown();
    } catch (error) {
      console.error("Ошибка при удалении узла:", error);
    }
  };
  </script>
  <style scoped>
  .node-manager {
    position: absolute;
    background: #fff;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }
  .delete-node-button {
    padding: 5px 10px;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .delete-node-button:hover {
    background-color: #b02a37;
  }
  </style>