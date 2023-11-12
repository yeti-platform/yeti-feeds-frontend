#  Container used to build the minified frontend JS code
FROM node:buster AS frontend-builder

RUN apt update && apt install python3
RUN npm install -g n && n 16

ADD . /app
WORKDIR /app

RUN npm run build

FROM nginx:latest AS frontend
COPY --from=frontend-builder /app/dist /www
EXPOSE 80
