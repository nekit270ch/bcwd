//BCWD 0.6-beta [BC5.0-beta]

const bcwd = {
    util: {
        async forEachAsync(array, cb){
            if(array.length == 0) return;
            async function th(i){
                await cb(array[i], i, array);
                if(i < array.length-1) await th(i+1);
            }
            await th(0);
        },
        async replaceRegexAsync(str, regex, func){
            let m = str.match(regex);
            if(!m) return str;
            return str.replace(regex, await func(...m));
        }
    },
    log: {
        text: '',
        write(...t){
            let txt = t.join(' ');
            console.log(txt);
            this.text += txt+'\n';
        },
        get(){
            return this.text.trimEnd();
        }
    },
    ll: {
        handleError(exm){
            document.body.style.font = '1.2em Consolas, monospace';
            document.body.style.cursor = 'default';
            document.body.innerHTML = `<h2>Критическая ошибка</h2><pre>${exm}</pre><a href='javascript:location.reload()'>Перезагрузить</a>&nbsp;&nbsp;&nbsp;<a href='javascript:bcwd.setup.install().then(()=>location.reload())'>Переустановить</a>`;
        },
        loadModule(m, cbo, cbe){
            let s = document.createElement('script');
            s.src = `js/bcwd/${m}.js`;
            s.onload = ()=>{
                bcwd.log.write('[modules] Загружен модуль:', m);
                if(cbo) cbo();
            }
            s.onerror = e=>{
                bcwd.ll.handleError(`Ошибка загрузки модуля "${m}": ${e}`);
                if(cbe) cbe();
            }
            document.body.appendChild(s);
        },
        getLSParam(pn){
            return localStorage.getItem(pn);
        },
        setLSParam(pn, pv){
            localStorage.setItem(pn, pv);
        },
        listLSParams(){
            let arr = [];
            for(let i in localStorage){
                if(i.startsWith('BCWD_')) arr.push(i);
            }
            return arr;
        }
    },
    version: 'BCWD 0.6-beta [BC5.0-beta]',
    ver: 0.6
};

bcwd.log.write(bcwd.version);

if(!localStorage.BCWD_MODULES_LIST) localStorage.BCWD_MODULES_LIST = 'fs,proc,gui,shell,ff,setup';
const MODULES = localStorage.BCWD_MODULES_LIST.split(',');

function loadNextModule(i){
    let m = MODULES[i];
    bcwd.ll.loadModule(m, ()=>{
        if(i+1 < MODULES.length){
            loadNextModule(i+1);
        }else{
            if(!localStorage.BCWD_INIT_FUNCTION) localStorage.BCWD_INIT_FUNCTION = 'init';
            window[localStorage.BCWD_INIT_FUNCTION]();
        }
    }, null);
}

if(localStorage.BCWD_LL_AUTOEXEC) eval(localStorage.BCWD_LL_AUTOEXEC);
if(localStorage.BCWD_DISABLE_MODULES != '1') loadNextModule(0);

async function init(){
    if(!(await bcwd.fs.file.exists('/conf/bcwd.json'))){
        bcwd.log.write('[init] Файл конфигурации не найден.');
        bcwd.log.write('[init] Установка BCWD...');

        await bcwd.setup.install();
    }

    let styleEl = document.createElement('style');
    let style = await bcwd.fs.file.readObj('/conf/style.json');
    let sttxt = '';

    for(let sel in style.css){
        let obj = style.css[sel];
        sttxt += sel+'{\n';
        for(let i in obj){
            sttxt += `\t${i.replace(/[A-Z]{1}/g, m=>'-'+m.toLowerCase())}: ${obj[i]};\n`;
        }
        sttxt += '}\n';
    }

    styleEl.innerText = sttxt;
    document.head.appendChild(styleEl);

    let conf = JSON.parse(await bcwd.fs.file.read('/conf/bcwd.json'));

    let ft = fetch;
    bcwd.util.rawFetch = ft;
    window.fetch = function(url, options){
        if((options?.method??'GET') == 'GET' && conf.useFetchProxy && typeof conf.fetchProxyURL == 'string') url = conf.fetchProxyURL.replace('$URL', url);
        return ft(url, options);
    }

    bcwd.log.write('[init] Оболочка:', conf.shell);
    await bcwd.shell.execCommand({ fileName: conf.shell, args: [] });
}