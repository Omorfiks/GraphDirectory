<template>
  <div class="graph-container">
    <ArrowLeft :visibleNodes="useFocusStore().treeData"/>
    <!-- SVG-граф -->
    <svg :width="width">
      <!-- Рёбра -->
      <line
        v-for="(edge, index) in visibleEdges"
        :key="'edge-' + index"
        :x1="nodes[edge.source].x"
        :y1="nodes[edge.source].y"
        :x2="nodes[edge.target].x"
        :y2="nodes[edge.target].y"
        stroke="#ccc"
        stroke-width="2"
      />
      <!-- Вершины -->
      <g
        v-for="(node, index) in visibleNodes"
        :key="'node-' + index"
        :transform="`translate(${node.x}, ${node.y})`"
        @mouseenter="highlightNode(node.id)"
        @mouseleave="clearFocus"
        @contextmenu.prevent="showContextMenu($event, node.name)"
      >
        <!-- Контур (обводка) -->
        <circle
          v-if="focusedNode === node.id+1"
          r="25"
          fill="none"
          stroke="black"
          stroke-width="4"
        />
        <!-- Основной круг -->
        <circle r="20" :fill="'#007bff'" />
        <!-- Текст -->
        <text text-anchor="middle" dy=".3em" fill="white">{{ node.name }}</text>
      </g>
    </svg>
    <ArrowRight :visibleNodes="useFocusStore().treeData"/>
  </div>
      <!-- Компонент управления узлами -->
      <NodeManager
      v-if="isMenuVisible"
      :currentNodeId="contextMenuNodeId"
      :showMenu="isMenuVisible"
      :menuPosition="menuPosition"
      @closeMenu="closeContextMenu"
    />
