<template>
    <!-- Стрелка вправо -->
    <button v-if="showRightArrow" class="arrow right-arrow" @click="scrollNodes">
        &#8594;
    </button>
</template>

<script setup>
import { computed } from "vue";
import { useFocusStore } from "../../../../stores/focusStore";

const focusStore = useFocusStore(); //хранилище

// Вычисляемое свойство для отображения стрелки вправо
const showRightArrow = computed(() => {
  const rootNodes = focusStore.graphData.nodes.filter((node) => node.y === 0); // Все корневые узлы
  return focusStore.horizontalScroll < rootNodes.length - 1; // Стрелка вправо отображается, если есть узлы впереди
});

// Прокрутка узлов
const scrollNodes = () => {
    focusStore.horizontalScroll++;
};
</script>
<style scoped>
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
.right-arrow {
  right: 10px;
}
</style>