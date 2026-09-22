import fs from "node:fs/promises";
import _ from "lodash";
import model from "wink-eng-lite-web-model";
import winkNLP from "wink-nlp";
import { getMovie } from "./api";

const COUNTRY = "GB";

const nlp = winkNLP(model);

export type Film = Awaited<ReturnType<typeof getFilm>>;
export type Provider = Film["providers"][number];
export type Genre = NonNullable<Film["genres"]>[number];

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
  const movie = await getMovie(id);

  const monetization = movie["watch/providers"]?.results?.[COUNTRY];
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

  const releaseDates = movie.release_dates?.results?.find(
    (entry) => entry.iso_3166_1 === COUNTRY,
  )?.release_dates;
  const certification =
    releaseDates
      ?.map((release_date) => release_date.certification)
      .find(Boolean) ?? "?";

  return {
    title: movie.title,
    backdrop_path: movie.backdrop_path,
    release_date: movie.release_date,
    runtime: movie.runtime,
    genres: movie.genres,
    overview: trimParagraph(movie.overview ?? "", 270),
    providers_link: monetization?.link,
    providers: dedupedProviders,
    certification,
    link,
  };
}

async function readFilmList() {
  const file = await fs.readFile("src/data/films.txt", { encoding: "utf-8" });
  return file
    .split("\n")
    .filter(Boolean)
    .map((link) => {
      const match = /\d+/.exec(link);
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
