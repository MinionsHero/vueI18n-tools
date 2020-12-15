import Vue from 'vue'
import VueI18n from 'vue-i18n'
import cn from './cn.js'
import en from './en.js'
import ko from './ko.js'
import ru from './ru.js'
import ja from './ja.js'
Vue.config.silent = true
Vue.use(VueI18n)
const i18n = new VueI18n({
  locale: 'en', // 语言标识
  messages:{
    cn,en,ko,ru,ja
  },
})

export default i18n
