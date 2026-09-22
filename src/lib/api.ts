import Keyv from "keyv";
import { KeyvFile } from "keyv-file";
import pThrottle from "p-throttle";

if (!process.env.TMDB_ACCESS_TOKEN) {
  throw new Error("TMDB_ACCESS_TOKEN is not set in environment");
}

const cache = new Keyv<Movie>({
  store: new KeyvFile({ filename: ".cache", separatedFile: true }),
  ttl: 18 * 60 * 60 * 1000,
});

const throttle = pThrottle({ limit: 20, interval: 1000 });
const throttledFetch = throttle(fetch);

interface Genre {
  id: number;
  name?: string;
}

interface WatchProvider {
  provider_id: number;
  provider_name?: string;
  logo_path?: string | null;
}

interface ReleaseDates {
  results?: {
    iso_3166_1?: string;
    release_dates?: { certification?: string }[];
  }[];
}

interface CountryProviders {
  link?: string;
  flatrate?: WatchProvider[];
  free?: WatchProvider[];
  ads?: WatchProvider[];
}

interface WatchProviders {
  results?: {
    GB?: CountryProviders;
  };
}

interface Movie {
  title?: string;
  backdrop_path?: string | null;
  release_date?: string;
  runtime?: number;
  overview?: string;
  genres?: Genre[];
  release_dates?: ReleaseDates;
  "watch/providers"?: WatchProviders;
}

export async function getMovie(id: number): Promise<Movie> {
  const cached = await cache.get(String(id));
  if (cached) {
    return cached;
  }

  const url = new URL(`https://api.themoviedb.org/3/movie/${id}`);
  url.searchParams.set("append_to_response", "release_dates,watch/providers");

  const response = await throttledFetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to get movie ${id}: ${response.status}`);
  }

  const data = (await response.json()) as Movie;
  await cache.set(String(id), data);
  return data;
}
