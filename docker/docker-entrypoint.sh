#!/bin/bash
set -e

if [[ ! -z "${VUE_API_BACKEND}" ]]; then
  # this is the busybox version of sed
  sed -i s/localhost/${VUE_API_BACKEND}/ vue.config.js
fi

if [[ "$1" =~ "dev" ]]; then
    if [[ ! -f ".node_installed" ]]; then
      echo ".node_installed not found, installing node modules"
      rm -rf node_modules
      npm install
      touch .node_installed
    fi
    npm run serve
fi

if [[ "$1" =~ "dev3" ]]; then
    cd yeti-frontend
    if [[ ! -f ".node_installed" ]]; then
      echo ".node_installed not found, installing node modules"
      rm -rf node_modules
      npm install
      touch .node_installed
    fi
    npm run dev
fi

if [[ "$1" =~ "shell" ]]; then
    /bin/bash
fi

exec "$@"
