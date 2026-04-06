# essentials

## Project setup

```
# yarn
yarn

# npm
npm install

# pnpm
pnpm install

# bun 
bun install
```

### Compiles and hot-reloads for development

```
# yarn
yarn dev

# npm
npm run dev

# pnpm
pnpm dev

# bun 
bun run dev
```

### Compiles and minifies for production

```
# yarn
yarn build

# npm
npm run build

# pnpm
pnpm build

# bun 
bun run build
```

### Lints and fixes files

```
# yarn
yarn lint

# npm
npm run lint

# pnpm
pnpm lint

# bun 
bun run lint
```

### End-to-End Testing (Playwright)

#### Run tests in the Docker container (Recommended)
If you are using the Yeti Docker development environment, ensure your frontend container (`dev-frontend-1`) is running and execute:

```bash
docker exec dev-frontend-1 npm run test:e2e
```

#### Run tests locally
Install Playwright and its dependencies first:

```bash
npx playwright install --with-deps
npm run test:e2e
```

To run tests with the interactive UI:
```bash
npm run test:e2e-ui
```

### Customize configuration

See [Configuration Reference](https://vitejs.dev/config/).
