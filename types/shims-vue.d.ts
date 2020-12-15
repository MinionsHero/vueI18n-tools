declare module '*.vue' {
  import Vue from 'vue'
  // 让部分vue组件支持install
  export default class UIComponent extends Vue {
    /** Install component into Vue */
    static install (vue: typeof Vue): void
  }
}
