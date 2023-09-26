import type { UnsplashPhoto } from "@randolphins/api";
import { assign, createMachine, sendParent } from "xstate";
import { defaultPhotoDurationMs } from "./config";

const photoHistoryCapacity = 5;

export const slideshowForwardMachine = createMachine(
  {
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
            type: "photo";
            photo: UnsplashPhoto;
          }
        | {
            // NOTE: sent by the parent
            type: "pause" | "resume" | "turn off";
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
            target: "running.waiting for photo",
            actions: assign({
              photoHistory: (_context, event) => event.initialPhotoHistory,
            }),
          },
        },
      },

      running: {
        states: {
          "waiting for photo": {
            entry: "askForPhoto",
            // TODO: prefetch photos. On slow networks, the new photo does not
            // have a chance to load before the src is changed to the next one, and
            // the next one also won't load, so the page is showing the same old
            // photo constantly.
            // https://web.dev/preload-responsive-images/

            on: {
              photo: {
                target: "idle",
                actions: "savePhoto",
              },
            },
          },

          idle: {
            after: {
              photoDurationMs: {
                target: "waiting for photo",
              },
            },
          },

          paused: {
            on: {
              pause: undefined,
              resume: [
                {
                  target: "idle",
                  cond: "hasPhotos",
                },
                { target: "waiting for photo" },
              ],
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
    guards: {
      hasPhotos: (context) => context.photoHistory.length > 0,
    },
  }
);
