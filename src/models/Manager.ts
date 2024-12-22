import fs from 'node:fs';

import { BASE_PATH, getFileContent, getFilePath, pad } from '../utils/utilities';
import logger from '../utils/logger';

import Coaster from './Coaster';
import type Redis from '../utils/Redis';

export default class Manager {
	coasters: Coaster[] = [];
    checkInterval: ReturnType<typeof setInterval>;

    constructor(redlockInstance: Redis) {
        this.checkInterval = setInterval(async () => {
            if (!redlockInstance.isMaster) {
                return;
            }

            await this.getCoasters();

            const date = new Date(),
                hour = pad(date.getHours(), 1),
                minute = pad(date.getMinutes(), 1),
                timeMessage = `[Godzina ${hour}:${minute}]\n\n`;

            const messages: string[] = [];

            [...this.coasters].sort((a, b) => a.id.localeCompare(b.id)).forEach((coaster) => {
                messages.push(coaster.getStatusMessage(), '\n\n');
            });

            // biome-ignore lint/suspicious/noConsole: System Design
            console.clear();

            if (messages.length === 0) {
                messages.push('Brak kolejek do wyświetlenia');
            }

            messages.unshift(timeMessage);

            // biome-ignore lint/suspicious/noConsole: System Design
            // biome-ignore lint/suspicious/noConsoleLog: System Design
            console.log(...messages);
        }, 1000);
    }

	async getCoasters() {
		try {
			fs.readdir(BASE_PATH, (_err, files) => {
                this.coasters.length = 0;
				files.forEach(async (file) => {
					const coasterData = await getFileContent(getFilePath(file, false));

					if (coasterData) {
						this.coasters.push(new Coaster(coasterData));
					}
				});
			});
		} catch (err) {
			logger.error(`Error reading folder ${BASE_PATH}`, err);
			return [];
		}
	}
}
