<template>
    <div class="auth-container">
      <div class="auth-form">
        <h2>Авторизация</h2>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Email</label>
            <input v-model="email" type="email" required />
          </div>
          <div class="form-group">
            <label>Пароль</label>
            <input v-model="password" type="password" required />
          </div>
          <button type="submit">Войти</button>
          <div v-if="error" class="error-message">{{ error }}</div>
        </form>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  
  // Реактивные данные
  const email = ref("");
  const password = ref("");
  const error = ref("");
  
  // Метод для обработки отправки формы
  const handleSubmit = () => {
    // Пример простой валидации
    if (!email.value || !password.value) {
      error.value = "Заполните все поля";
      return;
    }
  
    // Очистка ошибок
    error.value = "";
  
    // Здесь можно добавить логику отправки данных на сервер
    alert(`Добро пожаловать, ${email.value}!`);
  };
  </script>
  
  <style scoped>
  .auth-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(1px); /* Эффект размытия фона */
  }
  
  .auth-form {
    background: rgba(255, 255, 255, 0.7);
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    width: 100%;
    max-width: 400px;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    color: white;
  }
  
  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    color: rgb(32, 32, 32);
  }
  
  button {
    width: 100%;
    padding: 0.75rem;
    background: #007bff;
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    transition: background 0.3s;
  }
  
  button:hover {
    background: #0056b3;
  }
  
  .error-message {
    color: #ff4444;
    margin-top: 1rem;
    text-align: center;
  }
  </style>