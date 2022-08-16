// https://vuejs.org/guide/components/provide-inject.html#working-with-symbol-keys
import { inject } from 'vue'
import { key } from './key'

export default function useHttp() {
  return inject<string>(key)
}
