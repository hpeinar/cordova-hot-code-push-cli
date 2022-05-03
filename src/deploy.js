import s3sync from 's3-sync-client';
import path from 'path';
import prompt from 'prompt';
import fs from 'fs-extra';
import * as _ from 'lodash';
import rimraf from 'rimraf';
import fetch from 'node-fetch';

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
                'You need to run "cordova-hcp init"'
            );
            console.log(
                'Init command needs to be invoked in the root of the project directory.'
            );
            process.exit(0);
        }

        ignore = ignore.filter((ignoredFile) => !ignoredFile.match(/^chcp/));
        ignore = ignore.map((ignoredFile) => `!${ignoredFile}`);

        // console.log('Credentials: ', credentials);
        // console.log('Config: ', config);
        // console.log('Ignore: ', ignore);

        try {
            await archive(config);
        } catch (archivingError) {
            throw archivingError;
        }
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

    async function archive(config) {
        if (!config.s3archivePrefix) {
            console.log('Archiving prefix not specified, skipping archiving process'); 
            return;
        }

        console.log('Trying to archive current release...');
        const archiveClient = new s3sync({
            region: config.s3region,
        });

        const { TransferMonitor } = s3sync;
        const monitor = new TransferMonitor();
        monitor.on('archiving progress', (progress) => console.log(progress));

        let currentReleaseInformation;
        try {
            currentReleaseInformation = await (await fetch(`${config.content_url}`)).json();

            if (!currentReleaseInformation.release || !currentReleaseInformation.release.length) {
                throw new Error('Failed to read release information, aborting');
            }

            console.log(`Release "${currentReleaseInformation.release}" found, starting archiving process...`);
        } catch (err) {
            throw err;
        }

        const sourcePath = `s3://${config.s3bucket}/${config.s3prefix}`;
        const archivePath = `s3://${config.s3bucket}/${config.s3archivePrefix}/${currentReleaseInformation.release}`;

        try {
            await archiveClient.sync(
                sourcePath,
                archivePath,
                {
                    commandInput: {
                        ACL: 'private',
                    },
                    monitor: monitor,
                    del: false,
                }
            );
            console.log(
                'Archiving complete',
                archivePath,
            );
        } catch (err) {
            throw err;
        }
    }
})();
