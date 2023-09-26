# Unsplash API proxy

A [Cloudflare Worker](https://workers.cloudflare.com/) that proxies requests to
Unsplash.

Its primary purpose is to keep the Unsplash API access key a secret.

The secondary purpose is to cache the images from Unsplash in a
[D1](https://developers.cloudflare.com/d1/) database, so the application keeps
working even if requests to Unsplash are rate-limited.

## Quick start

1. Copy `.dev.vars.template` to `.dev.vars`

   ```sh
   cp .dev.vars.template .dev.vars
   ```

1. Fill in the `UNSPLASH_ACCESS_TOKEN` in `.dev.vars`.

   Generate one at <https://unsplash.com/developers>.

1. Install dependencies

   ```sh
   npm install
   ```

1. Initialize the local D1 database

   ```sh
   npm run db-init:local
   ```

1. Due to [a bug in Nx](https://github.com/nrwl/nx/issues/19312), build the
   dependency project manually:

   ```sh
   npm run build -w @randolphins/api
   ```

1. Start the worker locally

   ```sh
   npm start
   ```

## Deploy to Cloudflare Workers

To deploy to Cloudflare Workers, run

```sh
npm run db-init:remote
npm run deploy
```
