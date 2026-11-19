# Leonida Legend — GTA VI Trophy Guide & Tracker

[![make.fun](https://make.fun/badge/competition/gta6-trophy-guide-01)](https://make.fun/bounty/gta6-trophy-guide-01)
[![make.fun rank](https://make.fun/badge/rank/gta6-trophy-guide-01)](https://make.fun/bounty/gta6-trophy-guide-01)
[![make.fun reward](https://make.fun/badge/reward/gta6-trophy-guide-01)](https://make.fun/bounty/gta6-trophy-guide-01)

A free, offline GTA VI trophy guide and tracker: all 55 official trophies with a guide in plain words for each one, a roadmap to the platinum, and a checklist that saves in your browser. No accounts, no network, no ads.

## What it is

- **All 55 trophies** — official names, descriptions and grades, verified against the official list (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden; 0 online).
- **A guide for every trophy** — what to do, where, and when it can be missed, in our own words, with its sources cited beside it (PowerPyx, KeenGamer, GTA VIBES, GTASix.how).
- **A roadmap to the platinum** — three stages (~200 hours, difficulty 4/10, one playthrough) plus the 100% completion checklist behind A Long Road.
- **The one missable trophy, flagged loud** — Positive Mental Attitude is the only trophy you can miss. The guide and the banner on the page both tell you exactly what to do in Chapter 1.
- **A tracker** — tick trophies off, filter by kind, grade and status, search, hide story spoilers until you earn a trophy, and export or import your progress as JSON. Progress is stored in your browser only.

## Honesty note

Five trophy methods were still unconfirmed when GTA VI launched on 19 Nov 2026 (In The Beginning…, Capital Offense, Bad Luck, I Guess, The Truth Is Out There, Ten Pin). Those guides say so plainly instead of inventing a method.

## Run it

```sh
node serve.ts          # serves app/ on http://localhost:8080
```

Or open `app/index.html` directly in a browser. Everything is static files — no build step, no server needed.

## Build the dossier

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## Sources

- PowerPyx — GTA 6 Trophy Guide & Roadmap: https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/
- KeenGamer — GTA 6 Trophy Guide & Platinum Roadmap: https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/
- GTA VIBES — GTA 6 Trophy List: https://www.gtavibes.com/guides/gta-6-trophy-list-achievements
- GTASix.how — Trophies: https://gtasix.how/trophies/
- Trophy names, descriptions and grades: the official list, via Exophase and PSNProfiles.

Fan-made guide. Not affiliated with Rockstar Games or Take-Two Interactive. No Rockstar logo or artwork is used.

## License

MIT — see [LICENSE](LICENSE).
