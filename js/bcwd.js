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
        isError: false,
        handleError(exm){
            this.isError = true;
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
        },
        shell(){
            document.body.innerHTML = '\
                <style>\
                    body, pre, input#cmdi{ font: 1em Consolas, monospace; color: white; background: black }\
                    input#cmdi{ width: 90%; border: none; outline: none }\
                    #desktop{ color: black; background: white }\
                </style>\
                <div id="desktop"><div id="windows"></div></div>\
                <pre id="cr">LLShell 0.1\n</pre>\
                &gt; <input type="text" autocomplete=off id="cmdi">';

            let ci = document.querySelector('#cmdi'), cr = document.querySelector('#cr');

            ci.focus();

            ci.addEventListener('keydown', e=>{
                if(e.key == 'Enter'){
                    cprint('\n> '+ci.value);
                    cprint(runCmd(ci.value));
                    ci.value = '';
                    ci.focus();
                }
            });

            let commands = {
                'echo': args=>args.join(' '),
                'print': args=>cprint(args.join(' ')),
                'clear': _=>cr.innerText = '',
                'exit': _=>exitShell(),
                'help': _=>helpMessage(),
                'set': args=>variables[args[0]] = args[1],
                'js': args=>eval(args.join(' ')),
                'reboot': _=>location.reload(),
                'load_module': args=>bcwd.ll.loadModule(args[0]),
                'load_modules': args=>args.forEach(m=>bcwd.ll.loadModule(m)),
                'set_param': args=>bcwd.ll.setLSParam(args[0], args[1]),
                'get_param': args=>bcwd.ll.getLSParam(args[0]),
                'list_params': _=>bcwd.ll.listLSParams().join(', ')
            }

            let variables = {};

            function runCmd(cmd){
                if(cmd.trim().length == 0) return;

                cmd = cmd.replace(/"(.+)"/g, (_, p1)=>{
                    return p1.replaceAll("'", '$Q1').replaceAll(' ', '$SP');
                });

                cmd = cmd.replace(/'(.+)'/g, (_, p1)=>{
                    return p1.replaceAll('"', '$Q2').replaceAll(' ', '$SP');
                });

                let rc = cmd.split(' ');
                let c = rc[0], args = rc.slice(1);

                args.forEach((arg,i,o)=>{
                    arg = arg.replaceAll('$Q1', "'").replaceAll('$Q2', '"').replaceAll('$SP', ' ');

                    if(arg.startsWith('~')){
                        o[i] = arg.slice(1);
                        return;
                    }

                    arg = arg.replace(/@([a-zA-Z0-9_\.]+)/g, (_, p1)=>{
                        return variables[p1];
                    });

                    arg = arg.replace(/@\((.+)\)/g, (_, p1)=>{
                        return variables[p1];
                    });

                    arg = arg.replace(/&\((.+)\)/g, (_, p1)=>{
                        console.log(p1);
                        return runCmd(p1)??'';
                    });

                    arg = arg.replace(/\$\((.+)\)/g, (_, p1)=>{
                        return eval(p1)??'';
                    });

                    o[i] = arg;
                });

                if(commands[c]){
                    try{
                        return commands[c](args)??'';
                    }catch(e){
                        return 'ОШИБКА: '+e;
                    }
                }else{
                    return 'ОШИБКА: Команда "'+c+'" не найдена';
                }
            }

            function cprint(txt){
                cr.innerText += txt+'\n';
            }

            function exitShell(){
                bcwd.ll.setLSParam('BCWD_LL_AUTOEXEC', '');
                bcwd.ll.setLSParam('BCWD_DISABLE_MODULES', '');
                location.reload();
            }

            function helpMessage(){
                cprint('LLShell 0.1\n\n\
                help                                 справка\n\
                set <переменная> <значение>          установить значение переменной\n\
                echo <текст>                         вернуть текст\n\
                print <текст>                        вывести текст\n\
                clear                                очистить консоль\n\
                exit                                 выйти из llshell\n\
                reboot                               перезагрузка\n\
                js <код>                             выполнить код\n\
                load_module <модуль>                 загрузить модуль\n\
                load_modules <модули>                загрузить несколько модулей\n\
                get_param <параметр>                 вывести значение параметра LS\n\
                set_param <параметр> <значение>      изменить значение параметра LS\n\
                list_params                          вывести список всех параметров LS');
            }
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
            try{
                window[localStorage.BCWD_INIT_FUNCTION]();
            }catch(e){
                bcwd.ll.handleError('init failed: ' + e);
            }
        }
    }, null);
}

try{
    if(localStorage.BCWD_LL_AUTOEXEC) eval(localStorage.BCWD_LL_AUTOEXEC);
}catch(e){
    bcwd.ll.handleError('LL_AUTOEXEC failed: ' + e);
}

try{
    if(!bcwd.ll.isError && localStorage.BCWD_DISABLE_MODULES != '1') loadNextModule(0);
}catch(e){
    bcwd.ll.handleError('Module loader failed: ' + e);
}

async function init(){
    if(bcwd.ll.isError) return;
    
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
        if(conf.useFetchProxy && typeof conf.fetchProxyURL == 'string' && (options?.method??'GET') == 'GET' && url.startsWith('http')) url = conf.fetchProxyURL.replace('$URL', url);
        return ft(url, options);
    }

    bcwd.log.write('[init] Оболочка:', conf.shell);
    await bcwd.shell.execCommand({ fileName: conf.shell, args: [] });

    await bcwd.util.forEachAsync(conf.startUpCommands, async command=>{
        await bcwd.shell.execCommand(command);
    });

    if(conf.parseURL){
        let q = {};
        location.search.slice(1).split('&').forEach(e=>{
            let el = e.split('=');
            q[decodeURIComponent(el[0])] = decodeURIComponent(el[1]);
        });

        if(q.action == 'exec'){
            bcwd.shell.execCommand({ fileName: q.fileName, args: q.args.split(',') });
        }
    }

    let f8Pressed = 0;
    window.addEventListener('keydown', e=>{
        if(e.key == 'F8'){
            if(f8Pressed < 4) f8Pressed++;
            else{
                if(!confirm('Enter LL Shell?')){
                    f8Pressed = 0;
                    return;
                }
                bcwd.ll.setLSParam('BCWD_LL_AUTOEXEC', 'bcwd.ll.shell()');
                bcwd.ll.setLSParam('BCWD_DISABLE_MODULES', '1');
                location.reload();
            }
        }
    });
}