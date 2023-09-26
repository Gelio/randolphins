import { useMachine } from "@xstate/react";
import { slideshowMachine } from "./app-machine";
import "./App.css";
import { inspect } from "@xstate/inspect";
import invariant from "ts-invariant";
import { AppLayout } from "./ui/AppLayout";
import { SlideshowForwardLayout } from "./ui/SlideshowForwardLayout";
import { SlideshowRewindLayout } from "./ui/SlideshowRewindLayout";

// TODO: debug the warnings about stopped services in the browser console

const debugMachines = false;

if (process.env.NODE_ENV === "development" && debugMachines) {
  inspect({
    iframe: false,
  });
}

export function App() {
  return (
    <AppLayout>
      <Slideshow />
    </AppLayout>
  );
}

function Slideshow() {
  const [current, send] = useMachine(slideshowMachine, {
    devTools: debugMachines,
  });

  if (current.matches("forward")) {
    const forwardSlideshowSnapshot =
      current.context.forwardSlideshow.getSnapshot();
    invariant(
      forwardSlideshowSnapshot,
      "The forwardSlideshowMachine must be running"
    );

    return (
      <SlideshowForwardLayout
        forwardSlideshowSnapshot={forwardSlideshowSnapshot}
        sendEvent={send}
        getPhotoFetcherSnapshot={() => {
          const photoFetcherSnapshot =
            current.context.photoFetcher.getSnapshot();
          invariant(photoFetcherSnapshot, "The photoFetcher must be running");

          return photoFetcherSnapshot;
        }}
      />
    );
  } else if (current.matches("rewind")) {
    const rewindSlideshowSnapshot =
      current.context.rewindSlideshow.getSnapshot();
    invariant(
      rewindSlideshowSnapshot,
      "The rewindSlideshowMachine must be running"
    );

    return (
      <SlideshowRewindLayout
        rewindSlideshowSnapshot={rewindSlideshowSnapshot}
        sendEvent={send}
      />
    );
  } else {
    throw new Error(`Unexpected slideshowMachine state: ${current.value}`);
  }
}
