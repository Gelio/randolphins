import { useMachine } from "@xstate/react";
import { slideshowMachine } from "./app-machine";
import "./App.css";
import type { FetchRandomDolphinUnsplashImagesError } from "./images/fetch";
import { inspect } from "@xstate/inspect";
import { PhotoWithDescription } from "./ui/photo";
import { SlideshowLayout } from "./ui/SlideshowLayout";
import { Button } from "./ui/Button";

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
          <SlideshowLayout
            modeButton={
              <Button onClick={() => send({ type: "rewind slideshow" })}>
                Rewind
              </Button>
            }
            pauseResumeButton={
              paused ? (
                <Button onClick={() => send({ type: "resume" })}>Resume</Button>
              ) : (
                <Button onClick={() => send({ type: "pause" })}>Pause</Button>
              )
            }
          >
            {currentPhoto ? (
              <PhotoWithDescription photo={currentPhoto} />
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
          </SlideshowLayout>
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
        <SlideshowLayout
          modeButton={
            <Button onClick={() => send({ type: "forward slideshow" })}>
              Forward
            </Button>
          }
          pauseResumeButton={
            rewindSlideshowSnapshot.matches("running.paused") ? (
              <Button onClick={() => send({ type: "resume" })}>Resume</Button>
            ) : (
              <Button
                onClick={() => send({ type: "pause" })}
                disabled={rewindSlideshowSnapshot.matches(
                  "running.noPhotosLeft"
                )}
              >
                Pause
              </Button>
            )
          }
        >
          {rewindSlideshowSnapshot.matches("running.noPhotosLeft") ? (
            <div>Cannot remember any more dolphins</div>
          ) : (
            <PhotoWithDescription
              photo={
                // TODO: a formal invariant check
                rewindSlideshowSnapshot.context.photosToRewind.at(-1)!
              }
            />
          )}
        </SlideshowLayout>
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
