import type { UnsplashPhoto } from "@randolphins/api";
import { addUtmParametersToURL as addUnsplashAttributionToURL } from "./utm-parameters";

export function UnsplashPhotoUI({ photo }: { photo: UnsplashPhoto }) {
  return (
    <div>
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
        />
      </a>

      <PhotoDescription photo={photo} />
    </div>
  );
}

function PhotoDescription({ photo }: { photo: UnsplashPhoto }) {
  return (
    <p>
      {photo.description ?? "A photo of a dolphin"} by{" "}
      <a
        href={addUnsplashAttributionToURL(
          new URL(photo.user.links.html)
        ).toString()}
      >
        {photo.user.name}
      </a>{" "}
      on{" "}
      <a
        href={addUnsplashAttributionToURL(
          new URL("https://unsplash.com")
        ).toString()}
      >
        Unsplash
      </a>
      .
    </p>
  );
}
