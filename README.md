# Rollercoasters API system

This system is an API Project for “Roller Coaster System”.

### Built with

TypeScript | Node.js | Express.js | Redis | Zod | Pino

## Requirements

-   Docker
-   Node.js 22.x
-   Redis

## Instalatation

1. Clone the repo:
   ```sh
   git clone https://github.com/hubertkozik/rollercoasters.git
   ```
2. Go into the folder:
    ```sh
    cd rollercoasters
    ```
3. Create two environment files:
* `.env.dev`
    ```sh
    PORT=3050
    ENV=dev
    REDIS_HOST=localhost
    REDIS_PORT=6379
    ```
* `env.prod`
    ```sh
    PORT=3051
    ENV=prod
    REDIS_HOST=localhost
    REDIS_PORT=6379
    ```
4. Install packages:
    ```sh
    #npm
    npm i
    
    #pnpm
    pnpm i
    ```

### Development

```sh
#npm
npm run dev

#pnpm
pnpm dev
```

### Build

```sh
#npm
npm run build

#pnpm
pnpm build
```

### Docker
Use Docker Compose to manage production and development environments. Ensure the `.env` files are correctly configured before executing the following command.

Production Port: `3051`
Development Port: `3050`

```sh
docker compose up
```

## API Documentation

- Ping

**GET** `/api/ping`

Check if the API server is operational.

`Request` example:
```sh
localhost:3050/api/ping
```

`Response` example:
```sh
200 OK
pong
```

- Create a new coaster

**POST** `/api/coasters`

Create a new roller coaster with specified parameters.

`Request`:
```sh
localhost:3050/api/coaster
```
`Request body` example:
```sh
{ 
    "liczba_personelu": 16,
    "liczba_klientow": 60000,
    "dl_trasy": 18000,
    "godziny_od": "8:00",
    "godziny_do": "16:00"
}
```

`Response` example:
```sh
201 Created
{
    "id": "deuHCba_En9nNtSymj6sx"
}
```

- Update an existing coaster

**PUT** `/api/coasters/:coasterId`

Modify an existing roller coaster's parameters.

`Request` example:
```sh
localhost:3050/api/coasters/deuHCba_En9nNtSymj6sx
```
`Request body` example:
```sh
{ 
    "liczba_personelu": 12,
    "liczba_klientow": 3000,
    "godziny_od": "10:00",
    "godziny_do": "18:00"
}
```

`Response` example:
```sh
200 OK
```

- Add a wagon to an existing coaster

**POST** `/api/coasters/:coasterId/wagons`

Add a new wagon to an existing roller coaster.

`Request` example:
```sh
localhost:3050/api/coasters/deuHCba_En9nNtSymj6sx/wagons
```
`Request body` example:
```sh
{
    "ilosc_miejsc": 64,
    "predkosc_wagonu": 10.2
}
```

`Response`:
```sh
201 Created
{
    "id": "G5_TriARPCCYVPxV8hKkm"
}
```

- Add a wagon to an existing coaster

**DELETE** `/api/coasters/:coasterId/wagons/:wagonId`

Remove a specific wagon from a specific roller coaster.

`Request` example:
```sh
localhost:3050/api/coasters/deuHCba_En9nNtSymj6sx/wagons/G5_TriARPCCYVPxV8hKkm
```

`Response` example:
```sh
200 OK
```

## Data Specifications

### API Parameters

| Parameter | Description | Unit |
|-----------|-------------|------|
| liczba_personelu | Number of staff members managing the coaster | People |
| liczba_klientow | Daily client capacity | People |
| dl_trasy | Track length | Meters |
| godziny_od | Start of operations | 24-hour format |
| godziny_do | End of operations | 24-hour format |
| ilosc_miejsc | Wagon capacity | Seats |
| predkosc_wagonu | Wagon velocity | Meters/second |

### URL Path Parameters

| Parameter | Description |
|-----------|-------------|
| coasterId | Unique identifier for a roller coaster |
| wagonId | Unique identifier for a wagon |
