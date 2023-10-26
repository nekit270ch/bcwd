bcwd.shell = {
    error: {
        FILE_TYPE_NOT_FOUND: 'File type not found',
        INVALID_COMMAND: 'Command not found'
    },
    async execCommand(command, replace){
        if(command.code){
            if(replace){
                replace.forEach(r=>{
                    command.code = command.code.replace(r[0], r[1]);
                });
            }
            return eval(command.code);
        }else if(command.fileName && command.args){
            if(replace){
                replace.forEach(r=>{
                    command.fileName = command.fileName.replace(r[0], r[1]);
                    command.args.forEach((a,i)=>{
                        command.args[i] = a.replace(r[0], r[1]);
                    });
                });
            }
            if(command.fileName.endsWith('.ca')){
                command.args.unshift(command.fileName);
                command.fileName = '/bapps/apphost.sa';
            }
            
            return await bcwd.fs.file.exec(command.fileName, command.args);
        }else{
            return this.error.INVALID_COMMAND;
        }
    },
    async openFile(fileName){
        let fileTypes = JSON.parse(await bcwd.fs.file.read('/conf/filetypes.json'));
        let ext = fileName.split('.').pop();

        if(!fileTypes[ext]) return this.error.FILE_TYPE_NOT_FOUND;
        return await this.execCommand(fileTypes[ext], [['$fileName', fileName]]);
    },
    messageBox(obj){
        return new Promise(async (res,_)=>{
            let win;

            let el = document.createElement('div');
            el.style.padding = '1em';
            
            let txth = document.createElement('div');
            txth.style.display = 'flex';
            txth.style.justifyContent = 'flex-center';

            let txt = document.createElement('div');
            txt.innerHTML = obj.text.replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\n', '<br>');

            let btnCont = document.createElement('div');
            btnCont.style.display = 'flex';
            btnCont.style.justifyContent = 'space-evenly';
            btnCont.style.paddingBottom = '0.1em';

            obj.buttons.forEach(btnText=>{
                let btn = document.createElement('button');
                btn.style.margin = '0 0.5em';
                btn.innerText = btnText;
                btn.addEventListener('click', ()=>{
                    res(btnText);
                    win.close(true);
                });
                btnCont.appendChild(btn);
            });

            txth.appendChild(txt);
            el.appendChild(txth);
            el.appendChild(document.createElement('br'));
            el.appendChild(btnCont);

            win = await bcwd.window.open({
                title: obj.title,
                elem: el,
                width: obj.width,
                resizable: false,
                onclose: ()=>res(null)
            });
        });
    },
    inputBox(obj){
        return new Promise(async (res,_)=>{
            let win;

            let el = document.createElement('div');
            el.style.padding = '1em';
            
            let txt = document.createElement('div');
            txt.style.textAlign = 'center';
            txt.innerText = obj.text;

            let inp = document.createElement('input');
            inp.type = 'text';
            inp.autocomplete = 'off';
            inp.size = obj.inputSize ?? 30;
            inp.value = obj.defaultText ?? '';

            let btn = document.createElement('button');
            btn.innerText = 'OK';
            btn.style.marginLeft = '1em';
            btn.addEventListener('click', ()=>{
                res(inp.value);
                win.close(true);
            })

            el.appendChild(txt);
            el.appendChild(document.createElement('br'));
            el.appendChild(inp);
            el.appendChild(btn);

            win = await bcwd.window.open({
                title: obj.title,
                elem: el,
                resizable: false,
                onclose: ()=>res(null)
            });
        });
    }
}

bcwd.util.loadLib = async function(fileName){
    return eval(await bcwd.fs.file.read(fileName));
}

function oeh(err){
    window.onerror = e=>{
        bcwd.ll.handleError(e);
    };

    bcwd.shell.messageBox({
        title: 'Ошибка',
        text: 'Необработанное исключение в приложении:\n\n'+err,
        buttons: ['OK']
    }).then(()=>{
        window.onerror = oeh;
    });
}

function urh(err){
    window.onunhandledrejection = e=>{
        bcwd.ll.handleError(e.reason);
    };

    bcwd.shell.messageBox({
        title: 'Ошибка',
        text: 'Необработанное исключение в приложении:\n\n'+err.reason,
        buttons: ['OK']
    }).then(()=>{
        window.onunhandledrejection = urh;
    });
}

window.onerror = oeh;
window.onunhandledrejection = urh;

window.addEventListener('keydown', async e=>{
    if(e.key == 'F4') await bcwd.shell.execCommand({ fileName: '/apps/sh.ca', args: [] })
});
