import type { UnsplashPhoto } from "@randolphins/api";
import { addUnsplashAttributionToURL } from "./utm-parameters";
import classNames from "./UnsplashPhotoUI.module.css";

export function UnsplashPhotoUI({
  photo,
  onLoad,
}: {
  photo: UnsplashPhoto;
  onLoad?: undefined | (() => void);
}) {
  return (
    <a
      href={addUnsplashAttributionToURL(new URL(photo.links.html)).toString()}
      target="_blank"
      rel="noreferrer"
    >
      <img
        src={addUnsplashAttributionToURL(
          new URL(photo.urls.regular)
        ).toString()}
        alt={photo.description ?? "A photo of a dolphin."}
        className={classNames.photo}
        onLoad={onLoad}
      />
    </a>
  );
}
