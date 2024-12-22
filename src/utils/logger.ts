import pino from 'pino';
import fs from 'node:fs';
import { join } from 'node:path';
import { getEnv, isProd } from '../utils/utilities';

const logsDir = join(__dirname, '../../', `${getEnv()}_logs`);
console.log(logsDir);
fs.mkdirSync(logsDir, { recursive: true });

const targets = [
	//{
	//	target: 'pino-pretty',
	//	options: {},
	//	level: 'error'
	//},
	{
		target: 'pino/file',
		options: { destination: join(logsDir, 'error.log') },
		level: 'error'
	},
	//{
	//	target: 'pino-pretty',
	//	options: {},
	//	level: 'warn'
	//},
	{
		target: 'pino/file',
		options: { destination: join(logsDir, 'warn.log') },
		level: 'warn'
	}
];

 if (!isProd) {
	targets.push(
		//{
		//	target: 'pino-pretty',
		//	options: {},
		//	level: 'info'
		//},
		{
			target: 'pino/file',
			options: { destination: join(logsDir, 'info.log') },
			level: 'info'
		}
	);
 }

// Configure pino logger
const logger = pino({
	level: 'info',
	transport: { targets }
});

export default logger;
