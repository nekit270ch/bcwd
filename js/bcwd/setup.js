bcwd.setup = {
    async install(){
        let data = await (await fetch('files/setup.bcap')).json();
        bcwd.log.write('[setup] ' + (await bcwd.ff.bcap.install(data, true)).replaceAll('\n', '\n[setup] '));    
    }
}