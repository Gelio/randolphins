import type { EventFrom, StateFrom } from "xstate";
import type { slideshowMachine } from "../app-machine";
import type { FetchRandomDolphinUnsplashImagesError } from "../images/fetch";
import type { photoFetcherMachine } from "../images/photo-fetcher-machine";
import type { slideshowForwardMachine } from "../slideshow";
import { Button } from "./Button";
import { PhotoWithDescription } from "./photo";
import { SlideshowLayout } from "./SlideshowLayout";

export function SlideshowForwardLayout({
  forwardSlideshowSnapshot,
  getPhotoFetcherSnapshot,
  sendEvent,
}: {
  forwardSlideshowSnapshot: StateFrom<typeof slideshowForwardMachine>;
  getPhotoFetcherSnapshot: () => StateFrom<typeof photoFetcherMachine>;
  sendEvent: (event: EventFrom<typeof slideshowMachine>) => void;
}) {
  if (forwardSlideshowSnapshot.matches("turned off")) {
    return <div>Initializing the slideshow...</div>;
  } else if (forwardSlideshowSnapshot.matches("running")) {
    const { photoHistory } = forwardSlideshowSnapshot.context;
    const currentPhoto = photoHistory.at(-1);
    const paused = forwardSlideshowSnapshot.matches("running.paused");

    return (
      <div>
        <SlideshowLayout
          modeButton={
            <Button onClick={() => sendEvent({ type: "rewind slideshow" })}>
              Rewind
            </Button>
          }
          pauseResumeButton={
            paused ? (
              <Button onClick={() => sendEvent({ type: "resume" })}>
                Resume
              </Button>
            ) : (
              <Button onClick={() => sendEvent({ type: "pause" })}>
                Pause
              </Button>
            )
          }
        >
          {currentPhoto ? (
            <PhotoWithDescription
              photo={currentPhoto}
              onLoad={() => {
                sendEvent({
                  type: "photo loaded",
                });
              }}
            />
          ) : (
            (() => {
              if (
                !forwardSlideshowSnapshot.matches(
                  "running.waiting for new photo"
                )
              ) {
                return (
                  <div>
                    Press <em>Resume</em> to start the slideshow.
                  </div>
                );
              }

              const { errorsSinceSuccessfulFetch } =
                getPhotoFetcherSnapshot().context;
              return (
                <div>
                  <div>Loading the photo...</div>

                  {errorsSinceSuccessfulFetch.length > 0 ? (
                    <ErrorsSinceLastSuccessfulFetch
                      errorsSinceSuccessfulFetch={errorsSinceSuccessfulFetch}
                    />
                  ) : null}
                </div>
              );
            })()
          )}
        </SlideshowLayout>
      </div>
    );
  } else {
    throw new Error(
      `Unexpected forwardSlideshowMachine state: ${forwardSlideshowSnapshot.value}`
    );
  }
}

function ErrorsSinceLastSuccessfulFetch({
  errorsSinceSuccessfulFetch,
}: {
  errorsSinceSuccessfulFetch: FetchRandomDolphinUnsplashImagesError[];
}) {
  return (
    <div>
      Errors since last successful fetch:
      <ul>
        {errorsSinceSuccessfulFetch.map((error, index) => (
          <li key={index}>{error.type}</li>
        ))}
      </ul>
    </div>
  );
}
