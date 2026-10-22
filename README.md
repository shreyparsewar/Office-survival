# Office Survival 1999

An interactive browser game set in a retro 3D office inspired by *The Office*. Explore the Scranton branch, talk to coworkers, coordinate assignments, and manage your energy, patience, and job security through a full workday.

## Features

- Ten interactive coworkers: Michael, Dwight, Jim, Pam, Ryan, Andy, Stanley, Kevin, Angela, and Oscar.
- An enclosed 3D office with camera rotation, zoom, movement, and character selection.
- Individual dialogue, relationships, assignments, and progress tracking.
- Office stations and activities, scheduled meetings, events, deadlines, and multiple endings.
- Local autosave, optional interface sounds, and pixel portraits.
- Actual 8bitcn components for buttons, cards, dialogs, tabs, inputs, progress bars, and other interface controls. The Three.js characters and office models are custom assets.

## Run locally

Requires Node.js 22.18 or newer and pnpm.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://localhost:3000).

## Promo video

Watch the [20-second animated game promo](videos/office-game-promo/out/office-survival-1999-promo-v2.mp4), rendered at 1080p and 60 fps. Its editable Remotion project and render instructions are in [videos/office-game-promo](videos/office-game-promo/README.md).

## Controls

| Action | Control |
| --- | --- |
| Walk / select a coworker | Click the floor / coworker |
| Rotate the camera | Drag |
| Zoom | Mouse wheel or camera buttons |
| Pan | Right-drag or Shift-drag |
| Move your character | Arrow keys |
| Focus / reset the camera | Camera controls |

Talk to coworkers, assign tasks, and advance office time to make work progress. Office decisions can pause other actions until resolved. Progress is stored in this browser's local storage.

## Project checks

```sh
pnpm test
pnpm typecheck
pnpm build
```

The project exports a static website into `out/` during the production build. Serve that folder with a static hosting service. For local development, use `pnpm dev`.

## Source layout

- `app/scranton-game.tsx` — game interface and state integration.
- `components/scranton/` — Three.js scene, office models, and character models.
- `lib/scranton/` — roster, assignments, movement, and camera bounds.
- `lib/office/` — workday events, activities, endings, and sound.
- `components/ui/8bit/` — 8bitcn interface components.
- `tests/` — simulation, movement, and camera checks.

The `/desk` route contains the earlier desktop-style game. Other earlier design files remain in the source as development history.

## Notes

This is an unofficial fan project and is not affiliated with NBCUniversal or the creators of *The Office*. A WebGL-capable browser is required for the 3D office. Pixel fonts load from Google Fonts; the interface falls back to system fonts if unavailable. No application API keys or backend database are required.

Local recordings, installed capture tools, recovery snapshots, generated builds, and hosting credentials are excluded from Git.
