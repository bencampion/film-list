# Film list

A website containing an incomplete list of films released since 2010 that I have enjoyed. You can view the list here:

- https://bencampion.github.io/film-list/

## Details

The site is generated using [Eleventy](https://www.11ty.dev/) with data fetched from [The Movie Database (TMDB) API](https://developer.themoviedb.org/). It is styled using [Tailwind CSS](https://tailwindcss.com/).

## Building

Dev mode:

```console
$ npm run start
```

Production build:

```console
$ npm run build
```

You need a to set a `TMDB_ACCESS_TOKEN` environment variable containing a TMDB API Read Access Token to build the site. You can obtain a token for free by [creating a TMDB account](https://www.themoviedb.org/signup) and [requesting API access](https://www.themoviedb.org/settings/api).
