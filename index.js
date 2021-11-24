const yml = require('yml');
const express = require('express');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');


module.exports = {
    run(filepath) {
        const app = express();
        app.set('view engine','ejs');

        let cwd = process.cwd();
        let root = yml.load(filepath);
        
        if (!root.server) throw new Error('missing server key');

        let server = root.server;

        if (!server.port) throw new Error('missing port');

        if (!server.routes) throw new Error('missing server routes');
        if (!Array.isArray(server.routes)) throw new TypeError('server routes is not an array');
        if (server.views) {
            app.set('views',path.join(cwd, server.views));
        }
        for (let [_, route] of server.routes.entries()) {
            if (!route.serve) throw new Error('missing "serve" key on route '+_);
            if (!route.path) throw new Error('missing path on route '+_);
            if (route.serve === "static") {
                if (!route.filepath) throw new Error('missing filepath on route '+_);
                
                app.get(route.path,(req, res) => {
                    res.sendFile(path.resolve(cwd, route.filepath));
                })
            }
            if (route.serve === "redirect") {
                if (!route.location) throw new Error('missing location key on route '+_);
                app.get(route.path,(req, res) => {
                    res.redirect(route.location);
                })
            }
            if (route.serve === "dynamic") {
                if (!route.view) throw new Error('missing view on route '+_);
                let permissions = route.permissions || [];
                app.get(route.path, (req, res) => {
                    let permFuncs = {
                        "modules": ["require", require],
                        "process": ["process", process],
                        "request": ["request", req],
                        "response": ["response", res],
                        "request-params": ["params", req.params],
                        "request-query": ["query", req.query],
                        "express/app": ["app", app],
                        "server-yml:root": ["root", root],
                        "server-yml:server": ["server", server],
                        //"filesystem": ["fs", fs]
                        "filesystem:write": ["writeFileSync",fs.writeFileSync],
                        "filesystem:read": ["readFileSync",fs.readFileSync]
                        
                    }
                    let duckOptions = {};
                    for (let permission of permissions) {
                        let [name, func] = permFuncs[permission];
                        duckOptions[name] = func
                    }
                    
                    res.render(route.view, duckOptions)
                })
            }
        }

        app.listen(server.port,() => {
            if (server.listeningMessage) {
                console.log(server.listeningMessage.replace(/@PORT/g,server.port))
            }
        })
    },
    async compile(filepath,skipncc = false) {
        const ncc = require('@vercel/ncc');
        let cwd = process.cwd();
        let root = yml.load(filepath);
        let compiled = "const express = require('express');\
        const fs = require('fs');\
        const path = require('path');\
        const app = express();\
        app.set('view engine','ejs');\
        let cwd = process.cwd();";

        if (!root.server) throw new Error('missing server key');

        let server = root.server;

        if (!server.port) throw new Error('missing port');

        if (!server.routes) throw new Error('missing server routes');
        if (!Array.isArray(server.routes)) throw new TypeError('server routes is not an array');
        if (server.views) {
            compiled += `app.set('views',path.join(cwd, ${JSON.stringify(server.views)}));`
        }

        for (let [_, route] of server.routes.entries()) {
            if (!route.serve) throw new Error('missing "serve" key on route '+_);
            if (!route.path) throw new Error('missing path on route '+_);
            if (route.serve === "static") {
                if (!route.filepath) throw new Error('missing filepath on route '+_);
                
                compiled += `app.get(${JSON.stringify(route.path)},(req, res) => {\
                    res.sendFile(path.resolve(cwd, ${JSON.stringify(route.filepath)}));\
                });`
            }
            if (route.serve === "redirect") {
                if (!route.location) throw new Error('missing location key on route '+_);
                compiled += `app.get(${JSON.stringify(route.path)},(req, res) => {\
                    res.redirect(${JSON.stringify(route.location)});\
                });`
            }
            if (route.serve === "dynamic") {
                if (!route.view) throw new Error('missing view on route '+_);
                let permissions = route.permissions || [];
                let permFuncs = {
                    "modules": ["require", "require"],
                    "process": ["process", "process"],
                    "request": ["request", "req"],
                    "response": ["response", "res"],
                    "request-params": ["params", "req.params"],
                    "request-query": ["query", "req.query"],
                    "express/app": ["app", "app"],
                    "server-yml:root": ["root", JSON.stringify(root)],
                    "server-yml:server": ["server", JSON.stringify(server)],
                    //"filesystem": ["fs", fs]
                    "filesystem:write": ["writeFileSync","fs.writeFileSync"],
                    "filesystem:read": ["readFileSync","fs.readFileSync"]
                    
                }
                let duckOptions = {};
                for (let permission of permissions) {
                    let [name, func] = permFuncs[permission];
                    duckOptions[name] = func
                }
                // stringify the json
                let jsonentries = [];
                for (let opt in duckOptions) {
                    jsonentries.push(`"${opt}": ${duckOptions[opt]}`);
                }
                let jsonstring = `{${jsonentries.join(',')}}`;

                compiled += `app.get(${JSON.stringify(route.path)}, (req, res) => {\
                    res.render(${JSON.stringify(route.view)}, ${jsonstring})\
                });`
                if (server.listeningMessage) {
                    compiled += `app.listen(${server.port},() => \
                        console.log(${JSON.stringify(server.listeningMessage.replace(/@PORT/g,server.port))})\
                    );`;
                } else {
                    compiled += `app.listen(${server.port});`
                }
                compiled = compiled.replace(/    /g,"");
                if (skipncc) {
                    return compiled;
                }
                fs.writeFileSync("./tmp.js",compiled,{encoding: 'utf-8'});
                let result = await ncc(path.join(cwd, "./tmp.js"), {minify: true});
                fs.unlinkSync("./tmp.js");
                return result.code;
            }
        }
    }
}