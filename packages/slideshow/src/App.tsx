import type { UnsplashPhoto } from "@randolphins/api";
import { useEffect, useState } from "react";
import "./App.css";
import { fetchRandomDolphinUnsplashImages } from "./images/fetch";

function App() {
  const [photo, setPhoto] = useState<UnsplashPhoto | undefined>(undefined);

  useEffect(() => {
    fetchRandomDolphinUnsplashImages({ count: 1 }).then((result) => {
      switch (result.variant) {
        case "success":
          setPhoto(result.photos[0]);
          break;

        case "error":
          console.log("Could not fetch the dolphin photo", result.cause);
          break;
      }
    });
  }, []);

  if (!photo) {
    return <div>Loading the photo...</div>;
  }

  return (
    <img
      src={photo.urls.regular}
      alt={photo.description ?? "A photo of a dolphin."}
    />
  );
}

export default App;
