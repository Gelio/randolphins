# Unsplash API proxy

A Cloudflare Worker that proxies requests to Unsplash.

Its primary purpose is to keep the Unsplash API access key a secret.

## Quick start

1. Copy `.dev.vars.template` to `.dev.vars`

   ```sh
   cp .dev.vars.template .dev.vars
   ```

2. Fill in the `UNSPLASH_ACCESS_TOKEN` in `.dev.vars`.

   Generate one at <https://unsplash.com/developers>.

3. Install dependencies

   ```sh
   npm install
   ```

4. Start the worker locally

   ```sh
   npm start
   ```

## Deploy to Cloudflare Workers

To deploy to Cloudflare Workers, run

```sh
npm run deploy
```
