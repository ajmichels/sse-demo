FROM node:latest

ENV CI=true

WORKDIR /usr/src
COPY ./ /usr/src
RUN rm ./pnpm-lock.yaml ./package.json

RUN npm install -g --force corepack

COPY ./pnpm-lock.yaml /usr/src
COPY ./package.json /usr/src
RUN pnpm install

EXPOSE 3000 9229

CMD [ "pnpm", "serve" ]
