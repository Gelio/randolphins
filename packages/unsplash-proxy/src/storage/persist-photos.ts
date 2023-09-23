import type { UnsplashPhoto } from "@randolphins/api";
import { serializePhoto } from "./serialization";

export interface PhotoToPersist {
  photo: UnsplashPhoto;
  lastUsedTimestamp: number;
}

export async function persistPhotos({
  photosToPersist,
  database,
}: {
  photosToPersist: PhotoToPersist[];
  database: D1Database;
}): Promise<void> {
  // NOTE: only insert photos that do not exist in the database already.
  // Otherwise, the unique constraint is broken.
  // For existing photos, only update them.
  // Too bad there is no UPSERT.
  const duplicatePhotoIDs = await database
    .prepare(
      `SELECT id FROM photos WHERE id IN (${Array.from({
        length: photosToPersist.length,
      })
        .fill("?")
        .join(", ")});`,
    )
    .bind(...photosToPersist.map(({ photo }) => photo.id))
    .all<{ id: string }>();
  const duplicatePhotoIDsSet = new Set(
    duplicatePhotoIDs.results.map(({ id }) => id),
  );

  const insertStatement = database.prepare(
    "INSERT INTO photos (id, json, last_used_date) VALUES (?1, ?2, ?3)",
  );
  const updateStatement = database.prepare(
    "UPDATE photos SET last_used_date = ?, json = ? WHERE id = ?;",
  );

  const photoInsertStatements = photosToPersist.map(
    ({ photo, lastUsedTimestamp }) =>
      duplicatePhotoIDsSet.has(photo.id)
        ? updateStatement.bind(
            lastUsedTimestamp,
            serializePhoto(photo),
            photo.id,
          )
        : insertStatement.bind(
            photo.id,
            serializePhoto(photo),
            lastUsedTimestamp,
          ),
  );

  await database.batch(photoInsertStatements);
}
