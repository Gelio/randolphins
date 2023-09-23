import { photoSchema, type UnsplashPhoto } from "@randolphins/api/src/photo";

export function serializePhoto(photo: UnsplashPhoto): string {
  return JSON.stringify(photo);
}

export function deserializePhoto(serializedPhoto: string): UnsplashPhoto {
  const deserializedPhoto = JSON.parse(serializedPhoto);

  // TODO: handle errors
  return photoSchema.parse(deserializedPhoto);
}
