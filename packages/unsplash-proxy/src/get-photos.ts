import type { UnsplashPhoto } from "@randolphins/api";
import {
  fetchRandomDolphinPhotos,
  maxPhotosCount,
  type RandomDolphinPhotosFetchingError,
} from "./unsplash-api";
import { persistPhotos, retrievePhotosToUse } from "./storage";
import type { PhotoToPersist } from "./storage/persist-photos";

export type RandomDolphinPhotosWithFallbackReturn =
  | { variant: "success"; photos: UnsplashPhoto[] }
  | {
      variant: "error";
      cause: RandomDolphinPhotosFetchingError;
    };

/**
 * Returns up to {@link photosCount} random photos of dolphins.
 *
 * Tries to fetch new photos from Unsplash first.
 * If that does not work, retrieves cached photos from the database.
 */
export async function getRandomDolphinPhotosWithFallback({
  unsplashAccessKey,
  photosCount,
  database,
}: {
  unsplashAccessKey: string;
  photosCount: number;
  database: D1Database;
}): Promise<RandomDolphinPhotosWithFallbackReturn> {
  const result = await fetchRandomDolphinPhotos({
    unsplashAccessKey,
    // NOTE: always ask for the maximum number of photos to cache as many
    // photos as possible. This way the database includes more photos
    // for moments when the Unsplash API is unavailable
    // or the request limit is reached.
    photosCount: maxPhotosCount,
  });

  if (result.variant === "success") {
    console.log(`Received ${result.photos.length} photos from Unsplash`);
    const photosToReturn = result.photos.slice(0, photosCount);
    const photosToSaveForLater = result.photos.slice(photosCount);
    const currentTimestamp = Date.now();

    await persistPhotos({
      database,
      photosToPersist: [
        ...photosToReturn.map(
          (photo): PhotoToPersist => ({
            photo,
            lastUsedTimestamp: currentTimestamp,
          }),
        ),
        ...photosToSaveForLater.map(
          (photo): PhotoToPersist => ({
            photo,
            lastUsedTimestamp: 0,
          }),
        ),
      ],
    });
    console.log(`${photosToReturn.length} will be used in the response`);
    console.log(
      `${photosToSaveForLater.length} have been saved in the database for later`,
    );

    return {
      variant: "success",
      photos: photosToReturn,
    };
  } else {
    console.error("Failed to fetch photos from Unsplash", result.cause);

    const { photos, deserializationErrors } = await retrievePhotosToUse({
      database,
      count: photosCount,
    });
    if (deserializationErrors.length > 0) {
      console.error(
        `Encountered ${deserializationErrors.length} deserialization errors when retrieving photos from the database`,
        deserializationErrors,
      );
    }

    if (photos.length === 0) {
      console.log("No photos in the database. Responding with an error");
      return {
        variant: "error",
        cause: result.cause,
      };
    } else {
      console.log(
        `Retrieved ${photos.length} from the database. Returning them`,
      );
      return {
        variant: "success",
        photos,
      };
    }
  }
}
