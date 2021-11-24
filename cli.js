#!/usr/bin/env node
let ezServer = require('.');
const argv = process.argv.slice(2);
const fs = require('fs');

if (argv[0] === "run") {
    ezServer.run(argv[1]);
}
if (argv[0] === "build") {
    ezServer.compile(argv[1], argv.includes('--skip-ncc')).then(async x => {
        if (argv.includes('-o')) {
            fs.writeFileSync(argv[argv.indexOf('-o')+1],x);
        } else {
            console.log(x);
        }
        if (argv.includes('--use-pkg')) {
            const { exec } = require('pkg');
            let args = [argv[argv.indexOf('-o')+1]];
            if (argv.includes('--pkg-target')) {
                args.push('-t', argv[argv.indexOf('--pkg-target')+1]);
            }
            await exec(args)
        }
    })
}