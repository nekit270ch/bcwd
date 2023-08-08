bcwd.fs = {
    error: {
        FILE_NOT_FOUND: 'File not found'
    },
    db: {
        clear(cb){
            let open = indexedDB.deleteDatabase('bcwd_storage');
            open.onsuccess = ()=>{
                if(cb) cb();
            }
        },
        write(fileName, data, cb){
            let open = indexedDB.open('bcwd_storage', 1);
            open.onupgradeneeded = ()=>{
                let db = open.result;
                db.createObjectStore('storage', {keyPath: 'name'});
            }
            open.onsuccess = ()=>{
                let db = open.result;
                let tr = db.transaction('storage', 'readwrite');

                let storage = tr.objectStore('storage');
                let file = {name: fileName, data: data};
                let req = storage.put(file);
                req.onsuccess = ()=>{
                    if(cb) cb();
                }
                req.onerror = ()=>{
                    if(cb) cb(req.error);
                }
            }
            open.onerror = ()=>{
                if(cb) cb(open.error);
            }
        },
        read(fileName, cb){
            let open = indexedDB.open('bcwd_storage', 1);
            open.onupgradeneeded = ()=>{
                let db = open.result;
                db.createObjectStore('storage', {keyPath: 'name'});
            }
            open.onsuccess = ()=>{
                let db = open.result;
                let tr = db.transaction('storage', 'readonly');

                let storage = tr.objectStore('storage');
                let req = storage.get(fileName);
                req.onsuccess = ()=>{
                    if(req.result){
                        if(cb) cb(req.result.data);
                    }else{
                        if(cb) cb(null, bcwd.fs.error.FILE_NOT_FOUND);
                    }
                }
                req.onerror = ()=>{
                    if(cb) cb(null, req.error);
                }
            }
            open.onerror = ()=>{
                if(cb) cb(null, open.error);
            }
        },
        getFiles(cb){
            let open = indexedDB.open('bcwd_storage', 1);
            open.onupgradeneeded = ()=>{
                let db = open.result;
                db.createObjectStore('storage', {keyPath: 'name'});
            }
            open.onsuccess = ()=>{
                let db = open.result;
                let tr = db.transaction('storage', 'readonly');

                let storage = tr.objectStore('storage');
                let req = storage.getAll();
                req.onsuccess = ()=>{
                    let obj = {};
                    for(let i in req.result){
                        let e = req.result[i];
                        obj[e.name] = e.data;
                    }
                    if(cb) cb(obj);
                }
                req.onerror = ()=>{
                    if(cb) cb({}, req.error);
                }
            }
            open.onerror = ()=>{
                if(cb) cb({}, open.error);
            }
        },
        delete(fileName, cb){
            let open = indexedDB.open('bcwd_storage', 1);
            open.onupgradeneeded = ()=>{
                let db = open.result;
                db.createObjectStore('storage', {keyPath: 'name'});
            }
            open.onsuccess = ()=>{
                let db = open.result;
                let tr = db.transaction('storage', 'readwrite');

                let storage = tr.objectStore('storage');
                let req = storage.delete(fileName);
                req.onsuccess = ()=>{
                    if(cb) cb();
                }
                req.onerror = ()=>{
                    if(cb) cb(req.error);
                }
            }
            open.onerror = ()=>{
                if(cb) cb(open.error);
            }
        }
    },
    file: {
        read(fileName){
            return new Promise((res, rej)=>{
                bcwd.fs.db.read(fileName, (data, error)=>{
                    if(error){
                        rej(error);
                    }else{
                        bcwd.fs.hook.fileHookList.forEach(hook=>{
                            data = hook('read', fileName, data);
                        });
                        res(data);
                    }
                })
            });
        },
        write(fileName, data){
            return new Promise((res, rej)=>{
                bcwd.fs.db.write(fileName, data, error=>{
                    if(error){
                        rej(error);
                    }else{
                        bcwd.fs.hook.fileHookList.forEach(hook=>{
                            hook('write', fileName);
                        });
                        res();
                    }
                })
            });
        },
        exists(fileName){
            return new Promise((res, rej)=>{
                this.read(fileName).then(()=>res(true)).catch(()=>res(false));
            });
        },
        delete(fileName){
            return new Promise((res, rej)=>{
                bcwd.fs.db.delete(fileName, err=>{
                    if(err){
                        rej(err);
                    }else{
                        bcwd.fs.hook.fileHookList.forEach(hook=>{
                            let hr = hook('delete', fileName);
                        });
                        res();
                    }
                });
            });
            
        },
        exec(fileName, args){
            return new Promise((res, _)=>{
                this.read(fileName).then(data=>{
                    (()=>{
                        eval(data);
                        let result = main(bcwd, args);
                        if(result instanceof Promise) result.then(d=>res(d));
                        else res(result);
                    })();
                });
            });
        },
        async readObj(fileName){
            return JSON.parse(await this.read(fileName));
        },
        async writeObj(fileName, obj){
            await this.write(fileName, JSON.stringify(obj, null, 4));
        },
        async download(fileName, url){
            await this.write(fileName, await (await fetch(url)).text());
        }
    },
    dir: {
        create(dirName){
            bcwd.fs.hook.dirHookList.forEach(hook=>{
                dirName = hook('create', dirName);
            });
            return bcwd.fs.file.write(bcwd.fs.util.makePath(dirName, '.d'), '');
        },
        async delete(dirName){
            (await this.list(dirName, true, true)).forEach(e=>{
                bcwd.fs.file.delete(e);
            });
        },
        list(dirName, recursive, includeD){
            return new Promise((res, rej)=>{
                bcwd.fs.db.getFiles((files, error)=>{
                    if(error) rej(error);

                    let f = [];
                    for(let file in files){
                        if(file.endsWith('/.d')){
                            let fn = file.split('/').slice(0, -1).join('/');
                            if(fn.length == 0) continue;

                            if(recursive){
                                if(fn != dirName && fn.startsWith(dirName)) f.push(fn);
                            }else{
                                if(fn.startsWith(dirName) && !fn.replace(dirName+(dirName=='/'?'':'/'), '').includes('/')) f.push(fn);
                            }
                            if(!includeD) continue;
                        }

                        if(recursive){
                            if(file.startsWith(dirName)) f.push(file);
                        }else{
                            if(file.startsWith(dirName) && file == (dirName + (dirName=='/'?'':'/') + file.split('/').at(-1))) f.push(file);
                        }
                    }
                    bcwd.fs.hook.dirHookList.forEach(hook=>{
                        f = hook('list', f);
                    });
                    res(f);
                });
            });
        },
        exists(dirName){
            return bcwd.fs.file.exists(bcwd.fs.util.makePath(dirName, '/.d'));
        }
    },
    util: {
        makePath(...components){
            return components.join('/').replace(/[\/]{2,}/g, '/');
        },
        splitPath(path){
            return path.split('/');
        },
        getLastPathPart(path){
            return path.split('/').at(-1);
        }
    },
    hook: {
        fileHookList: [],
        dirHookList: [],
        dbHookList: [],
        attach(type, func){
            if(type == 'file') this.fileHookList.push(func);
            else if(type == 'dir') this.dirHookList.push(func);
            else if(type == 'db') this.dbHookList.push(func);
        }
    }
}