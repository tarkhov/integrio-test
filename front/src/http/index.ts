import axios from 'axios'
import VueAxios from 'vue-axios'
// https://vuejs.org/guide/components/provide-inject.html#working-with-symbol-keys
import { key } from './key'

export default (app: any) => {
  app.use(VueAxios, axios)
  app.config.globalProperties
    .axios.defaults.baseURL = process.env.VUE_APP_API_URL
  app.provide(key, app.config.globalProperties.axios)
}
