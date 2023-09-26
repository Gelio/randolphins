import type { UnsplashPhoto } from "@randolphins/api";
import { assign, createMachine, pure, sendParent } from "xstate";
import {
  fetchRandomDolphinUnsplashImages,
  FetchRandomDolphinUnsplashImagesError,
} from "./fetch";

/**
 * When the number of photos in context goes below this number,
 * start fetching more photos.
 */
const photosCacheLowWatermark = 2;

const photosToFetchInOneRequest = 8;

export const photoFetcherMachine = createMachine(
  {
    id: "photo fetcher",
    predictableActionArguments: true,
    tsTypes: {} as import("./photo-fetcher-machine.typegen").Typegen0,
    schema: {
      context: {} as {
        photos: UnsplashPhoto[];
        errorsSinceSuccessfulFetch: FetchRandomDolphinUnsplashImagesError[];
      },
      events: {} as
        | { type: "received photos"; photos: UnsplashPhoto[] }
        | { type: "failure"; error: FetchRandomDolphinUnsplashImagesError }
        | {
            // NOTE: sent by the parent
            type: "need photo";
          }
        | {
            // NOTE: sent by the parent
            type: "pause";
          },
    },
    context: {
      photos: [],
      errorsSinceSuccessfulFetch: [],
    },

    type: "parallel",
    states: {
      fetching: {
        initial: "fetching",

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
              backoffAfterErrorMs: {
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
          },
        },
      },

      providingPhotos: {
        initial: "idle",

        states: {
          idle: {
            on: {
              "need photo": {
                target: "waiting for photo",
              },
            },
          },

          "waiting for photo": {
            always: [
              {
                cond: "hasPhotos",
                actions: "sendPhotoToParent",
                target: "idle",
              },
            ],

            on: {
              pause: {
                target: "idle",
              },
            },
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
      sendPhotoToParent: pure((context) => {
        const photo = context.photos[0];

        return [
          sendParent({
            type: "photo",
            photo,
          }),
          assign({
            photos: ({ photos }) =>
              removePhotoWithoutMutations(photos, photo.id),
          }),
        ];
      }),
    },

    guards: {
      photosLowWaterMarkReached: (context) =>
        context.photos.length < photosCacheLowWatermark,
      hasPhotos: (context) => context.photos.length > 0,
    },

    delays: {
      backoffAfterErrorMs: 2000,
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

function removePhotoWithoutMutations(
  photos: UnsplashPhoto[],
  photoId: UnsplashPhoto["id"]
): UnsplashPhoto[] {
  const usedPhotoIndex = photos.findIndex((photo) => photo.id === photoId);
  if (usedPhotoIndex === -1) {
    // NOTE: ignore trying to remove a photo that is no longer in the
    // context
    return photos;
  }

  return [
    ...photos.slice(0, usedPhotoIndex),
    ...photos.slice(usedPhotoIndex + 1),
  ];
}
