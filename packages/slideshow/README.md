# Slideshow app

A slideshow of random dolphin images from [Unsplash](https://unsplash.com/).

Uses [`unsplash-proxy`](../unsplash-proxy) to fetch the images.

## Quick start

1. Start `unsplash-proxy` locally. See [its
   README.md](../unsplash-proxy/README.md) for instructions.

1. Install the dependencies

   ```sh
   npm install
   ```

1. Due to [a bug in Nx](https://github.com/nrwl/nx/issues/19312), build the dependency project manually:

   ```sh
   npm run build -w @randolphins/api
   ```

1. Start the development server

   ```sh
   npm run start
   ```

## Deployment

1. Deploy `unsplash-proxy` first.

   The instructions are in [its README.md](../unsplash-proxy/README.md).

1. Create a `.env.production.local` file and add:

   ```sh
   REACT_APP_UNSPLASH_PROXY_URL=<url of the deployed unsplash-proxy>
   ```

1. Due to [a bug in Nx](https://github.com/nrwl/nx/issues/19312), build the dependency project manually:

   ```sh
   npm run build -w @randolphins/api
   ```

1. Build the application

   ```sh
   npm run build
   ```

   The built application is in the `./build` directory.

1. Copy the built application to the server so requests are routed to `index.html`.
