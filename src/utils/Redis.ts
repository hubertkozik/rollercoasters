import IoRedis from 'ioredis';
import Redlock from 'redlock';
import logger from './logger';

import { getChannel, getEnv } from './utilities';

import Coaster from '../models/Coaster';

enum Message_Types {
	Create_Coaster = 'CREATE_COASTER',
	Update_Coaster = 'UPDATE_COASTER'
}

export { Message_Types };

export default class Redis {
    instanceName: string = 'Redis';
	client: IoRedis | null = null;
	redlock: Redlock | null = null;
	lockKey: string = `${getEnv()}-coasters-master`;
	TTL: number = 10000;
	isMaster: boolean = false;
	renewalInterval: ReturnType<typeof setInterval> | null = null;

	constructor(instanceName?: string) {
		const host = process.env.REDIS_HOST,
			port = Number.parseInt(process.env.REDIS_PORT || '');

		if (!(host && port)) {
			logger.error('Redis host or port not found');
			return;
		}

		this.client = new IoRedis({
			host,
			port
		});

        if (instanceName) {
            this.instanceName = instanceName;
        }

		this.client.on('error', (err) => {
			logger.error(`${this.instanceName} error.`, err);
		});

		this.client.on('connect', () => {
			logger.info(`${this.instanceName} connected.`);
		});

		process.on('SIGINT', async () => {
			if (!this.client) {
				logger.error('No redis client.');
				return;
			}

			if (this.isMaster && this.renewalInterval) {
				clearInterval(this.renewalInterval);
				await this.client.del(this.lockKey);
			}

			process.exit(0);
		});
	}

	async initReceiver() {
		if (!this.client) {
			throw new Error('No redis client.');
		}

		const channelName = getChannel();

		this.client.on('message', (channel, message) => {
			if (channel === channelName) {
				try {
					const { data, action } = JSON.parse(message);

					if (
						[
							Message_Types.Create_Coaster,
							Message_Types.Update_Coaster
						].includes(action)
					) {
						new Coaster(data).save();
					} else {
						logger.warn(`Received unknown message: ${action}`);
					}
				} catch (err) {
					logger.error(err);
				}
			}
		});

		this.client.subscribe(channelName, (err) => {
			if (err) {
				logger.error(err);
			}
		});
	}

	async publishMessage({
		data,
		action
	}: {
		data: object;
		action: Message_Types;
	}) {
		if (!this.client) {
			throw new Error('No redis client.');
		}

		await this.client.publish(getChannel(), JSON.stringify({ data, action }));
	}

	async masterLock() {
		if (!this.client) {
			throw new Error('No redis client.');
		}

		if (!this.redlock) {
			this.redlock = new Redlock([this.client], {
				retryCount: 10,
				retryDelay: 200,
				retryJitter: 200
			});
		}

		if (!this.redlock) {
			throw new Error('Redlock not initialized');
		}

		try {
			let lock = await this.redlock.acquire([this.lockKey], this.TTL);
			this.isMaster = true;
			logger.info('This server is now master.');

			this.renewalInterval = setInterval(async () => {
				try {
					lock = await lock.extend(this.TTL);
				} catch (_err) {
					if (this.renewalInterval) {
						clearInterval(this.renewalInterval);
					}
					this.isMaster = false;
					this.masterLock();
				}
			}, this.TTL / 2);
		} catch (_err) {
			this.isMaster = false;
			setTimeout(this.masterLock.bind(this), this.TTL / 5);
		}
	}
}

