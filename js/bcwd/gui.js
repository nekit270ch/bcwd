bcwd.desktopEl = document.querySelector('#desktop');
bcwd.windowsEl = document.querySelector('#windows');

if(!bcwd.desktopEl){
    let del = document.createElement('div');
    document.body.appendChild(del);
    bcwd.desktopEl = del;
}

if(!bcwd.windowsEl){
    let wel = document.createElement('div');
    document.body.appendChild(wel);
    bcwd.windowsEl = wel;
}

bcwd.util.appendStyle = async function(elem, style){
    for(let i in style){
        let sti = style[i];

        sti = await bcwd.util.replaceRegexAsync(sti, /du\((.+),(.+)\)/, async (_, ft, fn)=>{
            let fl = await bcwd.fs.file.readObj(fn);
            return `url("data:${ft};base64,${fl.data}")`;
        });

        sti = await bcwd.util.replaceRegexAsync(sti, /du\((.+)\)/, async (_, fn)=>{
            if(bcwd.ff) return `url("${await bcwd.ff.du.getDataURL(fn)}")`;
            let fl = await bcwd.fs.file.readObj(fn);
            return `url("data:${fl.type};base64,${fl.data}")`;
        });

        sti = await bcwd.util.replaceRegexAsync(sti, /dufont\((.+),(.+)\)/, async (_, ft, fn)=>{
            let randName = '';
            let rch = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefijklmnopqrstuvwxyz';
            for(let i = 0; i < 20; i++) randName += rch[Math.floor(Math.random()*rch.length)];
            
            let fl = await bcwd.fs.file.readObj(fn);
            let u = `url("data:${ft};base64,${fl.data}")`;
            
            let face = new FontFace(randName, u);
            document.fonts.add(face);
            await face.load();
            
            return randName;
        });

        sti = await bcwd.util.replaceRegexAsync(sti, /dufont\((.+)\)/, async (_, fn)=>{
            let randName = '';
            let rch = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefijklmnopqrstuvwxyz';
            for(let i = 0; i < 20; i++) randName += rch[Math.floor(Math.random()*rch.length)];
            
            let u = '';
            if(bcwd.ff) u = `url("${await bcwd.ff.du.getDataURL(fn)}")`;
            else{
                let fl = await bcwd.fs.file.readObj(fn);
                u = `url("data:${fl.type};base64,${fl.data}")`;
            }
            
            let face = new FontFace(randName, u);
            document.fonts.add(face);
            await face.load();

            return randName;
        });

        elem.style[i] = sti;
    }
}

bcwd.window = {
    winID: 0,
    zIndex: 1000,
    async open(obj){
        let win = document.createElement('div');

        let style = JSON.parse(localStorage.BCWD_USE_LS_STYLE?localStorage.BCWD_LS_STYLE:await bcwd.fs.file.read('/conf/style.json'));
        bcwd.util.appendStyle(win, style.window.window);
        win.style.zIndex = this.zIndex++;

        let title = document.createElement('div');
        title.style.borderBottom = 'solid 1px black';
        bcwd.util.appendStyle(title, style.window.title);
        title.draggable = true;

        let st = document.createElement('span');
        st.innerText = obj.title || '\xA0';
        title.appendChild(st);

        let closeBtn = null;
        if(obj.closeButton || typeof obj.closeButton == 'undefined'){
            closeBtn = document.createElement('button');
            closeBtn.innerText = '\u2716';
            bcwd.util.appendStyle(closeBtn, style.window.closeButton);

            closeBtn.addEventListener('click', ()=>{
                bcwd.windowsEl.removeChild(win);
                if(obj.onclose) obj.onclose();
            });

            title.appendChild(closeBtn);
        }

        if(!obj.elem){
            obj.elem = document.createElement('div');
            obj.elem.innerHTML = obj.html;
        }

        if(obj.resizable || typeof obj.resizable == 'undefined'){
            win.style.overflow = 'auto';
            win.style.resize = 'both';
        }

        win.appendChild(title);
        win.appendChild(obj.elem);
        bcwd.windowsEl.appendChild(win);

        let cs = getComputedStyle(win);

        if(obj.width) win.style.width = obj.width+'px';
        else obj.width = parseInt(cs.width)+2;

        if(obj.height) win.style.height = obj.height+'px';
        else obj.height = parseInt(cs.height)+2;

        if(!obj.x) obj.x = window.innerWidth*devicePixelRatio/2 - obj.width/2;
        if(!obj.y) obj.y = window.innerHeight/2 - obj.height/2;

        win.style.left = obj.x+'px';
        win.style.top = obj.y+'px';

        win.onresize = ()=>{
            let { width, height } = getComputedStyle(win);
            obj.width = parseInt(width);
            obj.height = parseInt(height);
        }

        let drx = 0, dry = 0;
        title.onmousemove = e=>{
            drx = e.pageX - obj.x;
            dry = e.pageY - obj.y;
        }
        title.ondragend = e=>{
            e.preventDefault();
            let x = e.clientX - drx;
            let y = e.clientY - dry;

            if(x < 0) x = 0;
            if(y < 0) y = 0;

            win.style.left = x + 'px';
            win.style.top = y + 'px';

            obj.x = x;
            obj.y = y;

            win.style.zIndex = this.zIndex++;
        }

        return {
            id: this.winID++,
            elem: win,
            title: st,
            closeButton: closeBtn,
            content: obj.elem,
            close: (force)=>{
                bcwd.windowsEl.removeChild(win);
                if(obj.onclose && !force) obj.onclose();
            }
        };
    }
};

window.ondragover = e=>e.preventDefault();
window.oncontextmenu = e=>e.preventDefault();