import file from 'fs-extra'
import {LocaleMessageObject, LocaleMessages} from 'vue-i18n'
import path from 'path'

export default class FileUtil {

    static handle(messages: LocaleMessages) {
        const langs = Object.keys(messages)
        // const cnMessages = messages['cn']
        langs.forEach(lang => {
            this.writeJSONSync(lang, messages[lang], {dirName: 'langs'})
        })
    }

    static writeJSONSync(fileName: string, object: any, option?: { dirName?: string }) {
        const filePath = path.resolve(__dirname, `output/${option && option.dirName || 'options'}/${fileName}.json`)
        file.removeSync(filePath)
        file.ensureFileSync(filePath)
        return file.writeJsonSync(filePath, object, {spaces: 2})
    }

    static writeFileSync(filePath: string, data: any) {
        filePath = path.resolve(__dirname, `output/langs/${filePath}`)
        file.removeSync(filePath)
        file.ensureFileSync(filePath)
        return file.writeFileSync(filePath, data)
    }
}
