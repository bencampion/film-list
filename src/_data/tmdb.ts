import fs from "node:fs/promises";
import EleventyFetch from "@11ty/eleventy-fetch";
import _ from "lodash";
import createClient from "openapi-fetch";
import model from "wink-eng-lite-web-model";
import winkNLP from "wink-nlp";
import type { paths } from "../../types/tmdb.js";

const COUNTRY = "GB";

const nlp = winkNLP(model);

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

async function getCertification(id: number) {
  const allReleaseDates = await client.GET(
    "/3/movie/{movie_id}/release_dates",
    { params: { path: { movie_id: id } } },
  );

  const releaseDates = allReleaseDates.data?.results?.find(
    (entry) => entry.iso_3166_1 === COUNTRY,
  )?.release_dates;

  const certification =
    releaseDates
      ?.map((release_date) => release_date.certification)
      .filter(Boolean)[0] ?? "?";

  return certification;
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
              provider_name.startsWith(other.provider_name ?? ""),
          ),
      ),
  };
}

function trimParagraph(text: string, minChars: number) {
  const [first, ...rest] = nlp.readDoc(text).sentences().out();
  let count = first.length;
  const sentences = [
    first,
    ..._.takeWhile(rest, (next) => (count += next.length) < minChars),
  ];
  return sentences.join(" ");
}

async function getFilm({ id, link }: { id: number; link: string }) {
  const [details, providers, certification] = await Promise.all([
    client.GET("/3/movie/{movie_id}", {
      params: { path: { movie_id: id } },
    }),
    getProviders(id),
    getCertification(id),
  ]);

  return {
    ...details.data,
    ...providers,
    certification,
    overview: trimParagraph(details.data?.overview ?? "", 270),
    link,
  };
}

async function readFilmList() {
  const file = await fs.readFile("src/_data/films.txt", { encoding: "utf-8" });
  return file
    .split("\n")
    .filter(Boolean)
    .map((link) => {
      const match = link.match(/\d+/);
      if (!match) {
        throw new Error(`Could not find movie id in link: ${link}`);
      }
      const id = Number(match[0]);
      return { id, link };
    });
}

export default async function () {
  const ids = await readFilmList();

  const films = _.sortBy(
    await Promise.all(ids.map(getFilm)),
    (film) => film.title,
  );

  const genres = _.chain(films)
    .flatMap((film) => film.genres ?? [])
    .uniqBy((genre) => genre.id)
    .sortBy((genre) => genre.name)
    .value();

  const providers = _.chain(films)
    .flatMap((film) => film.providers)
    .uniqBy((provider) => provider.provider_id)
    .sortBy((provider) => provider.provider_name)
    .value();

  return { films, genres, providers };
}
