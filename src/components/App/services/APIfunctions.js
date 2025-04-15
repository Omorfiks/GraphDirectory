import axios from "axios";
import { useFocusStore } from "../../../../stores/focusStore";
import { ref } from "vue";
// Экспортируем объект с методами
const defaulted = {
  /**
   * Загрузка данных при монтировании компонента
   */
  fetchData: async (nodes, edges, buildTree, recalculateNodePositions) => {
    try {
      const response = await axios.get("http://localhost:3000/api/tree-data");
      const treeData = response.data;
      // Загружаем данные в хранилище
      useFocusStore().loadTreeData(treeData);
      useFocusStore().isLoading = false; // Указываем, что данные загружены
      // Очищаем текущие узлы и рёбра
      nodes.value = [];
      edges.value = [];
      // Строим граф для всех корневых элементов
      treeData.forEach((rootNode) => {
        buildTree(rootNode, null, 0);  
      });
      // Пересчитываем позиции узлов
      recalculateNodePositions();
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
      useFocusStore().isLoading = false; // Указываем, что загрузка завершена (с ошибкой)
    }
  },
  /**
   * Имя нового файла или папки
   */
  newFileName: ref(""),
  /**
   * Файл/папка
   */
  newFileType: ref("file"),
  /**
   * Предок добавляемого элемента
   */
  newFileParentId: ref(null),
  /**
   * Отправляем POST-запрос на сервер для добавления нового узла
   */
  update: async () => {
    try {
      const response = await axios.post("http://localhost:3000/add-node", {
        name: defaulted.newFileName.value,
        type: defaulted.newFileType.value,
        parentId: defaulted.newFileParentId.value,
      });
    console.log(response.data.message);
    // Очищаем форму
    defaulted.newFileName.value = "";
    defaulted.newFileType.value = "file";
    defaulted.newFileParentId.value = null;
    } catch (error) {
      console.error("Ошибка при добавлении файла:", error);
    }
  },
};
export default defaulted;