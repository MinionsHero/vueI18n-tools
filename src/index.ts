import path from 'path'
import resolve from 'resolve'
import evalJs from 'eval'
import babel from "@babel/core"
import FileUtil from "@/fileUtil";
import Finder from "@/Finder";
import {LocaleMessageObject} from "vue-i18n";


class VueI18nReplacer {

    private readonly langs: string[]
    private readonly keywords: RegExp
    private readonly replacer: { (value: string, keywords: RegExp): string }

    constructor(langs: string[], cnKeywords: RegExp, cnReplacer: { (value: string, keywords: RegExp): string }) {
        this.langs = langs
        this.keywords = cnKeywords
        this.replacer = cnReplacer
    }

    eval(filePath) {
        // json文件不需要编译
        if (filePath.endsWith('.json')) {
            return {default: require(filePath)}
        }
        const result = babel.transformFileSync(filePath, {
            configFile: path.resolve(__dirname, 'babel.config.js')
        })
        return evalJs(result.code, filePath, {
            require: (p) => {
                const res = resolve.sync(p, {basedir: path.dirname(filePath)});
                return this.eval(res)
            }
        })
    }

    generateDir() {
        const configPath = path.resolve(__dirname, './locale.config.js')
        const config = require(configPath)
        const projectNames = Object.keys(config)
        const output = this.langs.reduce((obj, lang) => {
            obj[lang] = {}
            return obj
        }, {})
        projectNames.forEach((projectName) => {
            const locales = config[projectName]
            const languages = Object.keys(locales)
            // 查找
            const localeMessages = languages.reduce((obj, lang) => {
                const messages = this.eval(path.resolve(__dirname, locales[lang])).default
                obj[lang] = messages
                return obj
            }, {})
            const finder = new Finder(localeMessages, this.keywords)
            const findMessages = finder.handle()
            Object.keys(findMessages).forEach(lang => {
                output[lang] = Object.assign({}, output[lang], {
                    [projectName]: findMessages[lang]
                })
            })
        })
        // 生成文件
        return FileUtil.handle(this.filterSameValues(output))
    }

    filterSameValues(output: { [lang: string]: { [projectName: string]: LocaleMessageObject } }) {
        let sameValueItems: { value: string, keys: { projectName: string, lang: string, key: string }[] }[] = []
        for (let lang in output) {
            const projects = output[lang]
            for (let projectName in projects) {
                const messages = projects[projectName]
                for (let key in messages) {
                    let v = messages[key]
                    if (v) {
                        let value = v.toString()
                        const findItem = sameValueItems.find(item => item.value === value)
                        if (!findItem) {
                            sameValueItems.push({value: value, keys: [{projectName, lang, key}]})
                        } else {
                            findItem.keys.push({projectName, lang, key})
                        }
                    }
                }
            }
        }
        sameValueItems = sameValueItems.filter(item => item.keys.length > 1)
        FileUtil.writeJSONSync('equalValues', sameValueItems)
        //
        let output2 = {}
        for (let lang in output) {
            const projects = output[lang]
            for (let projectName in projects) {
                const messages = projects[projectName]
                for (let key in messages) {
                    let v = messages[key]
                    // cn是用来参考的，因此不合并同值项
                    if (lang !== 'cn' && sameValueItems.find(item => item.value === v && !this.isSameKey({
                        key,
                        projectName,
                        lang
                    }, item.keys[0]))) {
                        continue
                    }
                    if (lang === 'cn') {
                        v = this.replacer(v.toString(), this.keywords)
                    }
                    this.assignKey(output2, lang, projectName)[key] = v
                }
            }
        }
        return output2
    }

    private isSameKey(key1: { projectName: string, lang: string, key: string }, key2: { projectName: string, lang: string, key: string }) {
        return key1.projectName === key2.projectName && key1.key === key2.key && key1.lang === key2.lang
    }

    private assignKey(obj: { [key: string]: any }, ...keys: string[]) {
        return keys.reduce((obj, key) => {
            if (obj[key] === undefined) {
                obj[key] = {}
            }
            return obj[key]
        }, obj)
    }

}

// const replacer = new VueI18nReplacer(['cn', 'en', 'ja', 'ru', 'ko'], /(充值|提现)/, (v) => {
//     v = v.toString().replace(/充值/g, '充币')
//     v = v.toString().replace(/提现/g, '提币')
//     return v
// })
const replacer = new VueI18nReplacer(['cn', 'en', 'ja', 'ru', 'ko'], /(请输入|广告)/, (v) => {
    v = v.toString().replace(/请输入/g, '敬请输入')
    v = v.toString().replace(/广告/g, '洗脑广告')
    return v
})
replacer.generateDir()
const info = `翻译需求：原来cn.json文件中的【充值】全部改成【充币】，【提现】全部改成【提币】,各个语言版本进行各自的修改和校对。
翻译说明：
1. langs目录里的每个语言文件对应各自的翻译，它是一个json键值文件，只需要根据需求修改值即可，千万不要更改键名。
如 【"depositStatus.successed": "Successful"】 只需要修改里面的值【Successful】。
2. 不要修改json文件中的双引号，它是json格式本身的一部分。
3. 如果自己的语言文件不清楚新的中文翻译，可参考cn.json中同名键名对应的中文值（cn.json已经是经过修改完成后的文件)。
4. 各自的语言.json文件已经进行了相同翻译语句的合并，以便减轻您的工作量。
5. 翻译完毕，请您把翻译后的.json文件传给原开发者即可。
最后，感谢您的辛勤付出~`
FileUtil.writeFileSync('翻译说明.txt', info)
console.log('查找的文件夹已经生成')