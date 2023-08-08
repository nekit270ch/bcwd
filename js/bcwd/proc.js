bcwd.proc = {
    procList: {},
    pid: 0,
    create(conf){
        //conf: { onopen: function, onexit: function, name: string }
        if(conf.onopen) conf.onopen();
        this.procList[this.pid] = conf;
        return this.pid++;
    },
    kill(pid, force){
        if(force || this.procList[pid].onexit()){
            delete this.procList[pid];
        }
    },
    list(){
        let proc = [];
        for(let i in this.procList){
            let p = this.procList[i];
            proc.push({ name: p.name, pid: parseInt(i), onexit: p.onexit });
        }
        return proc;
    }
};