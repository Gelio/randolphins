import { type UnsplashPhoto, photosSchema } from "@randolphins/api/src/photo";
import { unsplashHeaders } from "./headers";

const unsplashAPIOrigin = "https://api.unsplash.com/";

export type RandomDolphinPhotosReturn =
  | { variant: "success"; photos: UnsplashPhoto[] }
  | {
      variant: "error";
      cause:
        | {
            variant: "could not fetch photos";
            cause: "API rate limit reached" | "unknown";
          }
        | {
            variant:
              | "invalid JSON response"
              | "response body validation failed";
          };
    };

export async function fetchRandomDolphinPhotos({
  unsplashAccessKey,
  photosCount,
}: {
  unsplashAccessKey: string;
  photosCount: number;
}): Promise<RandomDolphinPhotosReturn> {
  /**
   * @see https://unsplash.com/documentation#get-a-random-photo
   */
  const randomDolphinPhotosURL = new URL("/photos/random", unsplashAPIOrigin);
  randomDolphinPhotosURL.searchParams.set("query", "dolphin");
  randomDolphinPhotosURL.searchParams.set("count", photosCount.toString());

  const headers = new Headers({
    [unsplashHeaders.acceptVersion]: "v1",
    Accept: "application/json",
    Authorization: `Client-ID ${unsplashAccessKey}`,
  });

  const response = await fetch(randomDolphinPhotosURL.toString(), {
    headers,
    method: "GET",
  });

  console.log("Response from Unsplash", {
    status: response.status,
    rateLimitRemaining: response.headers.get(
      unsplashHeaders.rateLimitRemaining,
    ),
    headers: Object.fromEntries(response.headers.entries()),
  });

  if (!response.ok) {
    return {
      variant: "error",
      cause: {
        variant: "could not fetch photos",
        cause: isRateLimitReached(response)
          ? "API rate limit reached"
          : "unknown",
      },
    };
  }

  if (!response.headers.get("Content-Type")?.includes("application/json")) {
    return {
      variant: "error",
      cause: { variant: "invalid JSON response" },
    };
  }

  const responseBody = await response.json();

  const photosValidationResult = photosSchema.safeParse(responseBody);
  if (photosValidationResult.success) {
    return {
      variant: "success",
      photos: photosValidationResult.data,
    };
  } else {
    console.error(
      "Unsplash API response body does not match the photo schema",
      photosValidationResult.error,
    );
    return {
      variant: "error",
      cause: {
        variant: "response body validation failed",
      },
    };
  }
}

function isRateLimitReached(response: Response) {
  return (
    response.status === 403 &&
    response.headers.get(unsplashHeaders.rateLimitRemaining) === "0"
  );
}
