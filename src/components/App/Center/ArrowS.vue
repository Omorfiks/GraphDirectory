<template>
    <!-- Стрелка влево -->
    <Transition name="slide-left" appear>
    <button v-if="showLeftArrow" class="arrow left-arrow codicon codicon-arrow-left" @click="scrollNodes(false)">
    </button>
    </Transition>
    <!-- Стрелка вправо -->
    <Transition name="slide-right" appear>
    <button v-if="showRightArrow" class="arrow right-arrow codicon codicon-arrow-right" @click="scrollNodes(true)">
    </button>
    </Transition>
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
// Вычисляемое свойство для отображения стрелки влево
const showLeftArrow = computed(() => {
  return focusStore.horizontalScroll > 0; // Стрелка влево отображается, если можно прокрутить назад
    
});
// Прокрутка узлов
const scrollNodes = (right) => {
    if (right) {
        focusStore.setTimerStartTime(); // Запускаем таймер
        focusStore.horizontalScroll++;
    } else {
        focusStore.setTimerStartTime(); // Запускаем таймер
        focusStore.horizontalScroll--;
    }

};
</script>
<style scoped>
.arrow {
  position: absolute;

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
.left-arrow {
  left: 10px;
}
/*
  Анимации появления и исчезновения могут иметь
  различные продолжительности и функции плавности.
*/
.slide-right-enter-active {
  transition: all 0.3s ease-out;
}

.slide-right-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(10px);
  opacity: 0;
}
/*
  Анимации появления и исчезновения могут иметь
  различные продолжительности и функции плавности.
*/
.slide-left-enter-active {
  transition: all 0.3s ease-out;
}

.slide-left-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}
</style>