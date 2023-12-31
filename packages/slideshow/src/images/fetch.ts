import { photosSchema, type UnsplashPhoto } from "@randolphins/api";
import type { ZodError } from "zod";

export type FetchRandomDolphinUnsplashImagesError =
  | {
      type: "REACT_APP_UNSPLASH_PROXY_URL environment variable is not provided";
    }
  | { type: "network error"; cause: Error }
  | { type: "response is not ok"; response: Response }
  | { type: "JSON deserialization failed"; cause: Error }
  | { type: "parsing photos failed"; cause: ZodError<UnsplashPhoto[]> };

type FetchRandomDolphinUnsplashImagesResult =
  | {
      variant: "error";
      cause: FetchRandomDolphinUnsplashImagesError;
    }
  | { variant: "success"; photos: UnsplashPhoto[] }
  | { variant: "aborted" };

/**
 * Fetches random dolphin photos from Unsplash, using the unsplash-proxy.
 */
export async function fetchRandomDolphinUnsplashImages({
  count,
  abortSignal,
}: {
  count: number;
  abortSignal?: AbortSignal;
}): Promise<FetchRandomDolphinUnsplashImagesResult> {
  if (!process.env.REACT_APP_UNSPLASH_PROXY_URL) {
    return {
      variant: "error",
      cause: {
        type: "REACT_APP_UNSPLASH_PROXY_URL environment variable is not provided",
      },
    };
  }

  const unsplashProxyURL = new URL(process.env.REACT_APP_UNSPLASH_PROXY_URL);
  unsplashProxyURL.searchParams.set("count", count.toString());

  let response: Response;
  try {
    response = await fetch(unsplashProxyURL, {
      headers: {
        Accept: "application/json",
      },
      signal: abortSignal ?? null,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        variant: "aborted",
      };
    } else {
      return {
        variant: "error",
        cause: {
          type: "network error",
          cause: error as Error,
        },
      };
    }
  }

  if (!response.ok) {
    return {
      variant: "error",
      cause: {
        type: "response is not ok",
        response,
      },
    };
  }

  let body: object | undefined;
  try {
    body = await response.json();
  } catch (error) {
    return {
      variant: "error",
      cause: {
        type: "JSON deserialization failed",
        cause: error as Error,
      },
    };
  }

  const parsingResult = photosSchema.safeParse(body);
  if (!parsingResult.success) {
    return {
      variant: "error",
      cause: {
        type: "parsing photos failed",
        cause: parsingResult.error,
      },
    };
  }

  return {
    variant: "success",
    photos: parsingResult.data,
  };
}
