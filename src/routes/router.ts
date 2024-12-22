import express from 'express';

import pingRoutes from './ping';
import coastersRoutes from './coasters';
import wagonsRoutes from './wagons';

export default () => {
	const router = express.Router();

	router.use('/ping', pingRoutes);
    router.use('/api/coasters', coastersRoutes);
    router.use('/api/coasters', wagonsRoutes);
	router.use((_req, res) => {
        res.sendStatus(404);
	});

	return router;
};
