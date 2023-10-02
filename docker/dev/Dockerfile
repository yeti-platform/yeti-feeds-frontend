FROM node:buster

RUN apt update && apt install \
    python3 \
    git

RUN npm install -g n && n 16

ADD . /app
WORKDIR /app

EXPOSE 8080

COPY ./docker/docker-entrypoint.sh /

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD [ "dev" ]
