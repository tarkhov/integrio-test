import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import http from './http'
import 'vue3-easy-data-table/dist/style.css'

createApp(App)
  .use(http)
  .use(router)
  .mount('#app')
