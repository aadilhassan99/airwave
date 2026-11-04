# Airwave — Free Online Radio

A responsive Next.js radio player that discovers publicly listed radio streams using the Radio Browser community directory. It has station search, genre filters, favorites saved in local storage, playback controls, and volume control.

## Requirements

- Node.js 20.9 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- Responsive desktop and mobile interface
- Search radio stations by name, country, or tags
- Genre/category filters
- Play/pause and station switching
- Volume slider
- Favorites persisted in the browser
- Community station directory with fallback API servers
- No application backend, database, API key, or paid service required

## Notes

- Station availability and stream compatibility vary. A station can be listed but its stream may be offline, block browser playback, or use a format the browser cannot play. Try another station if playback fails.
- The directory is supplied by [Radio Browser](https://www.radio-browser.info/), a community-maintained radio station database. This app uses its public API from the browser; availability depends on that community service and network access.
- Public stream availability does not automatically grant permission to rebroadcast or redistribute audio. This app plays station streams directly and does not rehost them.
- Fonts load from Google Fonts when internet access is available; system fallbacks are used otherwise.

## Deploy for free

You can deploy the project on Vercel's free tier or another host that supports Next.js. Review the host's current free-tier limits before deployment.

## Tech stack

- Next.js App Router
- React
- TypeScript
- Plain CSS (no UI library)
