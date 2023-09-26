const applicationName = "Randolphins";

/**
 * @see https://help.unsplash.com/en/articles/2511315-guideline-attribution
 */
const unsplashUtmParameters = {
  utm_source: applicationName,
  utm_medium: "referral",
};

export function addUtmParametersToURL(url: URL): URL {
  const newUrl = new URL(url);

  for (const [name, value] of Object.entries(unsplashUtmParameters)) {
    newUrl.searchParams.set(name, value);
  }

  return newUrl;
}
