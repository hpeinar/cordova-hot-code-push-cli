#! /usr/bin/env node
const path = require('path');
const yargs = require('yargs');
const argv = yargs.argv;
const chcpContext = require(path.resolve(
    __dirname,
    '..',
    'dist',
    'context.js'
));

var cmd = argv._[0];
switch (cmd) {
    case 'build':
    case 'login':
    case 'init':
    case 'server':
    case 'deploy':
        console.log('v1.0.0. Running ' + cmd);
        var command = require(path.resolve(
                __dirname,
                '..',
                'dist',
                cmd + '.js'
            )),
            context = chcpContext.context(argv);
        command.execute(context);
        break;
    default:
        console.log('TODO: Should print usage instructions.');
        process.exit(0);
}
