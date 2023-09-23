import { photoSchema, type UnsplashPhoto } from "@randolphins/api";
import type { ZodError } from "zod";

export function serializePhoto(photo: UnsplashPhoto): string {
  return JSON.stringify(photo);
}

export type DeserializePhotoError =
  | { variant: "JSON parsing failed"; cause: Error }
  | {
      variant: "JSON does not match the expected schema";
      cause: ZodError<UnsplashPhoto>;
    };

type DeserializePhotoResult =
  | { variant: "success"; photo: UnsplashPhoto }
  | { variant: "error"; cause: DeserializePhotoError };

export function deserializePhoto(
  serializedPhoto: string,
): DeserializePhotoResult {
  let deserializedPhoto: object | undefined;
  try {
    deserializedPhoto = JSON.parse(serializedPhoto);
  } catch (error) {
    return {
      variant: "error",
      cause: {
        variant: "JSON parsing failed",
        cause: error as Error,
      },
    };
  }

  const parsingResult = photoSchema.safeParse(deserializedPhoto);
  if (parsingResult.success) {
    return {
      variant: "success",
      photo: parsingResult.data,
    };
  } else {
    return {
      variant: "error",
      cause: {
        variant: "JSON does not match the expected schema",
        cause: parsingResult.error,
      },
    };
  }
}
