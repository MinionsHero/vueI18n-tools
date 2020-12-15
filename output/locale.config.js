const config = {
  '58main':{
    cn:'../../../coin/58main/src/locales/cn.js',
    en:'../../../coin/58main/src/locales/en.js',
    ja:'../../../coin/58main/src/locales/ja.js',
    ko:'../../../coin/58main/src/locales/ko.js',
    ru:'../../../coin/58main/src/locales/ru.js'
  },
  '58main-account':{
    cn:'../../../coin/58main-account/src/assets/js/i18n/cn.json',
    en:'../../../coin/58main-account/src/assets/js/i18n/en.json',
    ja:'../../../coin/58main-account/src/assets/js/i18n/ja.json',
    ko:'../../../coin/58main-account/src/assets/js/i18n/ko.json',
    ru:'../../../coin/58main-account/src/assets/js/i18n/ru.json'
  },
  '58new-otc':{
    cn:'../../../coin/58new-otc/src/locales/modules/cn.js',
    en:'../../../coin/58new-otc/src/locales/modules/en.js',
    ja:'../../../coin/58new-otc/src/locales/modules/ja.js',
    ko:'../../../coin/58new-otc/src/locales/modules/ko.js',
    ru:'../../../coin/58new-otc/src/locales/modules/ru.js'
  },
  '58new-spot':{
    cn:'../../../coin/58new-spot/src/locales/modules/cn.js',
    en:'../../../coin/58new-spot/src/locales/modules/en.js',
    ja:'../../../coin/58new-spot/src/locales/modules/ja.js',
    ko:'../../../coin/58new-spot/src/locales/modules/ko.js',
    ru:'../../../coin/58new-spot/src/locales/modules/ru.js'
  },
  'new-swap':{
    cn:'../../../coin/new-swap/src/locales/modules/cn.js',
    en:'../../../coin/new-swap/src/locales/modules/en.js',
    ja:'../../../coin/new-swap/src/locales/modules/ja.js',
    ko:'../../../coin/new-swap/src/locales/modules/ko.js',
    ru:'../../../coin/new-swap/src/locales/modules/ru.js'
  },
  '58c2c-loan':{
    cn:'../../../coin/58c2c-loan/src/assets/js/i18n/cn.json',
    en:'../../../coin/58c2c-loan/src/assets/js/i18n/en.json',
    ja:'../../../coin/58c2c-loan/src/assets/js/i18n/ja.json',
    ko:'../../../coin/58c2c-loan/src/assets/js/i18n/ko.json',
    ru:'../../../coin/58c2c-loan/src/assets/js/i18n/ru.json'
  },
  '58nuxt-usdt':{
    cn:'../../../coin/58nuxt-usdt/language/cn.js',
    en:'../../../coin/58nuxt-usdt/language/en.js',
    ja:'../../../coin/58nuxt-usdt/language/ja.js',
    ko:'../../../coin/58nuxt-usdt/language/ko.js',
    ru:'../../../coin/58nuxt-usdt/language/ru.js'
  },
  '58nuxt-mixed':{
    cn:'../../../coin/58nuxt-mixed/language/cn.js',
    en:'../../../coin/58nuxt-mixed/language/en.js',
    ja:'../../../coin/58nuxt-mixed/language/ja.js',
    ko:'../../../coin/58nuxt-mixed/language/ko.js',
    ru:'../../../coin/58nuxt-mixed/language/ru.js'
  },
  '58half':{
    cn:'../../../coin/58half/src/assets/js/i18n/cn.js',
    en:'../../../coin/58half/src/assets/js/i18n/en.js',
    ja:'../../../coin/58half/src/assets/js/i18n/ja.js',
    ko:'../../../coin/58half/src/assets/js/i18n/ko.js',
    ru:'../../../coin/58half/src/assets/js/i18n/ru.js'
  }
}

module.exports = config
// let newConfig = {}
// for(let projectName in config){
//   newConfig[projectName] = {}
//   const locales = config[projectName]
//   for(let lang in locales){
//     const messagePaths = locales[lang]
//     newConfig[projectName][lang] =messagePaths.map(p=>{
//       return require(p)
//     })
//   }
// }
// module.exports = newConfig