<template>
    <div class="add-file-form">
      <h4>Добавить новый элемент</h4>
      <input v-model="newFileName" placeholder="Имя файла" />
      <select v-model="newFileType">
        <option value="file">Файл</option>
        <option value="folder">Папка</option>
      </select>
      <select v-model="newFileParentId">
        <option :value="null">Корень</option>
        <option v-for="node in flatTreeData" :key="node.id" :value="node.id">
          {{ node.name }}
        </option>
      </select>
      <button @click="addNewFile">Добавить</button>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import axios from "axios";
  
  const props = defineProps({
    flatTreeData: {
      type: Array,
      required: true,
    },
    refreshTree: {
      type: Function,
      required: true,
    },
  });
  
  const newFileName = ref("");
  const newFileType = ref("file");
  const newFileParentId = ref(null);
  
  const addNewFile = async () => {
    if (!newFileName.value.trim()) {
      alert("Введите имя файла!");
      return;
    }
  
    try {
      // Отправляем POST-запрос на сервер для добавления нового узла
      const response = await axios.post("http://localhost:3000/add-node", {
        name: newFileName.value,
        type: newFileType.value,
        parentId: newFileParentId.value,
      });
  
      console.log(response.data.message);
  
      // Очищаем форму
      newFileName.value = "";
      newFileType.value = "file";
      newFileParentId.value = null;
  
      // Обновляем дерево через родительский компонент
      props.refreshTree();
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