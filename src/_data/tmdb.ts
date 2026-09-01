import fs from "node:fs/promises";
import _ from "lodash";
import model from "wink-eng-lite-web-model";
import winkNLP from "wink-nlp";
import { getMovie } from "./api.ts";

const COUNTRY = "GB";

const nlp = winkNLP(model);

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
  const {
    release_dates: allReleaseDates,
    "watch/providers": allWatchProviders,
    ...details
  } = await getMovie(id);

  const monetization = allWatchProviders?.results?.[COUNTRY];
  const providers = [
    ...(monetization?.flatrate ?? []),
    ...(monetization?.free ?? []),
    ...(monetization?.ads ?? []),
  ];
  const dedupedProviders = providers.filter(
    ({ provider_name }) =>
      !providers.some(
        (other) =>
          other.provider_name !== provider_name &&
          provider_name?.startsWith(other.provider_name ?? ""),
      ),
  );

  const releaseDates = allReleaseDates?.results?.find(
    (entry) => entry.iso_3166_1 === COUNTRY,
  )?.release_dates;
  const certification =
    releaseDates
      ?.map((release_date) => release_date.certification)
      .filter(Boolean)[0] ?? "?";

  return {
    ...details,
    providers_link: monetization?.link,
    providers: dedupedProviders,
    certification,
    overview: trimParagraph(details.overview ?? "", 270),
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
