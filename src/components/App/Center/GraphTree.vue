<template>
  <div class="graph-container">
    <!-- Стрелка влево -->
    <button
      v-if="showLeftArrow"
      class="arrow left-arrow"
      @click="scrollNodes(-1)"
    >
      &#8592;
    </button>

    <!-- SVG-граф -->
    <svg :width="width" :height="height">
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
        @contextmenu.prevent="showContextMenu($event, node.id)"
      >
        <!-- Контур (обводка) -->
        <circle
          v-if="focusedNode === node.id"
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

    <!-- Стрелка вправо -->
    <button
      v-if="showRightArrow"
      class="arrow right-arrow"
      @click="scrollNodes(1)"
    >
      &#8594;
    </button>
  </div>

      <!-- Компонент управления узлами -->
      <NodeManager
      v-if="isMenuVisible"
      :currentNodeId="contextMenuNodeId"
      :showMenu="isMenuVisible"
      :menuPosition="menuPosition"
      @nodeDeleted="handleNodeDeleted"
      @closeMenu="closeContextMenu"
    />
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useFocusStore } from "../../../../stores/focusStore";
import axios from "axios";
import NodeManager from "./NodeManager.vue"; // Импортируем компонент


// Состояние для контекстного меню
const isMenuVisible = ref(false);
const contextMenuNodeId = ref(null);
const menuPosition = ref({ x: 0, y: 0 });

// Показать контекстное меню
const showContextMenu = (event, nodeId) => {
  contextMenuNodeId.value = nodeId;
  menuPosition.value = { x: event.pageX, y: event.pageY };
  isMenuVisible.value = true;
};

// Закрыть контекстное меню
const closeContextMenu = () => {
  isMenuVisible.value = false;
  contextMenuNodeId.value = null;
};

// Обработка удаления узла
const handleNodeDeleted = (deletedNodeId) => {
  // Удаляем узел
  nodes.value = nodes.value.filter((node) => node.id !== deletedNodeId);

  // Удаляем связанные рёбра
  edges.value = edges.value.filter(
    (edge) => edge.source !== deletedNodeId && edge.target !== deletedNodeId
  );

  // Пересчитываем позиции узлов
  recalculateNodePositions();
};


const focusStore = useFocusStore();
const focusedNode = computed(() => focusStore.focusedNode);

// Размеры SVG
const width = ref(window.innerWidth);
const height = ref(window.innerHeight);

// Состояния для узлов и рёбер
const nodes = ref([]);
const edges = ref([]);

// Состояние для горизонтальной прокрутки
const horizontalScroll = ref(0); // Текущая позиция прокрутки

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

  // Добавляем ребро, если есть родительский узел
  if (parentId !== null) {
    edges.value.push({ source: parentId, target: nodeId });
  }

  // Рекурсивно добавляем дочерние узлы
  if (data.children) {
    data.children.forEach((child) => {
      buildTree(child, nodeId, level + 1);
    });
  }
};

// Загрузка данных при монтировании компонента
const fetchData = async () => {
  try {
    const response = await axios.get("http://localhost:3000/api/tree-data");
    const treeData = response.data;

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
  }
};

onMounted(() => {
  fetchData();
});

// Выделение узла при наведении
const highlightNode = (nodeId) => {
  focusStore.setFocusedNode(nodeId);
};

// Снятие выделения узла
const clearFocus = () => {
  focusStore.clearFocus();
};

// Вычисляемые свойства для видимых узлов и рёбер
const visibleNodes = computed(() => {
  const rootNodes = nodes.value.filter((node) => node.y === 0); // Все корневые узлы
  const visibleRootNode = rootNodes[horizontalScroll.value]; // Только один видимый корневой узел

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

// Показывать ли стрелки
const showLeftArrow = computed(() => {
  return horizontalScroll.value > 0; // Стрелка влево отображается, если можно прокрутить назад
});

const showRightArrow = computed(() => {
  const rootNodes = nodes.value.filter((node) => node.y === 0); // Все корневые узлы
  return horizontalScroll.value < rootNodes.length - 1; // Стрелка вправо отображается, если есть узлы впереди
});

// Прокрутка узлов
const scrollNodes = (direction) => {
  const rootNodes = nodes.value.filter((node) => node.y === 0); // Все корневые узлы

  if (direction === -1 && horizontalScroll.value > 0) {
    horizontalScroll.value--;
  } else if (direction === 1 && horizontalScroll.value < rootNodes.length - 1) {
    horizontalScroll.value++;
  }
};

// Пересчет позиций узлов
const recalculateNodePositions = () => {
  nodes.value.forEach((node) => {
    const parent = nodes.value.find((n) => n.id === edges.value.find((e) => e.target === node.id)?.source);
    const levelNodes = nodes.value.filter((n) => n.y === node.y);

    const visibleLevelNodes = levelNodes.filter((levelNode) => visibleNodes.value.includes(levelNode));
    const nodeIndex = visibleLevelNodes.indexOf(node);

    if (nodeIndex !== -1) {
      const centerX = parent ? parent.x : width.value / 2;
      const horizontalSpacing = 200; // Расстояние между узлами одного уровня

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

// Наблюдатель за horizontalScroll
watch(horizontalScroll, () => {
  recalculateNodePositions();
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