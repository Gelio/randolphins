import type { UnsplashPhoto } from "@randolphins/api";
import { assign, createMachine } from "xstate";
import { defaultPhotoDurationMs } from "./config";

/**
 * Works like a stack.
 * Photos will be popped from the array.
 * The last photo in the array should be shown to the user.
 */

type PhotosToRewind = UnsplashPhoto[];

export const slideshowRewindMachine = createMachine(
  {
    id: "slideshow rewind",
    predictableActionArguments: true,
    tsTypes: {} as import("./rewind-machine.typegen").Typegen0,
    schema: {
      context: {} as {
        photosToRewind: PhotosToRewind;
      },
      events: {} as
        | {
            // NOTE: sent by the parent
            type: "start";
            photosToRewind: PhotosToRewind;
          }
        | {
            // NOTE: sent by the parent
            type: "turn off" | "pause" | "resume";
          },
    },

    context: {
      photosToRewind: [],
    },

    initial: "turned off",

    states: {
      "turned off": {
        on: {
          start: {
            target: "running",
            actions: assign({
              photosToRewind: (_context, event) => event.photosToRewind,
            }),
          },
        },
      },

      running: {
        initial: "rewinding",

        states: {
          rewinding: {
            always: [
              {
                cond: "noPhotosLeft",
                target: "noPhotosLeft",
              },
            ],

            after: {
              photoDurationMs: {
                target: "rewinding",
                actions: "popPhoto",
              },
            },

            on: {
              pause: "paused",
            },
          },

          paused: {
            on: {
              resume: "rewinding",
            },
          },

          noPhotosLeft: {
            type: "final",
          },
        },

        on: {
          "turn off": {
            target: "turned off",
          },
        },
      },
    },
  },
  {
    guards: {
      noPhotosLeft: (context) => context.photosToRewind.length === 0,
    },

    delays: {
      photoDurationMs: defaultPhotoDurationMs,
    },

    actions: {
      popPhoto: assign({
        photosToRewind: (context) => context.photosToRewind.slice(0, -1),
      }),
    },
  }
);
