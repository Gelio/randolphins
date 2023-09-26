import { waitFor } from "@testing-library/react";
import {
  ActorRefFrom,
  assign,
  createMachine,
  EventFrom,
  forwardTo,
  interpret,
  spawn,
} from "xstate";
import { sendTo } from "xstate/lib/actions";
import { testUnsplashPhotos } from "../images/test-unsplash-photos";
import { slideshowForwardMachine } from "./forward-machine";

it("asks for a new photo once started", () => {
  const state = slideshowForwardMachine.transition("turned off", {
    type: "start",
    initialPhotoHistory: [],
  });

  expect(state.matches("running.waiting for new photo")).toBe(true);
  expect(state.actions[0]).toEqual(
    expect.objectContaining({
      to: "#_parent",
      event: {
        type: "need photo",
      },
    })
  );
});

it("runs a slideshow and stores photo history", async () => {
  // NOTE: parent machine so `slideshowForwardMachine`' sendParent does not
  // throw an error
  const testMachine = createMachine({
    id: "testParent",
    predictableActionArguments: true,
    tsTypes: {} as import("./forward-machine.test.typegen").Typegen0,
    schema: {
      context: {} as {
        forwardSlideshow: ActorRefFrom<typeof slideshowForwardMachine>;
        currentTestPhotoIndex: number;
      },
      events: {} as
        | EventFrom<typeof slideshowForwardMachine>
        | { type: "need photo" },
    },

    entry: assign({
      forwardSlideshow: () =>
        spawn(
          slideshowForwardMachine.withConfig({
            delays: {
              // NOTE: lower delay to run tests faster
              photoDurationMs: 100,
            },
          }),
          { sync: true }
        ),
    }),

    context: {
      currentTestPhotoIndex: 0,
      // SAFETY: the machine is spawned in the `entry` action
      forwardSlideshow: null as any,
    },

    initial: "init",

    states: {
      init: {},
    },

    on: {
      start: {
        actions: forwardTo((context) => context.forwardSlideshow),
      },

      "need photo": {
        actions: [
          sendTo(
            (context) => context.forwardSlideshow,
            (context) => ({
              type: "new photo",
              photo: testUnsplashPhotos[context.currentTestPhotoIndex],
            })
          ),
          assign({
            currentTestPhotoIndex: (context) =>
              (context.currentTestPhotoIndex + 1) % testUnsplashPhotos.length,
          }),
        ],
      },
    },
  });

  const testMachineService = interpret(testMachine);
  testMachineService.start();

  expect(
    testMachineService
      .getSnapshot()
      .context.forwardSlideshow.getSnapshot()
      ?.matches("turned off")
  ).toBe(true);

  testMachineService.send({ type: "start", initialPhotoHistory: [] });

  for (let i = 1; i < testUnsplashPhotos.length; i++) {
    await waitFor(() => {
      expect(
        testMachineService.getSnapshot().context.forwardSlideshow.getSnapshot()
          ?.context.photoHistory
      ).toEqual(testUnsplashPhotos.slice(0, i));
    });
  }

  testMachineService.stop();
});
