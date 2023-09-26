import { useMachine } from "@xstate/react";
import { slideshowMachine } from "./app-machine";
import "./App.css";
import type { FetchRandomDolphinUnsplashImagesError } from "./images/fetch";
import { inspect } from "@xstate/inspect";
import { UnsplashPhotoUI } from "./ui/photo";

// TODO: debug the warnings about stopped services in the browser console

const debugMachines = false;

if (process.env.NODE_ENV === "development" && debugMachines) {
  inspect({
    iframe: false,
  });
}

export function App() {
  const [current, send] = useMachine(slideshowMachine, {
    devTools: debugMachines,
  });

  if (current.matches("forward")) {
    const forwardSlideshowSnapshot =
      current.context.forwardSlideshow.getSnapshot()!;

    if (forwardSlideshowSnapshot.matches("turned off")) {
      return <div>Initializing the slideshow...</div>;
    } else if (forwardSlideshowSnapshot.matches("running")) {
      const { photoHistory } = forwardSlideshowSnapshot.context;
      const currentPhoto = photoHistory.at(-1);
      const paused = forwardSlideshowSnapshot.matches("running.paused");

      return (
        <div>
          <div>
            <button onClick={() => send({ type: "rewind slideshow" })}>
              Rewind
            </button>

            {paused ? (
              <button onClick={() => send({ type: "resume" })}>Resume</button>
            ) : (
              <button onClick={() => send({ type: "pause" })}>Pause</button>
            )}
          </div>

          {currentPhoto ? (
            <UnsplashPhotoUI photo={currentPhoto} />
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

              const photoFetcherSnapshot =
                current.context.photoFetcher.getSnapshot()!;
              const { errorsSinceSuccessfulFetch } =
                photoFetcherSnapshot.context;
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
        </div>
      );
    } else {
      throw new Error(
        `Unexpected forwardSlideshowMachine state: ${forwardSlideshowSnapshot.value}`
      );
    }
  } else if (current.matches("rewind")) {
    const rewindSlideshowSnapshot =
      current.context.rewindSlideshow.getSnapshot()!;

    if (rewindSlideshowSnapshot.matches("turned off")) {
      throw new Error(
        "Unreachable code. The forwardSlideshowMachine should be running when the rewindSlideshowSnapshot is turned off.\n" +
          "The other code branch should be executed in this case."
      );
    } else if (rewindSlideshowSnapshot.matches("running")) {
      return (
        <div>
          <div>
            <button onClick={() => send({ type: "forward slideshow" })}>
              Forward
            </button>

            {rewindSlideshowSnapshot.matches("running.paused") ? (
              <button onClick={() => send({ type: "resume" })}>Resume</button>
            ) : (
              <button
                onClick={() => send({ type: "pause" })}
                disabled={rewindSlideshowSnapshot.matches(
                  "running.noPhotosLeft"
                )}
              >
                Pause
              </button>
            )}
          </div>

          {rewindSlideshowSnapshot.matches("running.noPhotosLeft") ? (
            <div>Cannot remember any more dolphins</div>
          ) : (
            <UnsplashPhotoUI
              photo={
                // TODO: a formal invariant check
                rewindSlideshowSnapshot.context.photosToRewind.at(-1)!
              }
            />
          )}
        </div>
      );
    } else {
      throw new Error(
        `Unexpected rewindSlideshowMachine state: ${rewindSlideshowSnapshot.value}`
      );
    }
  } else {
    throw new Error(`Unexpected slideshowMachine state: ${current.value}`);
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
