import type { UnsplashPhoto } from "@randolphins/api";
import { addUnsplashAttributionToURL } from "./utm-parameters";

export function PhotoDescription({
  photo,
  className,
}: {
  photo: UnsplashPhoto;
  className?: string;
}) {
  return (
    <p className={className}>
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
