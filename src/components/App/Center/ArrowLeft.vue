<template>
    <!-- Стрелка влево -->
    <button v-if="showLeftArrow" class="arrow left-arrow" @click="scrollNodes">
        &#8592;
    </button>
</template>

<script setup>
import { computed } from "vue";
import { useFocusStore } from "../../../../stores/focusStore";

const focusStore = useFocusStore(); //хранилище

// Вычисляемое свойство для отображения стрелки влево
const showLeftArrow = computed(() => {
  return focusStore.horizontalScroll > 0; // Стрелка влево отображается, если можно прокрутить назад
    
});

// Прокрутка узлов
const scrollNodes = () => {
    focusStore.setTimerStartTime(); // Запускаем таймер
    focusStore.horizontalScroll--;
};
</script>