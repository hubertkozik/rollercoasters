import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import pinoHttp from 'pino-http';

import logger from './utils/logger';
import zod from './utils/zod';

import router from './routes/router';
import { getEnv } from './utils/utilities';
import Redis from './utils/Redis';
import Manager from './models/Manager';

dotenv.config({
	path: `.env.${getEnv()}`
});

(async () => {
	const app = express(),
		port = process.env.PORT || 3000;

	app.use(cors());
	app.use(express.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());
	app.use(pinoHttp({ logger }));
	app.use(zod);
	app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
		const method = req.method,
			path = req.originalUrl.split('?')[0];

		logger.error(`${method} ${path} ${err.message}`);
		res.sendStatus(500);
	});
	app.use(router());

	try {
        await new Redis('Redis receiver').initReceiver();
        const redlockInstance = new Redis('Redlock');
        await redlockInstance.masterLock();
        await new Manager(redlockInstance).getCoasters();

		app.listen(port, () => {
			logger.info(`Server is running on port ${port}`);
		});
	} catch (err) {
		logger.error(err);
	}
})();
