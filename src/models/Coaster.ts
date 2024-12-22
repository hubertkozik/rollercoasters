import fs from 'node:fs';
import { dirname } from 'node:path';
import { z } from 'zod';

import logger from '../utils/logger';
import {
	ENCODING,
	checkHoursAndMinutes,
	getFilePath
} from '../utils/utilities';

import type Wagon from './Wagon';
import { WagonSchema } from './Wagon';

const CoasterSchema = z
	.object({
		id: z.string(),
		staffTotal: z
			.number({
				required_error: 'Liczba personelu jest wymagana.',
				invalid_type_error: 'Liczba personelu musi być liczbą.'
			})
			.positive({
				message: 'Liczba personelu musi być większa niż 0.'
			}),
		clientsTotal: z
			.number({
				required_error: 'Liczba klientów jest wymagana.',
				invalid_type_error: 'Liczba klientów musi być liczbą.'
			})
			.positive({
				message: 'Liczba klientów musi być większa niż 0.'
			}),
		routeLength: z
			.number({
				required_error: 'Długość drogi jest wymagana.',
				invalid_type_error: 'Długość drogi musi być liczbą.'
			})
			.positive({
				message: 'Długość drogi musi być większa niż 0.'
			}),
		openingTime: z
			.string({
				required_error: 'Godzina otwarcia jest wymaga.',
				invalid_type_error:
					'Godzina otwarcia musi być tekstem, w 24h formacie (HH:mm).'
			})
			.refine(checkHoursAndMinutes, {
				message:
					'Godzina otwarcia musi być większa niż 00:00 i mniejsza niż 23:59.'
			}),
		closingTime: z
			.string({
				required_error: 'Godzina zamknięcia jest wymaga.',
				invalid_type_error:
					'Godzina zamknięcia musi być tekstem, w 24h formacie (HH:mm).'
			})
			.refine(checkHoursAndMinutes, {
				message:
					'Godzina zamknięcia musi być większa niż 00:00 i mniejsza niż 23:59.'
			}),
		wagons: z.array(WagonSchema)
	})
	.refine(
		(schema): boolean => {
			const [openingHour, openingMinute] = schema.openingTime
					.split(':')
					.map(Number),
				[closingHour, closingMinute] = schema.closingTime
					.split(':')
					.map(Number);

			return (
				![openingHour, openingMinute, closingHour, closingMinute].some(
					Number.isNaN
				) &&
				(openingHour < closingHour ||
					(openingHour === closingHour && openingMinute < closingMinute))
			);
		},
		{
			message: 'Godzina otwarcia musi być mniejsza niż godzina zamknięcia.'
		}
	);

type CoasterType = z.infer<typeof CoasterSchema>;

export default class Coaster implements CoasterType {
	id: CoasterType['id'];
	staffTotal: CoasterType['staffTotal'];
	staffRequired: number;
	clientsTotal: CoasterType['clientsTotal'];
	routeLength: CoasterType['routeLength'];
	openingTime: CoasterType['openingTime'];
	closingTime: CoasterType['closingTime'];
	workingTime: number;
	wagons: CoasterType['wagons'];
	wagonsCapacity: number;

	constructor(coaster: CoasterType) {
		this.id = coaster.id;
		this.staffTotal = coaster.staffTotal;
		this.clientsTotal = coaster.clientsTotal;
		this.routeLength = coaster.routeLength;
		this.openingTime = coaster.openingTime;
		this.closingTime = coaster.closingTime;
		this.workingTime = this.getWorkingTime();
		this.wagons = coaster.wagons;
		this.staffRequired = this.getStaffRequired();
		this.wagonsCapacity = this.getWagonsCapacity();
	}

	async save(): Promise<boolean> {
		const filePath = getFilePath(this.id);

		try {
			fs.mkdirSync(dirname(filePath), { recursive: true });
			await fs.promises.writeFile(filePath, JSON.stringify(this), ENCODING);
			return true;
		} catch (error) {
			logger.error(`Error during accessing file ${filePath}`, error);
		}

		return false;
	}

	getStaffRequired() {
		const staffInit = 1;
		return staffInit + this.wagons.length * 2;
	}

	getWorkingTime() {
		const [openHour, openMin] = this.openingTime.split(':').map(Number),
			[closeHour, closeMin] = this.closingTime.split(':').map(Number);

		return 60 * (closeHour - openHour) + closeMin - openMin;
	}

	getWagonsCapacity() {
		return this.wagons.reduce((total, wagon) => {
			const rideTime = Math.floor(this.routeLength / wagon.speed / 60) + 5,
                maxRides = Math.floor(this.workingTime / rideTime);
			return total + maxRides * wagon.seatsCount;
		}, 0);
	}

	getStatusMessage() {
		const status = [this.getStaffStatus(), this.getCoasterStatus()];
		const header = `[Kolejka ${this.id}]\n\n`,
			desc = [
				`Godziny działania: ${this.openingTime} - ${this.closingTime}`,
				`Liczba wagonów: ${this.wagons.length}`,
				`Dostępny personel: ${this.staffTotal}/${this.staffRequired}`,
				`Klienci dziennie: ${this.clientsTotal}`,
				`Status: ${status.length === 0 ? 'OK' : `\n\t\t${status.join('\n\t\t')}`}`
			],
			message = header + desc.map((el, i) => `\t ${i + 1}. ${el}`).join('\n');

		return message;
	}

	getStaffStatus() {
		const staffDiff = this.staffRequired - this.staffTotal;

		if (staffDiff === 0) {
			return null;
		}

		const isExcess = staffDiff < 0,
			absCount = Math.abs(staffDiff),
			message = isExcess ? 'Za dużo' : 'Brakuje',
			workers = absCount === 1 ? 'pracownika' : 'pracowników';

		return `${message} ${absCount} ${workers}.`;
	}

	getCoasterStatus() {
		const capacityDiff = this.clientsTotal - this.wagonsCapacity;

		if (capacityDiff > 0) {
			return `Jest o ${capacityDiff} za mało miejsc w wagonach.`;
		}

		if (this.wagonsCapacity >= this.clientsTotal * 2) {
			return 'Nadmiarowa liczba miejsc w wagonach oraz nadmiarowa liczba pracowników.';
		}

		return null;
	}
}

export { CoasterSchema };
