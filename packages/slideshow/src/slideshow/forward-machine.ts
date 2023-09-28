import type { UnsplashPhoto } from "@randolphins/api";
import { assign, createMachine, sendParent } from "xstate";
import { defaultPhotoDurationMs } from "./config";

const photoHistoryCapacity = 5;

export const slideshowForwardMachine = createMachine(
  {
    id: "slideshow forward",
    predictableActionArguments: true,
    tsTypes: {} as import("./forward-machine.typegen").Typegen0,
    schema: {
      context: {} as {
        /**
         * The most recently shown photos, in the order from oldest to newest.
         * It holds at most {@link photoHistoryCapacity} photos.
         * The newest photo should be shown on the screen.
         */
        photoHistory: UnsplashPhoto[];
      },
      events: {} as
        | {
            type: "new photo";
            photo: UnsplashPhoto;
          }
        | {
            // NOTE: sent by the parent
            type: "pause" | "resume" | "turn off" | "photo loaded";
          }
        | {
            // NOTE: sent by the parent
            type: "start";
            initialPhotoHistory: UnsplashPhoto[];
          },
    },

    context: {
      photoHistory: [],
    },
    initial: "turned off",

    states: {
      "turned off": {
        on: {
          start: {
            target: "running.waiting for new photo",
            actions: assign({
              photoHistory: (_context, event) => event.initialPhotoHistory,
            }),
          },
        },
      },

      running: {
        states: {
          "waiting for new photo": {
            entry: "askForPhoto",
            // TODO: prefetch photos for better UX
            // https://web.dev/preload-responsive-images/

            on: {
              "new photo": {
                target: "loading photo",
                actions: "savePhoto",
              },
            },
          },

          "loading photo": {
            on: {
              "photo loaded": {
                target: "showing photo",
              },
            },
          },

          "showing photo": {
            after: {
              photoDurationMs: {
                target: "waiting for new photo",
              },
            },
          },

          paused: {
            on: {
              pause: undefined,
              resume: {
                target: "waiting for new photo",
              },
            },
          },
        },

        on: {
          pause: {
            target: ".paused",
          },
          "turn off": {
            target: "turned off",
          },
        },
      },
    },
  },
  {
    actions: {
      savePhoto: assign({
        photoHistory: (context, event) => [
          ...context.photoHistory.slice(-(photoHistoryCapacity - 1)),
          event.photo,
        ],
      }),

      askForPhoto: sendParent({
        type: "need photo",
      }),
    },
    delays: {
      photoDurationMs: defaultPhotoDurationMs,
    },
  }
);
