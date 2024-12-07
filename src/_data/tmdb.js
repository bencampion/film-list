import EleventyFetch from "@11ty/eleventy-fetch";
import _ from "lodash";
import fs from "fs/promises";
import nlp from "wink-nlp-utils";

const COUNTRY = "GB";

if (!process.env.TMDB_ACCESS_TOKEN) {
  throw new Error("TMDB_ACCESS_TOKEN is not set in environment");
}

async function get(path) {
  const baseUrl = "https://api.themoviedb.org/";
  const options = {
    duration: "18h",
    type: "json",
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
      },
    },
  };
  return EleventyFetch(new URL(path, baseUrl).href, options);
}

async function getTitle(id) {
  const alternative_titles = await get(`/3/movie/${id}/alternative_titles`);
  const title = alternative_titles.titles.find(
    (title) => title.iso_3166_1 === COUNTRY && title.type === "",
  );
  return title?.title;
}

async function getCertification(id) {
  const release_dates = await get(`/3/movie/${id}/release_dates`);
  const result = release_dates.results.find(
    (result) => result.iso_3166_1 === COUNTRY,
  );
  return _.chain(result?.release_dates)
    .map((release_date) => release_date.certification)
    .filter(_.negate(_.isEmpty))
    .sort()
    .next().value;
}

async function getProviders(id) {
  const providers = await get(`/3/movie/${id}/watch/providers`);
  const flatrate = providers.results[COUNTRY]?.flatrate || [];
  const free = providers.results[COUNTRY]?.free || [];
  const ads = providers.results[COUNTRY]?.ads || [];
  const ignored = [
    /.*with ads/i,
    /BFI Player.*Channel/,
    /Paramount.*Channel/,
    /MUBI.*Channel/,
  ];
  return {
    providers_link: providers.results[COUNTRY]?.link,
    providers: flatrate
      .concat(free)
      .concat(ads)
      .filter(
        (provider) =>
          !ignored.some((regexp) => provider.provider_name.match(regexp)),
      )
      .map((provider) => ({
        ...provider,
        provider_name:
          provider.provider_name === "STUDIOCANAL PRESENTS Apple TV Channel"
            ? "Studiocanal Presents Apple TV Channel"
            : provider.provider_name,
      })),
  };
}

async function getDetails(url) {
  const id = url.match(/\d+/)[0];
  const [details, title, providers, certification] = await Promise.all([
    get(`/3/movie/${id}`),
    getTitle(id),
    getProviders(id),
    getCertification(id),
  ]);

  const [first, ...rest] = nlp.string.sentences(details.overview);
  let count = first.length;
  const overview = [
    first,
    ..._.takeWhile(rest, (next) => (count += next.length) < 250),
  ].join(" ");

  return {
    ...details,
    ...providers,
    certification: certification ?? "?",
    title: title && !title.includes(details.title) ? title : details.title,
    overview,
    link: url,
  };
}

export default async function () {
  const file = await fs.readFile("src/_data/films.txt", { encoding: "utf-8" });
  const urls = file.split("\n").filter(_.negate(_.isEmpty));
  const films = await Promise.all(urls.map(getDetails));

  const genres = _.chain(films)
    .flatMap((film) => film.genres)
    .uniqBy((genre) => genre.id)
    .value();

  const providers = _.chain(films)
    .flatMap((film) => film.providers)
    .uniqBy((provider) => provider.provider_id)
    .value();

  return { films, genres, providers };
}
