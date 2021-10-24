import s3sync from 's3-sync-client';
import path from 'path';
import prompt from 'prompt';
import fs from 'fs-extra';
import * as _ from 'lodash';
import rimraf from 'rimraf';

const loginFile = path.join(process.cwd(), '.chcplogin');

(function () {
    module.exports = {
        execute: execute,
    };

    async function execute(context) {
        try {
            await deploy(context);
        } catch (err) {
            throw err;
        }
    }

    async function deploy(context) {
        let config;
        let credentials;
        let ignore = context.ignoredFiles;

        try {
            config = fs.readFileSync(context.defaultConfig, 'utf8');
            config = JSON.parse(config);
        } catch (e) {
            console.log(
                'Cannot parse cordova-hcp.json. Did you run cordova-hcp init?'
            );
            process.exit(0);
        }
        if (!config) {
            console.log(
                'You need to run "cordova-hcp init" before you can run "cordova-hcp login".'
            );
            console.log(
                'Both commands needs to be invoked in the root of the project directory.'
            );
            process.exit(0);
        }
        try {
            credentials = fs.readFileSync(loginFile, 'utf8');
            credentials = JSON.parse(credentials);
        } catch (e) {
            console.log('Cannot parse .chcplogin: ', e);
        }
        if (!credentials) {
            console.log(
                'You need to run "cordova-hcp login" before you can run "cordova-hcp deploy".'
            );
            process.exit(0);
        }

        ignore = ignore.filter((ignoredFile) => !ignoredFile.match(/^chcp/));
        ignore = ignore.map((ignoredFile) => `!${ignoredFile}`);

        // console.log('Credentials: ', credentials);
        // console.log('Config: ', config);
        // console.log('Ignore: ', ignore);

        try {
            rimraf.sync('./s3sync');
            await fs.ensureDir('./s3sync');
        } catch (err) {
            throw err;
        }

        try {
            await fs.copy(context.sourceDirectory, './s3sync');
        } catch (err) {
            console.error(err);
        }

        const client = new s3sync({
            region: config.s3region,
            credentials: {
                accessKeyId: credentials.key,
                secretAccessKey: credentials.secret,
            },
        });
        const { TransferMonitor } = s3sync;
        const monitor = new TransferMonitor();
        monitor.on('progress', (progress) => console.log(progress));
        try {
            await client.sync(
                './s3sync',
                `s3://${config.s3bucket}/${config.s3prefix}`,
                {
                    commandInput: {
                        ACL: 'public-read',
                    },
                    monitor: monitor,
                    del: true,
                }
            );
            console.log(
                'Deploy complete',
                `s3://${config.s3bucket}/${config.s3prefix}`
            );
        } catch (err) {
            throw err;
        }
    }
})();
