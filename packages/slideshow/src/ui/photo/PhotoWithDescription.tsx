import type { UnsplashPhoto } from "@randolphins/api";
import { PhotoDescription } from "./PhotoDescription";
import { UnsplashPhotoUI } from "./UnsplashPhotoUI";
import classNames from "./PhotoWithDescription.module.css";

export function PhotoWithDescription({
  photo,
  onLoad,
}: {
  photo: UnsplashPhoto;
  onLoad?: () => void;
}) {
  return (
    <>
      <UnsplashPhotoUI photo={photo} onLoad={onLoad} />
      <PhotoDescription
        photo={photo}
        className={classNames["padded-description"]}
      />
    </>
  );
}
