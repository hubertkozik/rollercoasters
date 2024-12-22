import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export default function zodMiddleware(
	err: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction
): void {
	if (err instanceof z.ZodError) {
		res.status(400).json({
			error: err.flatten()
		});
		return;
	}

    if (err instanceof Error) {
		const error = err as Error & { statusCode?: number };
		res.status(error.statusCode ?? 400).json({
			message: err.message
		});
		return;
	}
	res.sendStatus(500);
}
