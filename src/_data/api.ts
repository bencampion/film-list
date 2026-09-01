import EleventyFetch from "@11ty/eleventy-fetch";
import createClient from "openapi-fetch";

import type { paths } from "../../types/tmdb.js";

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
type ReleaseDates =
  paths["/3/movie/{movie_id}/release_dates"]["get"]["responses"]["200"]["content"]["application/json"];

type RawWatchProviders =
  paths["/3/movie/{movie_id}/watch/providers"]["get"]["responses"]["200"]["content"]["application/json"];
type Provider = NonNullable<
  NonNullable<NonNullable<RawWatchProviders["results"]>["GB"]>["flatrate"]
>[number];
type AllMonetization = {
  flatrate?: Provider[];
  free?: Provider[];
  ads?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
};
type WatchProviders = Omit<RawWatchProviders, "results"> & {
  results?: {
    [C in keyof NonNullable<RawWatchProviders["results"]>]?: NonNullable<
      NonNullable<RawWatchProviders["results"]>[C]
    > &
      AllMonetization;
  };
};

type AppendToResponse = {
  release_dates?: ReleaseDates;
  "watch/providers"?: WatchProviders;
};

export async function getMovie(id: number) {
  const { data, response } = await client.GET("/3/movie/{movie_id}", {
    params: {
      path: { movie_id: id },
      query: { append_to_response: "release_dates,watch/providers" },
    },
  });
  if (!response.ok || data === undefined) {
    throw new Error(`Failed to get movie ${id}: ${response.status}`);
  }
  return data as typeof data & AppendToResponse;
}
