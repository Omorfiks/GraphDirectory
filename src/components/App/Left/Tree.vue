<template>
  <div
    class="file-tree"
    :style="{ top: position.top + 'px', left: position.left + 'px' }"
    @mousedown="startDrag"
  >
    <!-- Уведомление -->
    <div v-if="notification" class="notification">
      {{ notification }}
    </div>
    <AddFileForm v-if="!useFocusStore().isLoading && treeData"/>
    <h3>Файловая система</h3>
    <button @click="updateJson">Обновить JSON</button>
    <ul v-if="!useFocusStore().isLoading && treeData">
      <TreeNode
        v-for="(node, index) in treeData"
        :key="index"
        :node="node"
        :is-focused="useFocusStore().focusedNode === node.id"
        :auto-expand="useFocusStore().focusedNode === node.id"
      />
    </ul>
    <p v-else>Загрузка данных...</p>
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import TreeNode from "./TreeNode.vue";
import axios from "axios";
import AddFileForm from "../other/AddFileForm.vue"; // Импортируем новый компонент
import { useFocusStore } from "../../../../stores/focusStore";
// Данные дерева из хранилища
const treeData = computed(() => useFocusStore().treeData);
// Состояние для уведомления
const notification = ref("");
// Состояние для позиции компонента
const position = ref({ top: 10, left: 10 });
// Флаг для отслеживания состояния перетаскивания
const isDragging = ref(false);
// Позиция курсора при начале перетаскивания
const dragStart = ref({ x: 0, y: 0 });
// // Функция для загрузки данных с сервера
// const fetchData = async () => {
//   try {
//     const response = await axios.get("http://localhost:3000/api/tree-data");
//     treeData.value = response.data; // Обновляем данные дерева
//   } catch (error) {
//     console.error("Ошибка при загрузке данных:", error);
//   }
// };
// // Функция для обновления файла JSON
// const updateJson = async () => {
//   try {
//     const response = await axios.get("http://localhost:3000/update-tree");
//     console.log(response.data.message);
//     // Показываем уведомление
//     notification.value = "Данные успешно обновлены!";
//     setTimeout(() => {
//       notification.value = ""; // Скрываем уведомление через 2 секунды
//     }, 2000);
//   } catch (error) {
//     console.error("Ошибка при обновлении JSON:", error);
//     // Показываем уведомление об ошибке
//     notification.value = "Ошибка при обновлении данных!";
//     setTimeout(() => {
//       notification.value = ""; // Скрываем уведомление через 2 секунды
//     }, 2000);
//   }
// };
// Начало перетаскивания
const startDrag = (event) => {
  isDragging.value = true;
  dragStart.value = {
    x: event.clientX - position.value.left,
    y: event.clientY - position.value.top,
  };
  // Добавляем слушатели событий на документ
  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", stopDrag);
};
// Обработка перетаскивания
const handleDrag = (event) => {
  if (isDragging.value) {
    position.value = {
      top: event.clientY - dragStart.value.y,
      left: event.clientX - dragStart.value.x,
    };
  }
};
// Остановка перетаскивания
const stopDrag = () => {
  isDragging.value = false;
  // Удаляем слушатели событий с документа
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
};
</script>
<style scoped>
.file-tree {
  position: absolute; /* Изменяем на absolute для свободного перемещения */
  top: 10px;
  left: 10px;
  width: 250px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  cursor: grab; /* Курсор для захвата */
}
.file-tree:active {
  cursor: grabbing; /* Курсор при перетаскивании */
}
h3 {
  margin-top: 0;
  font-size: 1rem;
  color: #ccc;
}
ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}
button {
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: #0056b3;
}
p {
  color: #ccc;
}
/* Стили для уведомления */
.notification {
  position: absolute;
  top: -40px; /* Начальная позиция за пределами экрана */
  left: 200%;
  transform: translateX(-50%);
  background-color: #4caf50; /* Зеленый цвет для успеха */
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  animation: slide-down 1s ease-out forwards, fade-out 1s 3s ease-in-out forwards;
}
/* Анимация появления */
@keyframes slide-down {
  from {
    top: -100px;
  }
  to {
    top: -10px;
  }
}
/* Анимация исчезновения */
@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>