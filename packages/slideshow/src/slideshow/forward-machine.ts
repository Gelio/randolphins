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
            type: "pause";
          }
        | {
            // NOTE: sent by the parent
            type: "resume";
          },
    },

    context: {
      photoHistory: [],
    },
    initial: "waiting for photo",
    states: {
      "waiting for photo": {
        entry: "askForPhoto",

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
          resume: {
            target: "idle",
          },
        },
      },
    },

    on: {
      pause: {
        target: "paused",
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
