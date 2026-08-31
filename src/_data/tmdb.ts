import fs from "node:fs/promises";
import EleventyFetch from "@11ty/eleventy-fetch";
import _ from "lodash";
import createClient from "openapi-fetch";
import nlp from "wink-nlp-utils";
import type { paths } from "../../types/tmdb.js";

const COUNTRY = "GB";

type WatchProviders =
  paths["/3/movie/{movie_id}/watch/providers"]["get"]["responses"][200]["content"]["application/json"];

/** Provider entry; OpenAPI example omits free/ads for some countries. */
type Provider = NonNullable<
  NonNullable<
    NonNullable<WatchProviders["results"]>[typeof COUNTRY]
  >["flatrate"]
>[number];

type CountryProviders = {
  link?: string;
  flatrate?: Provider[];
  free?: Provider[];
  ads?: Provider[];
};

if (!process.env.TMDB_ACCESS_TOKEN) {
  throw new Error("TMDB_ACCESS_TOKEN is not set in environment");
}

const client = createClient<paths>({
  baseUrl: "https://api.themoviedb.org",
  headers: {
    Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
  },
  fetch: async (request: Request) => {
    const cached = await EleventyFetch(request.url, {
      duration: "18h",
      type: "json",
      returnType: "response",
      fetchOptions: {
        method: request.method,
        headers: Object.fromEntries(request.headers),
      },
    });

    return new Response(JSON.stringify(cached.body), {
      status: cached.status ?? 200,
      headers: cached.headers,
    });
  },
});

async function getCertification(id: number): Promise<string | undefined> {
  const release_dates = await client.GET("/3/movie/{movie_id}/release_dates", {
    params: { path: { movie_id: id } },
  });

  const result = release_dates.data?.results?.find(
    (entry) => entry.iso_3166_1 === COUNTRY,
  );
  return _.chain(result?.release_dates)
    .map((release_date) => release_date.certification)
    .filter(_.negate(_.isEmpty))
    .sort()
    .head()
    .value();
}

async function getProviders(id: number) {
  const providers = await client.GET("/3/movie/{movie_id}/watch/providers", {
    params: { path: { movie_id: id } },
  });
  const country = providers.data?.results?.[COUNTRY] as
    | CountryProviders
    | undefined;
  const allProviders = [
    ...(country?.flatrate ?? []),
    ...(country?.free ?? []),
    ...(country?.ads ?? []),
  ];
  return {
    providers_link: country?.link,
    providers: allProviders
      .map((provider) => ({
        ...provider,
        provider_name: (provider.provider_name ?? "").replace(
          "STUDIOCANAL PRESENTS",
          "Studiocanal Presents",
        ),
      }))
      .filter(
        ({ provider_name }) =>
          !allProviders.some(
            (other) =>
              (other.provider_name ?? "") !== provider_name &&
              provider_name
                .replace(" Plus", "+")
                .startsWith((other.provider_name ?? "").replace(" Plus", "+")),
          ),
      ),
  };
}

async function getDetails(url: string) {
  const match = url.match(/\d+/);
  if (!match) {
    throw new Error(`Could not find movie id in url: ${url}`);
  }
  const id = Number(match[0]);
  const [details, providers, certification] = await Promise.all([
    client.GET("/3/movie/{movie_id}", {
      params: { path: { movie_id: id } },
    }),
    getProviders(id),
    getCertification(id),
  ]);

  const [first, ...rest] = nlp.string.sentences(details.data?.overview ?? "");
  let count = first.length;
  const overview = [
    first,
    ..._.takeWhile(rest, (next) => (count += next.length) < 270),
  ].join(" ");

  return {
    ...details.data,
    ...providers,
    certification: certification ?? "?",
    overview,
    link: url,
  };
}

export default async function () {
  const file = await fs.readFile("src/_data/films.txt", { encoding: "utf-8" });
  const urls = file.split("\n").filter(_.negate(_.isEmpty));
  const films = await Promise.all(urls.map(getDetails));

  const genres = _.chain(films)
    .flatMap((film) => film.genres ?? [])
    .uniqBy((genre) => genre.id)
    .value();

  const providers = _.chain(films)
    .flatMap((film) => film.providers)
    .uniqBy((provider) => provider.provider_id)
    .value();

  return { films, genres, providers };
}
