import type { UnsplashPhoto } from "@randolphins/api";
import { useMachine, useSelector } from "@xstate/react";
import { useEffect, useRef, useState } from "react";
import type { StateFrom } from "xstate";
import "./App.css";
import { photoFetcherMachine } from "./images/photo-fetcher-machine";

function hasPhotosToShowSelector(
  state: StateFrom<typeof photoFetcherMachine>
): boolean {
  return state.context.photos.length > 0;
}

function App() {
  const [current, send, actor] = useMachine(photoFetcherMachine);
  const [currentPhoto, setCurrentPhoto] = useState<UnsplashPhoto | undefined>(
    undefined
  );
  const hasPhotosToShow = useSelector(actor, hasPhotosToShowSelector);
  const photosRef = useRef(current.context.photos);
  photosRef.current = current.context.photos;

  useEffect(() => {
    if (!hasPhotosToShow) {
      return;
    }

    function nextPhoto() {
      const photoToShow = photosRef.current[0];
      console.assert(
        photoToShow,
        "No photo to show even though the selector said otherwise"
      );
      setCurrentPhoto(photoToShow);
      send({
        type: "photo used",
        photoId: photoToShow.id,
      });
    }

    const intervalId = setInterval(nextPhoto, 2000);
    nextPhoto();

    return () => clearInterval(intervalId);
  }, [hasPhotosToShow, send]);

  if (!currentPhoto) {
    if (current.hasTag("loading")) {
      return (
        <div>
          <div>Loading the photo...</div>

          {current.context.errorsSinceSuccessfulFetch.length > 0 ? (
            <div>
              Errors since last successful fetch:
              <ul>
                {current.context.errorsSinceSuccessfulFetch.map(
                  (error, index) => (
                    <li key={index}>{error.type}</li>
                  )
                )}
              </ul>
            </div>
          ) : null}
        </div>
      );
    } else {
      return (
        <div>
          Internal error. There is no photo and the machine is not fetching
          them.
        </div>
      );
    }
  }

  return (
    <img
      // TODO: add utm parameters to the URL
      src={currentPhoto.urls.regular}
      alt={currentPhoto.description ?? "A photo of a dolphin."}
      // TODO: add attribution (including utm parameters)
    />
  );
}

export default App;
