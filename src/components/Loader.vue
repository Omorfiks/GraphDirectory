<template>
    <div class="loading-screen">
      <div class="loader">
        <div class="arc top"></div>
        <div class="arc bottom"></div>
      </div>
    </div>
  </template>
  
  <style scoped>
  /* Общий контейнер для загрузочного экрана */
  .loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8); /* Полупрозрачный фон */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999; /* Чтобы экран был поверх всего */
  }
  
  /* Контейнер для лоадера */
  .loader {
    position: relative;
    width: 80px;
    height: 80px;
  }
  
  /* Стиль для дуг */
  .arc {
    position: absolute;
    width: 80px;
    height: 80px;
    border: 4px solid transparent;
    border-top-color: #ffffff; /* Цвет верхней дуги */
    border-radius: 100%; /* Делаем форму круга */
    animation: spin 1.5s linear infinite; /* Анимация вращения */
    box-sizing: border-box; /* Убедимся, что границы учитываются в размерах */
  }
  
  /* Верхняя дуга */
  .top {
    transform: rotate(0deg); /* Начальное положение первой дуги */
    animation-direction: normal; /* Вращение по часовой стрелке */
  }
  
  /* Нижняя дуга */
  .bottom {
    transform: rotate(0deg); /* Противоположное начальное положение */
    animation-direction: normal; /* Вращение против часовой стрелки */
  }
  
  /* Анимация вращения */
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  </style>