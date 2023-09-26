import type { UnsplashPhoto } from "@randolphins/api";
import { waitFor } from "@testing-library/react";
import invariant from "ts-invariant";
import {
  ActorRefFrom,
  assign,
  createMachine,
  forwardTo,
  interpret,
  spawn,
} from "xstate";
import { photoFetcherMachine } from "./photo-fetcher-machine";
import { testUnsplashPhotos } from "./test-unsplash-photos";

it("fetches a photo immediately", async () => {
  const mockedPhotoFetcherMachine = photoFetcherMachine.withConfig({
    services: {
      fetchPhotosActor: () => (sendBack) => {
        sendBack({
          type: "received photos",
          photos: testUnsplashPhotos,
        });
      },
    },
  });
  const photoFetcher = interpret(mockedPhotoFetcherMachine);
  photoFetcher.start();

  await waitFor(() => {
    expect(photoFetcher.getSnapshot().context.photos).toHaveLength(
      testUnsplashPhotos.length
    );
  });

  photoFetcher.stop();
});

/**
 * @see https://github.com/tc39/proposal-promise-with-resolvers
 */
function getPromiseWithResolver<T = void>(): [Promise<T>, (value: T) => void] {
  let resolver: undefined | ((value: T) => void);

  const promise = new Promise<T>((resolve) => {
    resolver = resolve;
  });
  invariant(resolver, "resolver is initialized in the Promise callback");

  return [promise, resolver];
}

it("sends a photo once it is fetched", async () => {
  const [photosFetched, markPhotosAsFetched] = getPromiseWithResolver();
  const mockedPhotoFetcherMachine = photoFetcherMachine.withConfig({
    services: {
      fetchPhotosActor: () => (sendBack) => {
        photosFetched.then(() => {
          sendBack({
            type: "received photos",
            photos: testUnsplashPhotos,
          });
        });
      },
    },
  });
  // NOTE: parent machine so `mockedPhotoFetcherMachine`' sendParent does not
  // throw an error
  const testMachine = createMachine({
    id: "testParent",
    predictableActionArguments: true,
    tsTypes: {} as import("./photo-fetcher-machine.test.typegen").Typegen0,
    schema: {
      context: {} as {
        receivedPhoto: UnsplashPhoto | undefined;
        photoFetcher: ActorRefFrom<typeof mockedPhotoFetcherMachine>;
      },
      events: {} as
        | { type: "need photo" }
        | { type: "new photo"; photo: UnsplashPhoto },
    },

    entry: assign({
      photoFetcher: () => spawn(mockedPhotoFetcherMachine, { sync: true }),
    }),

    context: {
      // SAFETY: the machine is spawned in the `entry` action
      photoFetcher: null as any,
      receivedPhoto: undefined,
    },

    initial: "init",

    states: {
      init: {},
    },

    on: {
      "new photo": {
        actions: assign({
          receivedPhoto: (_context, event) => event.photo,
        }),
      },
      "need photo": {
        actions: forwardTo((context) => context.photoFetcher),
      },
    },
  });

  const testMachineService = interpret(testMachine);
  testMachineService.start();
  testMachineService.send({
    type: "need photo",
  });

  expect(
    testMachineService
      .getSnapshot()
      .context.photoFetcher.getSnapshot()
      ?.matches("fetching.fetching")
  ).toBe(true);
  expect(
    testMachineService
      .getSnapshot()
      .context.photoFetcher.getSnapshot()
      ?.matches("providingPhotos.waiting for photo")
  ).toBe(true);
  expect(
    testMachineService.getSnapshot().context.photoFetcher.getSnapshot()?.context
      .photos
  ).toEqual([]);

  markPhotosAsFetched();

  await waitFor(() => {
    expect(
      testMachineService
        .getSnapshot()
        .context.photoFetcher.getSnapshot()
        ?.matches("providingPhotos.idle")
    ).toBe(true);
  });

  expect(
    testMachineService
      .getSnapshot()
      .context.photoFetcher.getSnapshot()
      ?.matches("fetching.idle")
  ).toBe(true);
  const { receivedPhoto } = testMachineService.getSnapshot().context;
  expect(receivedPhoto).toEqual(testUnsplashPhotos[0]);

  // NOTE: the first one should be sent to the parent
  const testPhotosWithoutFirstOne = testUnsplashPhotos.slice(1);
  expect(
    testMachineService.getSnapshot().context.photoFetcher.getSnapshot()?.context
      .photos
  ).toEqual(testPhotosWithoutFirstOne);

  testMachineService.stop();
});
