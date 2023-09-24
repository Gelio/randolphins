import { getRandomDolphinPhotosWithFallback } from "./get-photos";
import { parseQueryParams } from "./query-params";

export interface Env {
  UNSPLASH_ACCESS_KEY?: string;
  DB: D1Database;
}

export default {
  async fetch(request, env, _ctx): Promise<Response> {
    const queryParamsResult = parseQueryParams(request.url);
    if (queryParamsResult.variant === "error") {
      return Response.json(
        {
          errorMessage: "Invalid 'count' query parameter",
          cause: queryParamsResult.cause.message,
        },
        { status: 400, headers: corsHeaders },
      );
    }

    const { UNSPLASH_ACCESS_KEY } = env;

    if (UNSPLASH_ACCESS_KEY === undefined) {
      console.error("UNSPLASH_ACCESS_KEY secret is not provided.");
      return Response.json(
        { errorMessage: "Internal error" },
        { status: 500, headers: corsHeaders },
      );
    }

    const randomDolphinReturn = await getRandomDolphinPhotosWithFallback({
      photosCount: queryParamsResult.value.count,
      database: env.DB,
      unsplashAccessKey: UNSPLASH_ACCESS_KEY,
    });
    switch (randomDolphinReturn.variant) {
      case "success":
        return Response.json(randomDolphinReturn.photos, {
          headers: corsHeaders,
        });

      case "error":
        return Response.json(randomDolphinReturn.cause, {
          status: 500,
          headers: corsHeaders,
        });
    }
  },
} satisfies ExportedHandler<Env>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
};
