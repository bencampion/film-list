const EleventyFetch = require("@11ty/eleventy-fetch");
const _ = require("lodash");
const fs = require("fs/promises");
const nlp = require("wink-nlp-utils");

const COUNTRY = "GB";

async function get(path) {
  const baseUrl = "https://api.themoviedb.org/";
  const options = {
    duration: "1d",
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
    /Amazon Channel/i,
    /Amazon Prime Video with Ads/i,
    /Apple TV Channel/i,
    /Netflix basic with ads/i,
  ];
  return {
    providers_link: providers.results[COUNTRY]?.link,
    providers: flatrate
      .concat(free)
      .concat(ads)
      .filter(
        (provider) =>
          !ignored.some((regexp) => provider.provider_name.match(regexp)),
      ),
  };
}

async function getDetails(id) {
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
  };
}

module.exports = async function () {
  const urls = await fs.readFile("src/_data/films.txt", { encoding: "utf-8" });
  const ids = _.chain(urls)
    .split("\n")
    .filter(_.negate(_.isEmpty))
    .map((url) => url.match(/\d+/)[0])
    .value();
  const films = await Promise.all(ids.map(getDetails));

  const genres = _.chain(films)
    .flatMap((film) => film.genres)
    .uniqBy((genre) => genre.id)
    .value();

  const providers = _.chain(films)
    .flatMap((film) => film.providers)
    .uniqBy((provider) => provider.provider_id)
    .value();

  return { films, genres, providers };
};
