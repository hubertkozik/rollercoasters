import express from 'express'
import type { Request, Response } from 'express';

const router = express.Router();

router.get('/', (_req: Request, res: Response) => {
    res.status(200).send('pong');
});

export default router;
