import Keyv from "keyv";
import { KeyvFile } from "keyv-file";
import createClient from "openapi-fetch";
import pThrottle from "p-throttle";

import type { paths } from "../../types/tmdb.js";

if (!process.env.TMDB_ACCESS_TOKEN) {
  throw new Error("TMDB_ACCESS_TOKEN is not set in environment");
}

const cache = new Keyv<Movie>({
  store: new KeyvFile({ filename: ".cache", separatedFile: true }),
  ttl: 18 * 60 * 60 * 1000,
});

const throttle = pThrottle({ limit: 20, interval: 1000 });

const client = createClient<paths>({
  baseUrl: "https://api.themoviedb.org",
  headers: {
    Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
  },
  fetch: throttle(fetch),
});

type ReleaseDates =
  paths["/3/movie/{movie_id}/release_dates"]["get"]["responses"]["200"]["content"]["application/json"];

type RawWatchProviders =
  paths["/3/movie/{movie_id}/watch/providers"]["get"]["responses"]["200"]["content"]["application/json"];
type Provider = NonNullable<
  NonNullable<NonNullable<RawWatchProviders["results"]>["GB"]>["flatrate"]
>[number];
interface AllMonetization {
  flatrate?: Provider[];
  free?: Provider[];
  ads?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
}
type WatchProviders = Omit<RawWatchProviders, "results"> & {
  results?: {
    [C in keyof NonNullable<RawWatchProviders["results"]>]?: NonNullable<
      NonNullable<RawWatchProviders["results"]>[C]
    > &
      AllMonetization;
  };
};

type Movie =
  paths["/3/movie/{movie_id}"]["get"]["responses"]["200"]["content"]["application/json"] & {
    release_dates?: ReleaseDates;
    "watch/providers"?: WatchProviders;
  };

export async function getMovie(id: number): Promise<Movie> {
  const cached = await cache.get(String(id));
  if (cached) {
    return cached;
  }

  const { data, response } = await client.GET("/3/movie/{movie_id}", {
    params: {
      path: { movie_id: id },
      query: { append_to_response: "release_dates,watch/providers" },
    },
  });
  if (!response.ok || data === undefined) {
    throw new Error(`Failed to get movie ${id}: ${response.status}`);
  }

  await cache.set(String(id), data);
  return data;
}