</template>
<script setup>
import { ref, onMounted, computed } from "vue";
import { useFocusStore } from "../../../../stores/focusStore";
import NodeManager from "./NodeManager.vue"; // Импортируем компонент
import APIfunctions from "../services/APIfunctions";
import ArrowLeft from "../Center/ArrowLeft.vue";
import ArrowRight from "../Center/ArrowsRight.vue";
import { useCacheStore } from "../../../../stores/cacheStore";
// // Состояние для контекстного меню
const isMenuVisible = ref(false);
const contextMenuNodeId = ref(null);
const menuPosition = ref({ x: 0, y: 0 });
// // Показать контекстное меню
const showContextMenu = (event, nodeName) => {
  // Находим узел в treeData по его имени
  const nodeInTree = focusStore.findTreeNodeByName(nodeName);
  if (!nodeInTree) {
    console.error("Узел с именем", nodeName, "не найден в treeData.");
    return;
  }  
  // Устанавливаем ID узла из treeData
  contextMenuNodeId.value = nodeInTree.id;
  // Логируем ID узла
  console.log("ID узла из treeData:", nodeInTree.id);
  // Устанавливаем позицию меню
  menuPosition.value = { x: event.pageX, y: event.pageY };
  isMenuVisible.value = true;
};
// Обновление дерева при получении события refreshTree
const refreshTree = () => {
  APIfunctions.fetchData(nodes, edges, buildTree, recalculateNodePositions); // Перезагружаем данные
};
// Закрыть контекстное меню
const closeContextMenu = () => {
  isMenuVisible.value = false;
  const deletedNodeId = contextMenuNodeId.value; // Сохраняем ID удаляемого узла
  contextMenuNodeId.value = null;
  // Проверяем, является ли удаляемый узел текущим корневым видимым узлом
  const rootNodes = nodes.value.filter((node) => node.y === 0); // Все корневые узлы
  const currentVisibleRootNode = rootNodes[focusStore.horizontalScroll]; // Текущий видимый корневой узел
  if (currentVisibleRootNode && currentVisibleRootNode.id === deletedNodeId) {
    scrollNodes(-1); // Прокручиваем назад, если удалили текущий корневой узел
  }
  refreshTree(); // Обновляем дерево
};
const focusStore = useFocusStore();
const focusedNode = computed(() => focusStore.focusedNode);
// // Размеры SVG
const width = ref(window.innerWidth);
// // Состояния для узлов и рёбер
const nodes = ref([]);
const edges = ref([]);
// Функция для построения дерева
const buildTree = (data, parentId = null, level = 0) => {
  const nodeId = nodes.value.length;
  // Расчет координат
  const parent = parentId !== null ? nodes.value[parentId] : null;
  const centerX = parent ? parent.x : width.value / 2;
  const verticalSpacing = 100; // Расстояние между уровнями
  const horizontalSpacing = 200; // Расстояние между узлами одного уровня
  // Если есть родительский узел, рассчитываем координаты относительно него
  const siblings = data.children || [];
  const totalSiblings = siblings.length;
  let x = centerX;
  if (totalSiblings > 1) {
    const isOdd = totalSiblings % 2 !== 0;
    const middleIndex = Math.floor(totalSiblings / 2);
    x =
      centerX +
      (siblings.indexOf(data) - middleIndex) * horizontalSpacing +
      (isOdd && siblings.indexOf(data) === middleIndex ? 0 : horizontalSpacing / 2);
  }
  const y = level * verticalSpacing;
  // Добавляем узел
  nodes.value.push({ id: nodeId, name: data.name, x, y });
  focusStore.setNodes(nodes.value)
  // Добавляем ребро, если есть родительский узел
  if (parentId !== null) {
    edges.value.push({ source: parentId, target: nodeId });
  }
  // Рекурсивно добавляем дочерние узлы
  if (data.children) {
    data.children.forEach((child) => {
      // APIfunctions.buildTree(child, nodeId, level + 1)
      buildTree(child, nodeId, level + 1);
    });
  }
};
const isSupportedFileType = (fileName) => {
  const supportedExtensions = [".jpg", ".mp3", ".mp4", ".pdf", ".txt"];
  return supportedExtensions.some((ext) => fileName.endsWith(ext));
};
// Вычисляемое свойство для проверки флага isDragging
const isDragging = computed(() => focusStore.isDragging);
// // Выделение узла при наведении
const highlightNode = (nodeId) => {
  // Проверяем значение флага isDragging
  if (isDragging.value) {
    console.log("Выделение узлов заблокировано: режим перетаскивания активен.");
    return;
  }
  const node = nodes.value.find((n) => n.id === nodeId);
  if (node && isSupportedFileType(node.name)) {
    focusStore.showFilePreview(node); // Показываем предпросмотр
  } else {
    focusStore.hideFilePreview(); // Скрываем предпросмотр
  }
  focusStore.setFocusedNode(nodeId); // Устанавливаем фокус на узле
};
// Снятие выделения узла
const clearFocus = () => {
  focusStore.clearFocus();
};
// Вычисляемые свойства для видимых узлов и рёбер
const visibleNodes = computed(() => {
  const rootNodes = nodes.value.filter((node) => node.y === 0); // Все корневые узлы
  const visibleRootNode = rootNodes[focusStore.horizontalScroll]; // Только один видимый корневой узел
  if (!visibleRootNode) return [];
  // Добавляем дочерние узлы для видимого корневого узла
  const allVisibleNodes = getSubtreeNodes(visibleRootNode.id);
  return allVisibleNodes;
});
// Рекурсивная функция для получения всех дочерних узлов
const getSubtreeNodes = (nodeId) => {
  const result = [nodes.value[nodeId]];
  const children = edges.value
    .filter((edge) => edge.source === nodeId)
    .map((edge) => nodes.value[edge.target]);
  children.forEach((child) => {
    result.push(...getSubtreeNodes(child.id));
  });
  return result;
};
// Вычисляемые свойства для видимых рёбер
const visibleEdges = computed(() => {
  return edges.value.filter((edge) => {
    const sourceNode = nodes.value[edge.source];
    const targetNode = nodes.value[edge.target];
    return visibleNodes.value.includes(sourceNode) && visibleNodes.value.includes(targetNode);
  });
});
// Пересчет позиций узлов
const recalculateNodePositions = () => {
  nodes.value.forEach((node) => {
    const parent = nodes.value.find((n) => n.id === edges.value.find((e) => e.target === node.id)?.source);
    const levelNodes = nodes.value.filter((n) => n.y === node.y);
    const visibleLevelNodes = levelNodes.filter((levelNode) => visibleNodes.value.includes(levelNode));
    const nodeIndex = visibleLevelNodes.indexOf(node);
    if (nodeIndex !== -1) {
      const centerX = parent ? parent.x : width.value / 2;
      const horizontalSpacing = 100; // Расстояние между узлами одного уровня
      // Рассчитываем позицию узла с учетом четности или нечетности количества узлов
      const totalSiblings = visibleLevelNodes.length;
      const isOdd = totalSiblings % 2 !== 0;
      const middleIndex = Math.floor(totalSiblings / 2);
      if (isOdd && nodeIndex === middleIndex) {
        // Центральный узел (для нечетного количества)
        node.x = centerX;
      } else {
        // Узлы слева и справа (включая четное количество)
        node.x =
          centerX +
          (nodeIndex - middleIndex) * horizontalSpacing +
          (isOdd ? 0 : horizontalSpacing / 2);
      }
    }
  });
};
onMounted(async () => {
  focusStore.setTimerStartTime(); // Запускаем таймер
  const cacheKey = 1; // Уникальный ключ для кэширования
  // Проверяем, есть ли данные в кэше
  if (useCacheStore().hasGraphData(cacheKey)) {
    const cachedData = useCacheStore().loadGraphData(cacheKey);
    nodes.value = cachedData.nodes;
    edges.value = cachedData.edges;
    recalculateNodePositions(); // Пересчитываем позиции узлов
  } else {
    await APIfunctions.fetchData(nodes, edges, buildTree, recalculateNodePositions);
    // Сохраняем данные в кэш
    useCacheStore().saveGraphData(cacheKey, nodes.value, edges.value, focusStore.treeData);
  }
  const startTime = focusStore.getTimerStartTime(); // Получаем время начала таймера
  if (startTime) {
    const endTime = Date.now(); // Текущее время
    const elapsedTime = endTime - startTime; // Разница во времени
    console.log(`Монтирование компонента заняло ${elapsedTime} мс`);
  }
});
</script>
<style scoped>
.graph-container {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.1);
}
svg {
  overflow: visible;
}
.arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  z-index: 10;
}
.left-arrow {
  left: 10px;
}
.right-arrow {
  right: 10px;
}
</style>