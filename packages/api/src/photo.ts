import { z } from "zod";

/**
 * The schema contains only useful properties of the photo.
 * Other properties are not used in the application.
 */
export const photoSchema = z.object({
  id: z.string(),
  description: z.string().nullable(),

  // NOTE: needed to link back to the photo at Unsplash
  links: z.object({
    html: z.string(),
  }),

  /**
   * @see https://unsplash.com/documentation#example-image-use
   */
  urls: z.object({
    regular: z.string(),
  }),

  // NOTE: needed for photo attribution
  user: z.object({
    name: z.string(),
    links: z.object({
      html: z.string(),
    }),
  }),
});

export type UnsplashPhoto = z.infer<typeof photoSchema>;

export const photosSchema = z.array(photoSchema);
