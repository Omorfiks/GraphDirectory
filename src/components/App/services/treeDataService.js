// treeDataService.js

import axios from "axios";

// Функция для получения данных из сервера
export async function fetchTreeDataFromDB() {
  try {
    const response = await axios.get("http://localhost:3000/api/tree-data");
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении данных с сервера:", error);
    throw error;
  }
}