#  Container used to build the minified frontend JS code
#
# Pinned to the Node major CI actually tests (24). The previous `node:bullseye`
# tracked the newest Node release regardless of major, so production bundles
# were being built with Node 26 while no workflow exercised anything past 24 --
# and on Debian 11, three releases behind the image this produces. Both tags
# here pin the major and the distribution while still floating the patch
# release, so security updates arrive without a silent major upgrade.
FROM node:24-trixie-slim AS frontend-builder

ADD . /app
WORKDIR /app

RUN npm install
RUN npm run build

FROM nginx:1.31-trixie AS frontend
COPY --from=frontend-builder /app/dist /www
EXPOSE 80
