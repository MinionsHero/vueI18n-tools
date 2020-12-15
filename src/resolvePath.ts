import path from 'path'
export default function (...paths) {
    const newPaths = paths.map((p:string,i)=>{
        if(i === paths.length-1){
            return p
        }
        const dotIndex = p.lastIndexOf('.')
        const extName = p.slice(dotIndex+1)
        if(extName && !extName.includes('/')){
            const lineIndex = p.lastIndexOf('/')
            if(lineIndex>0){
                return p.slice(0,lineIndex)
            }
        }
        return p
    })
    return path.resolve(...newPaths)
}