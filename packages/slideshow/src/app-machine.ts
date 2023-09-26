import type { UnsplashPhoto } from "@randolphins/api";
import {
  ActorRefFrom,
  assign,
  createMachine,
  pure,
  sendTo,
  spawn,
} from "xstate";
import { forwardTo } from "xstate/lib/actions";
import { photoFetcherMachine } from "./images/photo-fetcher-machine";
import { slideshowForwardMachine, slideshowRewindMachine } from "./slideshow";

export const slideshowMachine = createMachine(
  {
    id: "slideshow",
    predictableActionArguments: true,
    tsTypes: {} as import("./app-machine.typegen").Typegen0,
    schema: {
      context: {} as {
        photoFetcher: ActorRefFrom<typeof photoFetcherMachine>;
        forwardSlideshow: ActorRefFrom<typeof slideshowForwardMachine>;
        rewindSlideshow: ActorRefFrom<typeof slideshowRewindMachine>;
      },
      events: {} as
        | {
            // NOTE: sent by the slideshowForwardMachine
            type: "need photo";
          }
        | {
            // NOTE: sent by the photoFetcherMachine
            type: "new photo";
            photo: UnsplashPhoto;
          }
        | {
            // NOTE: sent by the consumer
            type: "pause";
          }
        | {
            // NOTE: sent by the consumer
            type: "resume";
          }
        | {
            type: "forward slideshow" | "rewind slideshow";
          },
    },

    entry: pure((context) =>
      // NOTE: only initialize the actors once.
      // `entry` runs on transitions too, which would overwrite the existing actors.
      context.forwardSlideshow
        ? undefined
        : assign({
            // TODO: maybe turn off some `sync`s
            photoFetcher: () => spawn(photoFetcherMachine, { sync: true }),

            // TODO: have only 1 machine started at a time. Use .withContext to start it.
            // This may be more idiomatic than having a "turned off" state for them.
            forwardSlideshow: () =>
              spawn(slideshowForwardMachine, {
                sync: true,
              }),
            rewindSlideshow: () =>
              spawn(slideshowRewindMachine, { sync: true }),
          })
    ),

    initial: "forward",

    on: {
      "forward slideshow": {
        target: "forward",
      },
      "rewind slideshow": {
        target: "rewind",
      },
    },

    states: {
      forward: {
        entry: "startForwardSlideshow",
        exit: [
          "turnOffForwardSlideshow",
          sendTo((context) => context.photoFetcher, { type: "pause" }),
        ],

        on: {
          "need photo": {
            actions: forwardTo((context) => context.photoFetcher),
          },
          "new photo": {
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

      rewind: {
        entry: "startRewindSlideshow",
        exit: "turnOffRewindSlideshow",

        on: {
          pause: {
            actions: forwardTo((context) => context.rewindSlideshow),
          },
          resume: {
            actions: forwardTo((context) => context.rewindSlideshow),
          },
        },
      },
    },
  },
  {
    actions: {
      startForwardSlideshow: sendTo(
        (context) => context.forwardSlideshow,
        (context) => ({
          type: "start",
          initialPhotoHistory:
            // SAFETY: the rewindSlideshow machine is started immediately
            // and never stops. It always has a snapshot.
            context.rewindSlideshow.getSnapshot()!.context.photosToRewind,
        })
      ),
      turnOffForwardSlideshow: sendTo((context) => context.forwardSlideshow, {
        type: "turn off",
      }),

      startRewindSlideshow: sendTo(
        (context) => context.rewindSlideshow,
        (context) => ({
          type: "start",
          photosToRewind:
            context.forwardSlideshow.getSnapshot()!.context.photoHistory,
        })
      ),
      turnOffRewindSlideshow: sendTo((context) => context.rewindSlideshow, {
        type: "turn off",
      }),
    },
  }
);
