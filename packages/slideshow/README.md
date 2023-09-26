# Slideshow app

A slideshow of random dolphin images from [Unsplash](https://unsplash.com/).

It offers the forward/rewind feature to control the direction of the slideshow,
and pause/resume buttons. It holds up to 5 photos in playback history.

State management is done using [XState](https://xstate.js.org/).

Uses [`unsplash-proxy`](../unsplash-proxy) to fetch the images to keep the
Unsplash API access token hidden, and to cache some API requests in case
requests to Unsplash are rate-limited.

## Quick start

1. Start `unsplash-proxy` locally. See
   [its README.md](../unsplash-proxy/README.md#quick-start) for instructions.

1. Install the dependencies

   ```sh
   npm install
   ```

1. Due to [a bug in Nx](https://github.com/nrwl/nx/issues/19312), build the
   dependency project manually:

   ```sh
   npm run build -w @randolphins/api
   ```

1. Start the development server

   ```sh
   npm run start
   ```

   It assumes you are running the [unsplash-proxy](../unsplash-proxy) locally.
   Steps to start it in development mode are in
   [its README](../unsplash-proxy/README.md#quick-start).

## Deployment

1. Deploy `unsplash-proxy` first.

   The instructions are in
   [its README.md](../unsplash-proxy/README.md#deploy-to-cloudflare-workers).

1. Create a `.env.production.local` file and add:

   ```sh
   REACT_APP_UNSPLASH_PROXY_URL=<url of the deployed unsplash-proxy>
   ```

1. Due to [a bug in Nx](https://github.com/nrwl/nx/issues/19312), build the
   dependency project manually:

   ```sh
   npm run build -w @randolphins/api
   ```

1. Build the application

   ```sh
   npm run build
   ```

   The built application is in the `./build` directory.

1. Copy the built application to the server so requests are routed to
   `index.html`.

## Running tests

Run

```sh
npm run test
```
