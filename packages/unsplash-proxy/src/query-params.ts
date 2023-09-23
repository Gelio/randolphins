import { z } from "zod";
import { maxPhotosCount } from "./unsplash-api";

function getSearchParams(url: string): URLSearchParams {
  return new URL(url).searchParams;
}

const queryParamsSchema = z.object({
  count: z.coerce.number().positive().max(maxPhotosCount).default(1),
});

type ParsedQueryParams = z.infer<typeof queryParamsSchema>;

type QueryParamsParsingResult =
  | { variant: "error"; cause: z.ZodError<ParsedQueryParams> }
  | { variant: "success"; value: ParsedQueryParams };

export function parseQueryParams(url: string): QueryParamsParsingResult {
  const searchParams = getSearchParams(url);

  const parsingResult = queryParamsSchema.safeParse(
    Object.fromEntries(searchParams.entries()),
  );

  if (parsingResult.success) {
    return { variant: "success", value: parsingResult.data };
  } else {
    return { variant: "error", cause: parsingResult.error };
  }
}
