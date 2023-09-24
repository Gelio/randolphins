import type { UnsplashPhoto } from "@randolphins/api";
import { assign, createMachine } from "xstate";
import {
  fetchRandomDolphinUnsplashImages,
  FetchRandomDolphinUnsplashImagesError,
} from "./fetch";

const backoffAfterErrorMs = 2000;

/**
 * When the number of photos in context goes below this number,
 * start fetching more photos.
 */
const photosCacheLowWatermark = 2;

const photosToFetchInOneRequest = 8;

export const photoFetcherMachine = createMachine(
  {
    tsTypes: {} as import("./photo-fetcher-machine.typegen").Typegen0,
    schema: {
      context: {} as {
        photos: UnsplashPhoto[];
        errorsSinceSuccessfulFetch: FetchRandomDolphinUnsplashImagesError[];
      },
      events: {} as
        | { type: "received photos"; photos: UnsplashPhoto[] }
        | { type: "failure"; error: FetchRandomDolphinUnsplashImagesError }
        | { type: "photo used"; photoId: UnsplashPhoto["id"] },
    },
    context: {
      photos: [],
      errorsSinceSuccessfulFetch: [],
    },
    initial: "fetching",

    on: {
      "photo used": {
        actions: "removePhoto",
      },
    },

    states: {
      fetching: {
        invoke: {
          src: "fetchPhotosActor",
        },
        tags: "loading",
        on: {
          failure: {
            target: "backoff",
            actions: "saveError",
          },
          "received photos": {
            target: "idle",
            actions: "storePhotos",
          },
        },
      },

      backoff: {
        tags: "loading",
        after: {
          [backoffAfterErrorMs]: {
            target: "fetching",
          },
        },
      },

      idle: {
        always: [
          {
            cond: "photosLowWaterMarkReached",
            target: "fetching",
          },
        ],
        on: {
          "photo used": {
            actions: "removePhoto",

            // NOTE: do an internal transition to the "idle" state
            // to rerun `always` checks
            target: "idle",
          },
        },
      },
    },
  },
  {
    actions: {
      saveError: assign({
        errorsSinceSuccessfulFetch: (context, event) => [
          ...context.errorsSinceSuccessfulFetch,
          event.error,
        ],
      }),
      storePhotos: assign({
        errorsSinceSuccessfulFetch: [],
        photos: (context, event) => [...context.photos, ...event.photos],
      }),
      removePhoto: assign({
        photos: (context, event) => {
          const usedPhotoIndex = context.photos.findIndex(
            (photo) => photo.id === event.photoId
          );
          if (usedPhotoIndex === -1) {
            // NOTE: ignore trying to remove a photo that is no longer in the
            // context
            return context.photos;
          }

          return [
            ...context.photos.slice(0, usedPhotoIndex),
            ...context.photos.slice(usedPhotoIndex + 1),
          ];
        },
      }),
    },

    guards: {
      photosLowWaterMarkReached: (context) =>
        context.photos.length < photosCacheLowWatermark,
    },

    services: {
      fetchPhotosActor: () => (sendBack) => {
        const abortController = new AbortController();

        fetchRandomDolphinUnsplashImages({
          count: photosToFetchInOneRequest,
          abortSignal: abortController.signal,
        })
          .then((result) => {
            switch (result.variant) {
              case "aborted":
                return;

              case "error":
                sendBack({
                  type: "failure",
                  error: result.cause,
                });
                return;

              case "success":
                sendBack({
                  type: "received photos",
                  photos: result.photos,
                });
                return;
            }
          })
          .catch((error) => {
            console.error("Unexpected error when fetching photos", error);
          });

        return () => {
          abortController.abort();
        };
      },
    },
  }
);
