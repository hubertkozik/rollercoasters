import express from 'express';
import type { Request, Response } from 'express';
import { nanoid } from 'nanoid';

import logger from '../utils/logger';
import Redis, { Message_Types } from '../utils/Redis';
import { getFileContent, getFilePath } from '../utils/utilities';

import Coaster, { CoasterSchema } from '../models/Coaster';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
	const data = {
			id: nanoid(),
			staffTotal: req.body.liczba_personelu,
			clientsTotal: req.body.liczba_klientow,
			routeLength: req.body.dl_trasy,
			openingTime: req.body.godziny_od,
			closingTime: req.body.godziny_do,
			wagons: []
		},
		result = CoasterSchema.safeParse(data);

	if (result.success) {
		const coaster = new Coaster(data),
			saveResult = await coaster.save();

		if (saveResult) {
            new Redis('Redis publisher').publishMessage({
				data: coaster,
				action: Message_Types.Create_Coaster
			});
			return res.status(201).send({ id: coaster.id });
		}
	}

	logger.error(result.error);
	return res
		.status(400)
		.send({ errorMessages: result.error?.issues.map((el) => el.message) });
});

router.put('/:coasterId', async (req: Request, res: Response) => {
	const coasterData = await getFileContent(getFilePath(req.params.coasterId));

	if (!coasterData) {
		return res
			.status(404)
			.send({ errorMessages: ['Taka kolejka nie istnieje.'] });
	}

	const data = {
			id: coasterData.id,
			staffTotal: req.body.liczba_personelu,
			clientsTotal: req.body.liczba_klientow,
			routeLength: coasterData.routeLength,
			openingTime: req.body.godziny_od,
			closingTime: req.body.godziny_do,
			wagons: coasterData.wagons
		},
		result = CoasterSchema.safeParse(data);

	if (result.success) {
		const coaster = new Coaster(data),
			saveResult = await coaster.save();

		if (saveResult) {
            new Redis('Redis pubslisher').publishMessage({
				data: coaster,
				action: Message_Types.Update_Coaster
			});
			return res.sendStatus(200);
		}
	}

	logger.error(result.error);
	return res
		.status(400)
		.send({ errorMessages: result.error?.issues.map((el) => el.message) });
});

export default router;
