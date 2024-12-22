FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install -g pnpm
RUN pnpm install

COPY . .

RUN pnpm build

EXPOSE ${PORT}

CMD ["pnpm", "start"]
