/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { fetchRandomDolphinPhotos } from "./unsplash-api";

export interface Env {
  UNSPLASH_ACCESS_KEY?: string;
}

export default {
  async fetch(
    _request: Request,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    const { UNSPLASH_ACCESS_KEY } = env;

    if (UNSPLASH_ACCESS_KEY === undefined) {
      console.error("UNSPLASH_ACCESS_KEY secret is not provided.");
      return Response.json({ errorMessage: "Internal error" }, { status: 500 });
    }

    const randomDolphinReturn = await fetchRandomDolphinPhotos({
      unsplashAccessKey: UNSPLASH_ACCESS_KEY,
      photosCount: 10,
    });

    switch (randomDolphinReturn.variant) {
      case "success":
        return Response.json(randomDolphinReturn.photos);

      case "error":
        return Response.json(randomDolphinReturn.cause, { status: 500 });
    }
  },
};
