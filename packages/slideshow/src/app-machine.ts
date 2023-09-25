import type { UnsplashPhoto } from "@randolphins/api";
import { ActorRefFrom, assign, createMachine, spawn } from "xstate";
import { forwardTo } from "xstate/lib/actions";
import { photoFetcherMachine } from "./images/photo-fetcher-machine";
import { slideshowForwardMachine } from "./slideshow";

export const slideshowMachine = createMachine(
  {
    predictableActionArguments: true,
    tsTypes: {} as import("./app-machine.typegen").Typegen0,
    schema: {
      context: {} as {
        photoFetcher: ActorRefFrom<typeof photoFetcherMachine>;
        forwardSlideshow: ActorRefFrom<typeof slideshowForwardMachine>;
      },
      events: {} as
        | {
            // NOTE: sent by the slideshowForwardMachine
            type: "need photo";
          }
        | {
            // NOTE: sent by the photoFetcherMachine
            type: "photo";
            photo: UnsplashPhoto;
          }
        | {
            // NOTE: sent by the consumer
            type: "pause";
          }
        | {
            // NOTE: sent by the consumer
            type: "resume";
          },
    },

    entry: assign({
      // TODO: maybe turn off some `sync`s
      photoFetcher: () => spawn(photoFetcherMachine, { sync: true }),
      forwardSlideshow: () => spawn(slideshowForwardMachine, { sync: true }),
    }),

    initial: "forward",

    states: {
      forward: {
        // entry: "startForwardSlideshow",

        on: {
          "need photo": {
            actions: forwardTo((context) => context.photoFetcher),
          },
          photo: {
            actions: forwardTo((context) => context.forwardSlideshow),
          },
          pause: {
            actions: [
              forwardTo((context) => context.photoFetcher),
              forwardTo((context) => context.forwardSlideshow),
            ],
          },
          resume: {
            actions: forwardTo((context) => context.forwardSlideshow),
          },
        },
      },
    },
  },
  {}
);
