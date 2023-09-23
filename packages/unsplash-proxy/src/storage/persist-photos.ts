import type { UnsplashPhoto } from "@randolphins/api/src/photo";
import { serializePhoto } from "./serialization";

export interface PhotoToPersist {
  photo: UnsplashPhoto;
  lastUsedTimestamp: number;
}

export function persistPhotos({
  photosToPersist,
  database,
}: {
  photosToPersist: PhotoToPersist[];
  database: D1Database;
}): Promise<void> {
  const insertStatement = database.prepare(
    "INSERT INTO photos (id, json, last_used_date) VALUES (?1, ?2, ?3)",
  );

  // TODO: handle errors when some photo was already added and there is a ID uniqueness violation
  const photoInsertStatements = photosToPersist.map(
    ({ photo, lastUsedTimestamp }) =>
      insertStatement.bind(photo.id, serializePhoto(photo), lastUsedTimestamp),
  );

  return database.batch(photoInsertStatements).then(() => undefined);
}
