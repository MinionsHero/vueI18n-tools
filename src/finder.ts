import {LocaleMessageObject, LocaleMessageArray, LocaleMessages} from 'vue-i18n'

class Finder {
    private readonly messages: LocaleMessages
    private readonly cnRegExp: RegExp

    constructor(messages: LocaleMessages, cnRegExp) {
        this.messages = messages
        this.cnRegExp = cnRegExp
    }

    handle() {
        const messages = this.messages
        const keys = Object.keys(messages)
        const localMessageObj = messages['cn']
        const flattenCNObj = this.flatten(localMessageObj)
        const findKeys = this.findKeys(flattenCNObj, this.cnRegExp)
        return keys.reduce((obj, key) => {
            const localMessageObj = messages[key]
            const flattenObj = this.flatten(localMessageObj)
            obj[key] = this.filterValues(flattenObj, findKeys)
            return obj
        }, {})
    }

    // Object平铺
    private flatten(localMessageObj: LocaleMessageObject | LocaleMessageArray, prefixKey: string = '', obj: LocaleMessageObject | LocaleMessageArray = {}) {
        const keys = Object.keys(localMessageObj)
        return keys.reduce((obj, key) => {
            const value = localMessageObj[key]
            let k = prefixKey + (prefixKey === '' ? '' : '.') + key
            if (typeof value === 'function') {
                throw new Error('该工具不支持Function转换')
            }
            if (typeof value !== 'object') {
                obj[k] = value
            } else {
                this.flatten(value, k, obj)
            }
            return obj
        }, obj)
    }

    // 检索符合条件的key
    private findKeys(localMessageObj: LocaleMessageObject | LocaleMessageArray, regExp: RegExp) {
        const keys = Object.keys(localMessageObj)
        const result: string[] = []
        return keys.reduce((arr, key) => {
            const value = localMessageObj[key]
            if (regExp.test(value)) {
                arr.push(key)
            }
            return arr
        }, result)
    }

    // 查找匹配keys的value，组成新的object
    private filterValues(localMessageObj: LocaleMessageObject | LocaleMessageArray, keys: string[]) {
        return keys.reduce((obj, key) => {
            obj[key] = localMessageObj[key]
            return obj
        }, {})
    }
}

export default Finder