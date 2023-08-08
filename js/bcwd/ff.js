bcwd.ff = {
    async checkFormat(fileName, format){
        let fc = JSON.parse(await bcwd.fs.file.read(fileName));
        return fc.format == format;
    },
    bcap: {
        format: 'BCWD/AppPackage 1.0',
        async installFromFile(fileName, verbose){
            return await this.install(await bcwd.fs.file.readObj(fileName), verbose);
        },
        async install(data, verbose){
            let r = '';
            for(let a of data.actions){
                switch(a.action){
                    case 'createDir': {
                        await bcwd.fs.dir.create(a.path);
                        if(verbose) r += `Создана папка: ${a.path}\n`;
                        break;
                    }
                    case 'createFile': {
                        await bcwd.fs.file.write(a.path, '');
                        if(verbose) r += `Создан файл: ${a.path}\n`;
                        break;
                    }
                    case 'writeFile': {
                        await bcwd.fs.file.write(a.path, a.data);
                        if(verbose) r += `Записан файл: ${a.path}\n`;
                        break;
                    }
                    case 'downloadFile': {
                        let url = a.url??bcwd.fs.util.makePath(data.url, a.path);
                        let fd = await (await fetch(url)).text();
                        await bcwd.fs.file.write(a.path, fd);
                        if(verbose) r += `Скачан файл: ${a.path} с ${url}\n`;
                        break;
                    }
                    case 'deleteFile': {
                        await bcwd.fs.file.delete(a.path);
                        if(verbose) r += `Удалён файл: ${a.path}\n`;
                        break;
                    }
                    case 'deleteDir': {
                        await bcwd.fs.dir.delete(a.path);
                        if(verbose) r += `Удалена папка: ${a.path}\n`;
                        break;
                    }
                    case 'execCommand': {
                        await bcwd.shell.execCommand(a.command);
                    }
                }
            }
            if(verbose) return r.trimEnd();
        }
    },
    du: {
        format: 'BCWD/DataUrlFile 1.0',
        async getDataURL(fileName){
            let fc = JSON.parse(await bcwd.fs.file.read(fileName));
            return `data:${fc.type};base64,${fc.data}`;
        },
        async createFromDataURL(fileName, dataUrl){
            let type = dataUrl.match(/data:(.+);/)[1];
            let cont = dataUrl.split(',').pop();
            await bcwd.fs.file.write(fileName, JSON.stringify({
                format: this.format,
                type: type,
                data: cont
            }));
        },
        async getType(fileName){
            let fc = JSON.parse(await bcwd.fs.file.read(fileName));
            return fc.type;
        }
    },
    theme: {
        async install(fileName){
            let file = await bcwd.fs.file.readObj(fileName);
            let style = await bcwd.fs.file.readObj('/conf/style.json');

            function mergeDeep(target, source){
                const isObject = (obj)=>obj&&typeof obj=='object';
              
                if(!isObject(target) || !isObject(source)){
                    return source;
                }
              
                Object.keys(source).forEach(key=>{
                    let targetValue = target[key], sourceValue = source[key];
                
                    if(Array.isArray(targetValue) && Array.isArray(sourceValue)){
                        target[key] = targetValue.concat(sourceValue);
                    }else if(isObject(targetValue) && isObject(sourceValue)){
                        target[key] = mergeDeep(Object.assign({}, targetValue), sourceValue);
                    }else{
                        target[key] = sourceValue;
                    }
                });

                return target;
            }

            await bcwd.fs.file.writeObj('/conf/style.json', mergeDeep(style, file.theme));
        }
    }
}