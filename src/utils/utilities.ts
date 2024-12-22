import fs from 'node:fs';
import { join } from 'node:path';

import logger from './logger';

import type Coaster from '../models/Coaster';

enum Environments {
	Production = 'prod',
	Development = 'dev'
}

const getEnv = () => {
	return process.env.ENV === Environments.Production
		? Environments.Production
		: Environments.Development;
};

const ENCODING = 'utf-8';

const BASE_PATH = join(__dirname, '../../', `${getEnv()}_db`);

const isProd = getEnv() === Environments.Production;

const getFilePath = (id: string, addExt: boolean = true): string =>
	join(BASE_PATH, `${id}${addExt ? '.json' : ''}`);

const checkHoursAndMinutes = (value: string): boolean => {
	const [hour, minute] = value.split(':').map(Number);
	return (
		!(Number.isNaN(hour) || Number.isNaN(minute)) &&
		hour >= 0 &&
		hour <= 23 &&
		minute >= 0 &&
		minute <= 59
	);
};

const getFileContent = async (filePath: string): Promise<Coaster | null> => {
	let fileContent: string | null = null;
	try {
		fileContent = await fs.promises.readFile(filePath, ENCODING);
	} catch (error) {
		logger.error(`Error during accessing file ${filePath}`, error);
		return null;
	}

	if (fileContent === null) {
		return null;
	}

	try {
		return JSON.parse(fileContent);
	} catch (error) {
		logger.error(`Error during parsing file ${filePath}`, error);
		return null;
	}
};

const getChannel = () => ['coasters', getEnv(), 'channel'].join(':');

const pad = (num: number, size: number) => {
	let ret = num.toString();
	while (ret.length < size) {
		ret = `0${num}`;
	}
	return ret;
};

export {
	BASE_PATH,
	ENCODING,
	getEnv,
	isProd,
	getFilePath,
	checkHoursAndMinutes,
	getFileContent,
	getChannel,
	pad
};
