import type { UnsplashPhoto } from "@randolphins/api";
import { PhotoDescription } from "./PhotoDescription";
import { UnsplashPhotoUI } from "./UnsplashPhotoUI";
import classNames from "./PhotoWithDescription.module.css";

export function PhotoWithDescription({ photo }: { photo: UnsplashPhoto }) {
  return (
    <>
      <UnsplashPhotoUI photo={photo} />
      <PhotoDescription
        photo={photo}
        className={classNames["padded-description"]}
      />
    </>
  );
}
