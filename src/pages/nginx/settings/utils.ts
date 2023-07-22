

export type NgxVersionData= {
    versionInfo?: string
    modules: string[]
    data?: string,
    args: string[]
    prefix?: string
    sbin?: string

}

/**
 * 解析一下nginx的版本信息
 * @param version
 */
export const parseVersionInfo = (version?: string)=>{
    const data: NgxVersionData = {
        modules: [],
        data: version,
        args: []
    }
    if (!version){
        return data
    }
    const lines = version.split('configure arguments:')
    data.versionInfo = lines[0]
    if (lines.length < 2){
        return data
    }
    const args = lines[1].split(' ').filter(item=>!!item)

    args.forEach(line=>{
        if (line.startsWith('--prefix=')){
            data.prefix = line.substring(9)
        }else if (line.startsWith('--sbin-path=')){
            data.sbin = line.substring(12)
        }
        if (line.indexOf('=') > 0){
            data.args.push(line)
        }else if (line.startsWith('--with-')){
            const module = line.replace('--with-','')
            data.modules.push(module)
        }
    })
    return data
}