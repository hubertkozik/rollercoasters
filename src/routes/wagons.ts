import express from 'express';
import type { Request, Response } from 'express';
import { nanoid } from 'nanoid';

import { getFileContent, getFilePath } from '../utils/utilities';

import logger from '../utils/logger';
import Redis, { Message_Types } from '../utils/Redis';

import Wagon, { WagonSchema } from '../models/Wagon';
import Coaster from '../models/Coaster';

const router = express.Router();

router.post('/:coasterId/wagons', async (req: Request, res: Response) => {
	const coasterData = await getFileContent(getFilePath(req.params.coasterId));

	if (!coasterData) {
		return res
			.status(404)
			.send({ errorMessages: ['Taka kolejka nie istnieje.'] });
	}

	const data = {
			id: nanoid(),
			speed: req.body.predkosc_wagonu,
			seatsCount: req.body.ilosc_miejsc
		},
		result = WagonSchema.safeParse(data);

	if (result.success) {
		const wagon = new Wagon(data);
		coasterData.wagons.push(wagon);

		const coaster = new Coaster(coasterData),
			saveResult = await coaster.save();

		if (saveResult) {
            new Redis('Redis publisher').publishMessage({
				data: coaster,
				action: Message_Types.Update_Coaster
			});
			return res.status(201).send({ id: wagon.id });
		}
	}

	logger.error(result.error);
	return res
		.status(400)
		.send({ errorMessages: result.error?.issues.map((el) => el.message) });
});

router.delete(
	'/:coasterId/wagons/:wagonId',
	async (req: Request, res: Response) => {
		const coasterData = await getFileContent(getFilePath(req.params.coasterId));

		if (!coasterData) {
			return res
				.status(404)
				.send({ errorMessages: ['Taka kolejka nie istnieje.'] });
		}

		const wagonIndex = coasterData.wagons.findIndex(
			(wagon) => wagon.id === req.params.wagonId
		);

		if (wagonIndex === -1) {
			return res
				.status(404)
				.send({ errorMessages: ['Taki wagon nie istnieje w tej kolejce.'] });
		}

		coasterData.wagons.splice(wagonIndex, 1);

		const coaster = new Coaster(coasterData),
			saveResult = await coaster.save();

		if (saveResult) {
            new Redis('Redis publisher').publishMessage({
				data: coaster,
				action: Message_Types.Update_Coaster
			});
			return res.sendStatus(200);
		}
	}
);

export default router;
