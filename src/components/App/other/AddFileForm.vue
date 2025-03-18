<template>
  <div class="add-file-form">
    <h4>Добавить новый элемент</h4>
    <input v-model="newFileName" placeholder="Имя файла" />
    <select v-model="newFileType">
      <option value="file">Файл</option>
      <option value="folder">Папка</option>
    </select>
    <select v-model="newFileParentId" :key="dropdownKey">
      <option :value="null">Корень</option>
      <option v-for="node in test" :key="node.id" :value="node.id">
        {{ node.name }}
      </option>
    </select>
    <button @click="addNewFile">Добавить</button>
  </div>
</template>
  
<script setup>
import { ref, computed } from "vue";
import APIfunctions from "../services/APIfunctions";
import { useFocusStore } from "../../../../stores/focusStore";

// Вычисляемый ключ для выпадающего списка
const dropdownKey = computed(() => {
  return useFocusStore().dropdownRefreshKey;
});

// Локальные реактивные переменные для формы
const newFileName = APIfunctions.newFileName;
const newFileType = APIfunctions.newFileType;
const newFileParentId = APIfunctions.newFileParentId;

const store = useFocusStore()

const test = computed(() => {
  return store.findNodesByType(store.treeData, "folder");
});

// Метод для добавления нового файла
const addNewFile = async () => {
  if (!newFileName.value.trim()) {
    alert("Введите имя файла!");
    return;
  }
  try {
    // Вызываем метод update из APIfunctions
    await APIfunctions.update();
    await APIfunctions.fetchData(
      useFocusStore().graphData.nodes, 
      useFocusStore().graphData.edges, 
      useFocusStore().buildTree, 
      useFocusStore().recalculateNodePositions);
      useFocusStore().refreshGraph++
      // Обновляем выпадающий список
      useFocusStore().refreshDropdown();
    // Прокрутка узлов
    // const scrollNodes = (direction) => {
    //   const store = useFocusStore()
    //   const rootNodes = store.graphData.nodes.filter((node) => node.y === 0); // Все корневые узлы
    //   store.horizontalScroll++
    //   console.log(store.horizontalScroll);
      
    //   if (direction === -1 && store.horizontalScroll > 0) {
    //     store.horizontalScroll--;
    //   } else if (direction === 1 && store.horizontalScroll < rootNodes.length - 1) {
    //     store.horizontalScroll++;
    //   }
    // };
    // scrollNodes(1)
          
      // // Переключаемся на последний добавленный граф
      // setTimeout(() => {
      //     useFocusStore().scrollToLastGraph();
      //     useFocusStore().horizontalScroll++
      //     console.log("horizontalScroll внутри setTimeout - ", useFocusStore().horizontalScroll)     
      // }, 1000); // Небольшая задержка для завершения обновления данных
  } catch (error) {
    console.error("Ошибка при добавлении файла:", error);
  }
};
</script>
  
<style scoped>
  .add-file-form {
    margin-bottom: 1rem;
  }
  
  .add-file-form input,
  .add-file-form select,
  .add-file-form button {
    margin-right: 0.5rem;
    padding: 0.3rem;
  }
  
  .add-file-form button {
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .add-file-form button:hover {
    background-color: #218838;
  }
</style>