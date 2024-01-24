FROM node:buster

RUN apt update && apt install \
    python3 \
    git

ADD . /app
WORKDIR /app

EXPOSE 8080

COPY ./docker/docker-entrypoint.sh /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD [ "dev" ]
