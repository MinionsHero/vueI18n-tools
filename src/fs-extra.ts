import {WriteOptions} from "fs-extra";

export default {
    writeJsonSync(file: string, object: any, options?: WriteOptions){
        console.log(`write:${file},${JSON.stringify(object).slice(0,100)}...`)
    }
}