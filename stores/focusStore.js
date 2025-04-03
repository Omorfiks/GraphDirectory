import { defineStore } from "pinia";

export const useFocusStore = defineStore("focus", {
  state: () => ({
    filePreviewPosition: { x: 800, y: 100 }, // Начальная позиция
    filePreviewSize: { width: 600, height: 400 }, // Начальные размеры
    timerStartTime: null, // Время начала таймера
    isDragging: false,
    isFilePreviewVisible: false,
    currentFileNode: null, // Текущий выбранный файл

    dropdownRefreshKey: 0, // Новое поле для обновления выпадающего списка
    /**
     * Флаг загрузки данных
     */
    isLoading: true,
    /**
     * ID текущего выделенного узла
     */
    focusedNode: null,
    /**
     * Данные дерева (массив объектов)
     */
    treeData: [],
    /**
     * Данные графа
     */
    graphData: {
      /**
       * Узлы графа
       */
      nodes: [],
      /**
       * Рёбра графа
       */
      edges: [],
      /**
       * Состояние для хранения видимых узлов
       */
      visibleNodes: [],
    },
    /**
     * Текущая позиция прокрутки графа
     */
    horizontalScroll: 0,
    /**
     * Ширина окна
     */
    width: window.innerWidth,
    /**
     * Высота окна
     */
    height: window.innerHeight,
    /**
     * Переменная для обновления графа
     */
    refreshGraph: 0,
  }),
  getters: {

  },
  actions: {
    /**
     * Показывать ли левую стрелку
     */
    showLeftArrow() {
      return this.horizontalScroll > 0; // Стрелка влево отображается, если можно прокрутить назад
    },
    /**
     * Показывать ли правую стрелку
     */
    showRightArrow() {
      const rootNodes = this.graphData.nodes.filter((node) => node.y === 0); // Все корневые узлы
      return this.horizontalScroll < rootNodes.length - 1; // Стрелка вправо отображается, если есть узлы впереди
    },
    /**
     * Добавление узла
     */
    setNodes(newNodes) {
      this.graphData.nodes = newNodes;
    },
    /**
     * Вычисляемые свойства для видимых узлов
     */
    visibleNodes() {
      const rootNodes = this.treeData
      const visibleRootNode = rootNodes[this.horizontalScroll]; // Только один видимый корневой узел
      // Добавляем дочерние узлы для видимого корневого узла
      const allVisibleNodes = this.getSubtreeNodes(visibleRootNode.id);
      return allVisibleNodes;
    },
    /**
     * Рекурсивная функция для получения всех дочерних узлов.
     * @param {number} nodeId - ID узла, для которого нужно получить поддерево.
     * @param {Set<number>} visited - Множество для отслеживания посещенных узлов.
     * @returns {Array} - Массив всех дочерних узлов, включая сам узел.
     */
    getSubtreeNodes(nodeId, visited = new Set()) {
      // Если узел уже посещен, прекращаем рекурсию
      if (visited.has(nodeId)) return [];
      visited.add(nodeId);

      // Получаем текущий узел
      const result = [this.graphData.nodes[nodeId]];

      // Находим дочерние узлы через рёбра
      const children = this.graphData.edges
        .filter((edge) => edge.source === nodeId)
        .map((edge) => this.graphData.nodes[edge.target]);

      // Рекурсивно добавляем дочерние узлы
      children.forEach((child) => {
        result.push(...this.getSubtreeNodes(child.id, visited));
      });

      return result;
    },
    /**
     * Переходит к последнему графу.
     */
    scrollToLastGraph() {
      const rootNodes = this.graphData.nodes.filter((node) => node.y === 0); // Все корневые узлы
      this.horizontalScroll = rootNodes.length - 1; // Переходим к последнему графу
    },
    /**
     * Устанавливает фокус на узел с указанным ID.
     * @param {number} id - ID узла, который нужно выделить.
     */
    setFocusedNode(id) {
      this.focusedNode = id+1;
    },
    /**
     * Сбрасывает фокус (убирает выделение).
     */
    clearFocus() {
      this.focusedNode = null;
      // this.hideFilePreview(); // Скрываем предпросмотр при сбросе фокуса
    },
    /**
     * Загружает данные дерева из внешнего источника (например, сервера).
     * @param {Array} data - Данные дерева (массив объектов).
     */
    loadTreeData(data) {
      this.treeData = data;
    },
    /**
     * Загружает данные графа из внешнего источника (например, сервера).
     * @param {Object} data - Данные графа (объект с полями nodes и edges).
     */
    loadGraphData(data) {
      this.graphData.nodes = data.nodes || [];
      this.graphData.edges = data.edges || [];
    },
    /**
     * Добавляет новый узел в дерево.
     * @param {Object} newNode - Новый узел (объект с полями id, name, type и children).
     * @param {number|null} parentId - ID родительского узла (null, если узел корневой).
     */
    addNodeToTree(newNode, parentId = null) {
      if (parentId === null) {
        // Если parentId === null, добавляем узел как корневой
        this.treeData.push(newNode);
      } else {
        // Иначе ищем родительский узел и добавляем новый узел в его children
        const parent = this.findTreeNodeById(parentId);
        if (parent && parent.children) {
          parent.children.push(newNode);
        } else if (parent) {
          parent.children = [newNode];
        }
      }
    },
    /**
     * Удаляет узел из дерева по его ID.
     * @param {number} nodeId - ID узла, который нужно удалить.
     */
    deleteNodeFromTree(nodeId) {
      this.treeData = this.removeNodeFromTree(this.treeData, nodeId);
    },
    /**
     * Рекурсивно удаляет узел из дерева.
     * @param {Array} tree - Массив узлов дерева.
     * @param {number} nodeId - ID узла, который нужно удалить.
     * @returns {Array} - Обновленный массив узлов дерева.
     */
    removeNodeFromTree(tree, nodeId) {
      return tree
        .filter((node) => node.id !== nodeId) // Удаляем сам узел
        .map((node) => {
          if (node.children) {
            node.children = this.removeNodeFromTree(node.children, nodeId); // Рекурсивно удаляем из детей
          }
          return node;
        });
    },
    /**
     * Находит узел в дереве по его ID.
     * @param {number} nodeId - ID узла, который нужно найти.
     * @returns {Object|null} - Найденный узел или null, если узел не найден.
     */
    findTreeNodeById(nodeId) {
      const findNode = (nodes) => {
        for (const node of nodes) {
          if (node.id === nodeId) {
            return node;
          }
          if (node.children) {
            const found = findNode(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      return findNode(this.treeData);
    },
    /**
     * Добавляет новый узел в граф.
     * @param {Object} newNode - Новый узел (объект с полями id, name, x, y).
     */
    addNodeToGraph(newNode) {
      this.graphData.nodes.push(newNode);
    },
    /**
     * Добавляет новое ребро в граф.
     * @param {Object} newEdge - Новое ребро (объект с полями source и target).
     */
    addEdgeToGraph(newEdge) {
      this.graphData.edges.push(newEdge);
    },
    /**
     * Удаляет узел из графа по его ID.
     * @param {number} nodeId - ID узла, который нужно удалить.
     */
    deleteNodeFromGraph(nodeId) {
      // Удаляем узел из графа
      this.graphData.nodes = this.graphData.nodes.filter((node) => node.id !== nodeId);
      // Удаляем связанные рёбра
      this.graphData.edges = this.graphData.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );
    },
    /**
     * Очищает все данные (дерево и граф).
     */
    clearAllData() {
      this.treeData = [];
      this.graphData.nodes = [];
      this.graphData.edges = [];
      this.focusedNode = null;
    },
    /**
     * Функция для построения дерева
     * @default parentId = null
     * @default level = 0
     */
    buildTree(data, parentId = null, level = 0) {
      const nodeId = this.graphData.nodes.length;
      // Расчет координат
      const parent = parentId !== null ? this.graphData.nodes[parentId] : null;
      const centerX = parent ? parent.x : this.width / 2;
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
      // Добавляем ребро, если есть родительский узел
      if (parentId !== null) {
        this.graphData.edges.push({ source: parentId, target: nodeId });
      }
      // Рекурсивно добавляем дочерние узлы
      if (data.children) {
        data.children.forEach((child) => {
          this.buildTree(child, nodeId, level + 1);
        });
      }      
      // Функция для проверки существования узла с такими же name и y
      const isNodeAlreadyExists = (nodes, name, y) => {
        return nodes.some((node) => node.name === name && node.y === y);
      };
      // Добавление нового узла только если нет совпадений
      if (!isNodeAlreadyExists(this.graphData.nodes, data.name, y)) {
        this.graphData.nodes.push({ id: nodeId, name: data.name, x, y });
      }
    },
    /**
     * Пересчет позиций узлов
     */
    recalculateNodePositions() {
      this.graphData.nodes.forEach((node) => {
        const parent = this.graphData.nodes.find((n) => n.id === this.graphData.edges.find((e) => e.target === node.id)?.source);
        const levelNodes = this.graphData.nodes.filter((n) => n.y === node.y);
        const visibleLevelNodes = levelNodes.filter((levelNode) => this.visibleNodes().includes(levelNode));
        const nodeIndex = visibleLevelNodes.indexOf(node);
        if (nodeIndex !== -1) {
          const centerX = parent ? parent.x : this.width / 2;
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
    },
    /**
     * Рекурсивно собирает все узлы с указанным типом.
     * @param {Array} nodes - Массив узлов для проверки.
     * @param {string} type - Тип узла (например, "folder").
     * @returns {Array} - Массив найденных узлов.
     */
    findNodesByType(nodes, type) {
      const result = [];

      const traverse = (nodeList) => {
        nodeList.forEach((node) => {
          if (node.type === type) {
            result.push(node);
          }
          if (node.children && node.children.length > 0) {
            traverse(node.children); // Рекурсивно проверяем дочерние узлы
          }
        });
      };

      traverse(nodes); // Начинаем обход с корневых узлов
      return result;
    },
    /**
     * Находит узел в дереве по его имени.
     * @param {string} nodeName - Имя узла, который нужно найти.
     * @returns {Object|null} - Найденный узел или null, если узел не найден.
     */
    findTreeNodeByName(nodeName) {
      const findNode = (nodes) => {
        for (const node of nodes) {
          if (node.name === nodeName) {
            return node;
          }
          if (node.children) {
            const found = findNode(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      return findNode(this.treeData);
    },
    /**
     * Увеличивает значение dropdownRefreshKey для принудительного обновления выпадающего списка.
     */
    refreshDropdown() {
      this.dropdownRefreshKey += 1;
    },
    showFilePreview(node) {
      this.isFilePreviewVisible = true;
      this.currentFileNode = node;
    },
    hideFilePreview() {
      this.isFilePreviewVisible = false;
      this.currentFileNode = null;
    },
    setIsDragging(value) {
      this.isDragging = value;
    },
    // Установить время начала таймера
    setTimerStartTime() {
      this.timerStartTime = Date.now();
    },
    // Получить время начала таймера
    getTimerStartTime() {
      return this.timerStartTime;
    },
    // Установка позиции
    setFilePreviewPosition(position) {
      this.filePreviewPosition = position;
    },
    // Установка размеров
    setFilePreviewSize(size) {
      this.filePreviewSize = size;
    },
  },
});