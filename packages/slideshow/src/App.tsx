import { useMachine } from "@xstate/react";
import { slideshowMachine } from "./app-machine";
import "./App.css";

function App() {
  const [current, send] = useMachine(slideshowMachine);
  const forwardSlideshowSnapshot =
    current.context.forwardSlideshow.getSnapshot()!;
  const { photoHistory } = forwardSlideshowSnapshot.context;
  const currentPhoto =
    photoHistory.length > 0 ? photoHistory[photoHistory.length - 1] : undefined;

  if (!currentPhoto) {
    if (forwardSlideshowSnapshot.matches("waiting for photo")) {
      const photoFetcherSnapshot = current.context.photoFetcher.getSnapshot()!;
      const { errorsSinceSuccessfulFetch } = photoFetcherSnapshot.context;
      return (
        <div>
          <div>Loading the photo...</div>

          {errorsSinceSuccessfulFetch.length > 0 ? (
            <div>
              Errors since last successful fetch:
              <ul>
                {errorsSinceSuccessfulFetch.map((error, index) => (
                  <li key={index}>{error.type}</li>
                ))}
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

  const paused = forwardSlideshowSnapshot.can("resume");

  return (
    <div>
      <div>
        {paused ? (
          <button onClick={() => send({ type: "resume" })}>Resume</button>
        ) : (
          <button onClick={() => send({ type: "pause" })}>Pause</button>
        )}
      </div>

      <div>
        <img
          // TODO: add utm parameters to the URL
          src={currentPhoto.urls.regular}
          alt={currentPhoto.description ?? "A photo of a dolphin."}
          // TODO: add attribution (including utm parameters)
        />
      </div>
    </div>
  );
}

export default App;
