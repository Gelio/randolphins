import type { UnsplashPhoto } from "@randolphins/api/src/photo";
import { type DeserializePhotoError, deserializePhoto } from "./serialization";

export async function retrievePhotosToUse({
  database,
  count,
}: {
  database: D1Database;
  count: number;
}): Promise<DeserializedPhotosAndErrors> {
  const deserializedPhotosAndErrors = await listLeastRecentlyUsedPhotos({
    database,
    count,
  });

  await updatePhotosUsedDate({
    database,
    photoUsedTimestamp: Date.now(),
    photoIDsToUpdate: deserializedPhotosAndErrors.photos.map(
      (photo) => photo.id,
    ),
  });

  return deserializedPhotosAndErrors;
}

interface DeserializedPhotosAndErrors {
  photos: UnsplashPhoto[];
  deserializationErrors: DeserializePhotoError[];
}

async function listLeastRecentlyUsedPhotos({
  database,
  count,
}: {
  database: D1Database;
  count: number;
}): Promise<DeserializedPhotosAndErrors> {
  const { results } = await database
    .prepare(
      `SELECT json FROM photos
         ORDER BY last_used_date ASC
         LIMIT ?`,
    )
    .bind(count)
    .all<{ json: string }>();

  const photos: UnsplashPhoto[] = [];
  const deserializationErrors: DeserializePhotoError[] = [];
  for (const result of results) {
    const deserializationResult = deserializePhoto(result.json);
    switch (deserializationResult.variant) {
      case "success":
        photos.push(deserializationResult.photo);
        break;
      case "error":
        deserializationErrors.push(deserializationResult.cause);
        break;
    }
  }

  return {
    photos,
    deserializationErrors,
  };
}

function updatePhotosUsedDate({
  database,
  photoIDsToUpdate,
  photoUsedTimestamp,
}: {
  database: D1Database;
  photoIDsToUpdate: string[];
  photoUsedTimestamp: number;
}): Promise<void> {
  const updateStatement = database.prepare(
    "UPDATE photos SET last_used_date = ?1 WHERE id = ?2",
  );

  return database
    .batch(
      photoIDsToUpdate.map((id) =>
        updateStatement.bind(photoUsedTimestamp, id),
      ),
    )
    .then(() => undefined);
}
