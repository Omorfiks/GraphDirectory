<template>
    <div class="grid-background"></div>
  </template>
  <script>
  export default {
    name: "MovingGrid",
  };
  </script>
  <style>
  /* Стили для контейнера сетки */
  .grid-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 200%; /* Увеличиваем размер, чтобы сетка была бесконечной */
    height: 200%;
    background-size: 40px 40px; /* Размер ячейки сетки */
    background-image: linear-gradient(to right, #ccc 1px, transparent 1px),
                      linear-gradient(to bottom, #ccc 1px, transparent 1px);
    animation: moveDiagonal 5s linear infinite;
  }
  /* Анимация движения */
  @keyframes moveDiagonal {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(-5%, -5%); /* Движение влево-вверх */
    }
  }
  </style>