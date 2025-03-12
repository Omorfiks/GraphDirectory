import { defineStore } from "pinia";

export const useFocusStore = defineStore("focus", {
  state: () => ({
    focusedNode: null, // ID текущего выделенного узла
  }),
  actions: {
    setFocusedNode(id) {
      this.focusedNode = id; // Устанавливаем фокус на узел с указанным ID
    },
    clearFocus() {
      this.focusedNode = null; // Сбрасываем фокус (убираем выделение)
    },
  },
});