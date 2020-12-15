import Finder from "@/finder";
import FileUtil from "@/fileUtil";
import i18n from 'demo/locales/language'
const finder = new Finder(i18n,/(充值|提现)/g)
const localeMessages = finder.handle()
const util = new FileUtil({'58main':localeMessages})
util.handle().then(()=>{
    console.log('ok')
})