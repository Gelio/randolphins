import invariant from "ts-invariant";
import type { EventFrom, StateFrom } from "xstate";
import type { slideshowMachine } from "../app-machine";
import type { slideshowRewindMachine } from "../slideshow";
import { Button } from "./Button";
import { PhotoWithDescription } from "./photo";
import { SlideshowLayout } from "./SlideshowLayout";

export function SlideshowRewindLayout({
  rewindSlideshowSnapshot,
  sendEvent,
}: {
  rewindSlideshowSnapshot: StateFrom<typeof slideshowRewindMachine>;
  sendEvent: (event: EventFrom<typeof slideshowMachine>) => void;
}) {
  if (rewindSlideshowSnapshot.matches("turned off")) {
    throw new Error(
      "Unreachable code. The forwardSlideshowMachine should be running when the rewindSlideshowSnapshot is turned off.\n" +
        "The other code branch should be executed in this case."
    );
  } else if (rewindSlideshowSnapshot.matches("running")) {
    return (
      <SlideshowLayout
        modeButton={
          <Button onClick={() => sendEvent({ type: "forward slideshow" })}>
            Forward
          </Button>
        }
        pauseResumeButton={
          rewindSlideshowSnapshot.matches("running.paused") ? (
            <Button onClick={() => sendEvent({ type: "resume" })}>
              Resume
            </Button>
          ) : (
            <Button
              onClick={() => sendEvent({ type: "pause" })}
              disabled={rewindSlideshowSnapshot.matches("running.noPhotosLeft")}
            >
              Pause
            </Button>
          )
        }
      >
        {rewindSlideshowSnapshot.matches("running.noPhotosLeft") ? (
          <div>Cannot remember any more dolphins</div>
        ) : (
          (() => {
            const latestPhoto =
              rewindSlideshowSnapshot.context.photosToRewind.at(-1);
            invariant(
              latestPhoto,
              "There must be a photo when the state is not 'noPhotosLeft'"
            );

            return <PhotoWithDescription photo={latestPhoto} />;
          })()
        )}
      </SlideshowLayout>
    );
  } else {
    throw new Error(
      `Unexpected rewindSlideshowMachine state: ${rewindSlideshowSnapshot.value}`
    );
  }
}
