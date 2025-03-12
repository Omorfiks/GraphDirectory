import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia' // Импортируем Pinia
import App from './App.vue'

// Создаем экземпляр приложения Vue
const app = createApp(App)

// Создаем экземпляр Pinia и подключаем его к приложению
const pinia = createPinia()
app.use(pinia)

// Монтируем приложение
app.mount('#app')