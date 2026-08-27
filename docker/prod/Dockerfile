#  Container used to build the minified frontend JS code
#
# Both tags pin a major version and a distribution while floating the patch
# release, so security updates arrive without a major upgrade landing
# unannounced. Node is held at a major that .github/workflows/build.yaml
# exercises.
FROM node:24-trixie-slim AS frontend-builder

ADD . /app
WORKDIR /app

RUN npm install
RUN npm run build

FROM nginx:1.31-trixie AS frontend
COPY --from=frontend-builder /app/dist /www
EXPOSE 80
