import {execFile,fork} from 'child_process'
import path from 'path'

class SourceReader {
    private readonly i18nSrcFile: string
    private readonly webpackConfigFile: string

    constructor(option:{webpackConfigFile:string,i18nSrcFile: string}) {
        this.i18nSrcFile = option.i18nSrcFile
        this.webpackConfigFile = option.webpackConfigFile
    }

    handle(){
        console.log(this.webpackConfigFile)
        execFile(this.webpackConfigFile,(error, stdout, stderr) => {
            if (error) {
                throw error;
            }
            console.log(stdout);
        });
        // Webpack()
        // const i18nFilePath = ''
    }
}

const r = new SourceReader({webpackConfigFile:path.resolve(__dirname,'../webpack.config.js'),i18nSrcFile:path.resolve(__dirname,'../demo/locales/language.js')})
r.handle()