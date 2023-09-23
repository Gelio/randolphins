import type { UnsplashPhoto } from "@randolphins/api/src/photo";
import { deserializePhoto } from "./serialization";

export async function retrievePhotosToUse({
  database,
  count,
}: {
  database: D1Database;
  count: number;
}): Promise<UnsplashPhoto[]> {
  const photos = await listLeastRecentlyUsedPhotos({ database, count });

  await updatePhotosUsedDate({
    database,
    photoUsedTimestamp: Date.now(),
    photoIDsToUpdate: photos.map((photo) => photo.id),
  });

  return photos;
}

async function listLeastRecentlyUsedPhotos({
  database,
  count,
}: {
  database: D1Database;
  count: number;
}): Promise<UnsplashPhoto[]> {
  const { results } = await database
    .prepare(
      `SELECT json FROM photos
         ORDER BY last_used_date ASC
         LIMIT ?`,
    )
    .bind(count)
    .all<{ json: string }>();

  return results.map((result) => deserializePhoto(result.json));
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
