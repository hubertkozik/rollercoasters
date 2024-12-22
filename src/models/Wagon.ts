import { z } from 'zod';

const WagonSchema = z.object({
    id: z.string(),
    speed: z
        .number({
            required_error: 'Szybkość wagonu jest wymagana.',
            invalid_type_error: 'Szybkość wagonu musi być liczbą.'
        })
        .positive({
            message: 'Szybkość wagonu musi być większa niż 0.'
        }),
    seatsCount: z
        .number({
            required_error: 'Ilość miejsc jest wymagana.',
            invalid_type_error: 'Ilość miejsc musi być liczbą.'
        })
        .positive({
            message: 'Ilość miejsc musi być większa niż 0.'
        }),
});

type WagonType = z.infer<typeof WagonSchema>;

export default class Wagon implements WagonType {
    id: string;
    speed: number;
    seatsCount: number;

    constructor(wagon: Wagon) {
        this.id = wagon.id;
        this.speed = wagon.speed;
        this.seatsCount = wagon.seatsCount;
    }
}

export { WagonSchema };
