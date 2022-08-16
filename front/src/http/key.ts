// https://vuejs.org/guide/typescript/composition-api.html#typing-provide-inject
import type { InjectionKey } from 'vue'

export const key = Symbol('axios') as InjectionKey<string>
